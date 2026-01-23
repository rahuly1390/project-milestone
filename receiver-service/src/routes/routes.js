// module.exports = router;
const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const router = express.Router();
const { publishReceiverCreated } = require('../producer');
/**
 * 1) Create Receiver
 * POST /v1/receivers
 */
router.post('/receivers', async (req, res) => {
    const { name, ifsc, accountNumber } = req.body;
    const customerId = req.user.sub;

    const dedupeHash = crypto.createHash('sha256')
        .update(`${customerId}|${ifsc}|${accountNumber}`).digest('hex');

    try {
        const receiverId = `rcv_${crypto.randomBytes(3).toString('hex')}`;
        const accountLast4 = accountNumber.slice(-4);

        await db.none(`
            INSERT INTO receivers (receiver_id, customer_id, name, ifsc, account_number_enc, account_last4, status, dedupe_hash)
            VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_OTP_VERIFICATION', $7)`,
            [receiverId, customerId, name, ifsc, 'ENC_VAL', accountLast4, dedupeHash]
        );

        // 2. Trigger Saga Event
        const eventData = {
            receiverId: "rcv_99", // From your DB save
            name: req.body.name,
            email: req.user.email // From your JWT token
        };
        
        await publishReceiverCreated(eventData);

        res.status(201).json({
            receiverId,
            status: 'PENDING_OTP_VERIFICATION',
            name,
            bank: { ifsc },
            maskedAccount: `********${accountLast4}`,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'DUPLICATE_RECEIVER' });
        res.status(400).json({ error: 'VALIDATION_ERROR' });
    }
});

/**
 * 2) Send OTP
 * POST /v1/receivers/{receiverId}/otp
 */
router.post('/receivers/:receiverId/otp', async (req, res) => {
    const { receiverId } = req.params;

    try {
        const receiver = await db.oneOrNone('SELECT * FROM receivers WHERE receiver_id = $1 AND customer_id = $2', [receiverId, req.user.sub]);
        if (!receiver) return res.status(404).json({ error: 'RECEIVER_NOT_FOUND' });

        // Generate random 6-digit OTP
        const generatedOtp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        
        // PRINT TO CONSOLE FOR TESTING
        console.log(`\n[MOCK OTP SERVICE] OTP for Receiver ${receiverId}: ${generatedOtp}\n`);

        const otpRequestId = `otp_${crypto.randomBytes(3).toString('hex')}`;
        const expiresAt = new Date(Date.now() + 300 * 1000); 

        await db.none(`
            INSERT INTO otp_requests (otp_request_id, receiver_id, status, expires_at, otp_code)
            VALUES ($1, $2, 'SENT', $3, $4)`,
            [otpRequestId, receiverId, expiresAt, generatedOtp]
        );

        res.status(202).json({
            otpRequestId,
            receiverId,
            status: 'SENT',
            expiresInSeconds: 300,
            oneTimeUse: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});

/**
 * 3) Verify OTP
 * POST /v1/receivers/{receiverId}/verify-otp
 */
router.post('/receivers/:receiverId/verify-otp', async (req, res) => {
    const { receiverId } = req.params;
    const { otpRequestId, otp } = req.body;

    try {
        const otpReq = await db.oneOrNone(
            'SELECT * FROM otp_requests WHERE otp_request_id = $1 AND receiver_id = $2', 
            [otpRequestId, receiverId]
        );
        
        if (!otpReq) return res.status(404).json({ error: 'INVALID_REQUEST' });
        
        // Debugging logs - Check your terminal!
        console.log(`Comparing Input: "${otp}" with DB: "${otpReq.otp_code}"`);

        // Convert both to string to be safe
        if (String(otp) !== String(otpReq.otp_code)) {
            return res.status(400).json({ error: 'OTP_INVALID' });
        }

         // 3. Mark as Verified
        await db.tx(async t => {
            await t.none('UPDATE receivers SET status = $1 WHERE receiver_id = $2', ['VERIFIED', receiverId]);
            // Delete OTP after use (one-time use policy)
            await t.none('DELETE FROM otp_requests WHERE otp_request_id = $1', [otpRequestId]);
        });

        res.status(200).json({
            receiverId,
            status: "VERIFIED",
            verifiedAt: new Date().toISOString(),
            limits: {
                type: "TEMPORARY",
                amount: 50000,
                currency: "INR",
                validUntil: new Date(Date.now() + 86400000).toISOString(),
                reason: "FIRST_24_HOURS_AFTER_VERIFICATION"
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
});
/**
 * 4) List Receivers
 * GET /v1/receivers
 */
router.get('/receivers', async (req, res) => {
    const customerId = req.user.sub;
    const { status } = req.query;

    let query = 'SELECT receiver_id as "receiverId", name, account_last4, ifsc, status, created_at FROM receivers WHERE customer_id = $1';
    const params = [customerId];

    if (status) {
        query += ' AND status = $2';
        params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const items = await db.any(query, params);
    
    res.json({
        page: 1,
        size: 20,
        total: items.length,
        items: items.map(i => ({
            ...i,
            maskedAccount: `********${i.account_last4}`
        }))
    });
});

module.exports = router;