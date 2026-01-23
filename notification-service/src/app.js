require('dotenv').config();
const express = require('express');
const { sequelize, connectDB } = require('./config/db'); // Import connectDB
const notificationRoutes = require('./routes/notificationRoutes');
const swaggerUi = require('swagger-ui-express');
const startNotificationWorker = require('./consumer');
const app = express();
app.use(express.json());

// Routes
console.log('🛠️ Initializing routes...');
app.use('/v1/notifications', notificationRoutes);
// Simple Swagger Definition
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Notification Service API',
    version: '1.0.0',
    description: 'API for sending SMS and Email notifications',
  },
  paths: {
    '/v1/notifications/send': {
      post: {
        summary: 'Send a notification',
        description: 'Synchronously request a notification to be sent (Command API)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['channel', 'to', 'category', 'message'],
                properties: {
                  channel: { type: 'string', enum: ['EMAIL', 'SMS'], example: 'EMAIL' },
                  to: { type: 'string', example: 'customer@test.com' },
                  category: { type: 'string', example: 'SECURITY_ALERT' },
                  subject: { type: 'string', example: 'OTP Locked' },
                  message: { type: 'string', example: 'Your OTP verification is locked due to multiple failed attempts.' },
                  metadata: {
                    type: 'object',
                    properties: {
                      customerId: { type: 'string', example: 'cus_123' },
                      eventType: { type: 'string', example: 'OTP_LOCKED' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '202': {
            description: 'Accepted',
            content: {
              'application/json': {
                example: {
                  notificationId: "ntf_12345",
                  status: "SENT",
                  channel: "EMAIL",
                  correlationId: "c0a8012e-9fd2-4d9e-8c64-8a2a5e2d2f11"
                }
              }
            }
          }
        }
      }
    },
    '/v1/notifications/{notificationId}': {
      get: {
        summary: 'Get notification status',
        parameters: [
          {
            name: 'notificationId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'ntf_12345'
          }
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                example: {
                  notificationId: "ntf_12345",
                  channel: "EMAIL",
                  toMasked: "cu*******@test.com",
                  status: "DELIVERED",
                  createdAt: "2026-01-13T10:13:02Z"
                }
              }
            }
          },
          '404': { description: 'Notification not found' }
        }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
startNotificationWorker();
const PORT = process.env.PORT || 3002;

const startServer = async () => {
  await connectDB(); // Ensure DB is up
  
  // sync({ alter: true }) updates tables if you change the model
  await sequelize.sync({ alter: true }); 
  
  app.listen(PORT, () => {
    console.log(`🚀 Service running on http://localhost:${PORT}`);
    console.log(`📧 MailDev UI available at http://localhost:1080`);
  });
};

startServer();