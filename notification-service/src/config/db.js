const { Sequelize } = require('sequelize');

// Connection string matches the environment variables in docker-compose
const sequelize = new Sequelize('notification_db', 'user', 'password', {
  host: process.env.DB_HOST ||'notification-db', // Use 'db' if running the app inside Docker, 'localhost' if running Node locally
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };