const amqp = require('amqplib');
const nodemailer = require('nodemailer');

// Setup MailDev Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'maildev',
  port: process.env.SMTP_PORT || 1025,
  ignoreTLS: true
});

async function startNotificationWorker() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
    const channel = await connection.createChannel();

    const exchange = 'receiver_exchange';
    await channel.assertExchange(exchange, 'topic', { durable: true });

    const q = await channel.assertQueue('notification_queue', { durable: true });
    await channel.bindQueue(q.queue, exchange, 'receiver.created');

    console.log(" [🚀] Saga Consumer: Listening for events on 'notification_queue'...");

    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        console.log(" [📥] Saga Step 2: Received Data for:", content.name);

        try {
          // Send the actual email
          await transporter.sendMail({
            from: '"Saga System" <no-reply@mailproject.com>',
            to: content.email,
            subject: 'Receiver Successfully Added!',
            text: `Hi ${content.name}, a new receiver has been added to your account.`,
            html: `<b>Hi ${content.name}</b>,<br>A new receiver has been added to your account.`
          });

          console.log(` [✅] Email successfully sent to ${content.email}`);
          channel.ack(msg);
        } catch (emailErr) {
          console.error(" [❌] Email Failed:", emailErr);
          // In a full Saga, you would publish a 'FAILURE' event here to rollback
          channel.nack(msg, false, false); 
        }
      }
    });
  } catch (error) {
    console.error(" [❌] RabbitMQ Consumer Error:", error);
  }
}

module.exports = startNotificationWorker;