const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const crypto = require('crypto');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

/**
 * POST /api/login
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
        
        if (!user) {
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }

        // Generate Token (using customer_id as the 'sub' field)
        const token = jwt.sign(
            { sub: user.customer_id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                name: user.username,
                email: user.email,
                customerId: user.customer_id
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});

/**
 * POST /api/register (For testing)
 */
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const customerId = `cust_${crypto.randomBytes(3).toString('hex')}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.none(
            'INSERT INTO users(username, email, password_hash, customer_id) VALUES($1, $2, $3, $4)',
            [username, email, hashedPassword, customerId]
        );
        res.status(201).json({ message: "User created", customerId });
    } catch (err) {
        res.status(400).json({ error: "User already exists" });
    }
});

module.exports = router;