const amqp = require('amqplib');

async function publishReceiverCreated(data) {
  let connection;
  try {
    // Connect to RabbitMQ using the service name from docker-compose
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
    const channel = await connection.createChannel();
    
    const exchange = 'receiver_exchange';
    const routingKey = 'receiver.created';

    // Ensure the exchange exists
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const payload = Buffer.from(JSON.stringify(data));
    
    // Publish the message
    channel.publish(exchange, routingKey, payload, { persistent: true });

    console.log(" [📤] Saga Producer: Sent Event 'receiver.created' for:", data.name);
    
    await channel.close();
  } catch (error) {
    console.error(" [❌] RabbitMQ Producer Error:", error);
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { publishReceiverCreated };