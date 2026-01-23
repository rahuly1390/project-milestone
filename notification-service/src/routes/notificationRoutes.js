const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const ProviderFactory = require('../providers/ProviderFactory');

// POST /v1/notifications/send
router.post('/send', async (req, res) => {
  const { channel, to, category, subject, message, metadata } = req.body;
  const notificationId = `ntf_${Math.random().toString(36).substr(2, 9)}`;
  const correlationId = uuidv4();

  // Helper to mask PII
  const mask = (val) => val.includes('@') ? val.replace(/^(..)(.*)(?=@)/, '$1***') : val.slice(-4).padStart(val.length, '*');

  try {
    // 1. Save to DB (PENDING)
    const record = await Notification.create({
      notificationId, correlationId, channel, category, metadata,
      toMasked: mask(to),
      payload: req.body
    });

    // 2. Fire and Forget (Async Provider Call)
    const provider = ProviderFactory(channel);
    provider.send(req.body).then(async (ref) => {
      console.log(`✅ Email sent successfully! Ref: ${ref}`);
      await record.update({ status: 'SENT', providerRef: ref });
    }).catch(async (err) => {
      console.error(`❌ Email Provider Error:`, err.message); // Add this log!
      await record.update({ status: 'FAILED' });
    });

    // 3. Respond 202 Accepted immediately
    res.status(202).json({
      notificationId, status: "SENT", channel, 
      providerRef: "pending", correlationId
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /v1/notifications/:id
router.get('/:id', async (req, res) => {
  const ntf = await Notification.findByPk(req.params.id);
  if (!ntf) return res.status(404).json({ error: "Not Found" });
  res.json(ntf);
});

module.exports = router;