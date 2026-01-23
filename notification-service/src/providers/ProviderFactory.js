//This handles the logic of switching between Email (Real) and SMS (Mock).
const nodemailer = require('nodemailer');

// 1. Email Provider (Using MailDev for testing)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "maildev",
  port: 1025, // MailDev SMTP port
  ignoreTLS: true
});

const EmailProvider = {
  send: async (data) => {
    const info = await transporter.sendMail({
      from: '"Notification Service" <no-reply@system.com>',
      to: data.to,
      subject: data.subject,
      html: data.message
    });
    return info.messageId;
  }
};

// 2. Mock SMS Provider
const MockSMSProvider = {
  send: async (data) => {
    console.log(`[MOCK SMS] Sending to ${data.to}: ${data.message}`);
    return `mock_sms_${Date.now()}`;
  }
};

module.exports = (channel) => {
  return channel === 'EMAIL' ? EmailProvider : MockSMSProvider;
};