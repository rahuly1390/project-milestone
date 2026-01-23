const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  notificationId: { type: DataTypes.STRING, primaryKey: true },
  correlationId: { type: DataTypes.UUID, allowNull: false },
  channel: { type: DataTypes.ENUM('SMS', 'EMAIL'), allowNull: false },
  toMasked: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' },
  providerRef: { type: DataTypes.STRING },
  payload: { type: DataTypes.JSONB },
  metadata: { type: DataTypes.JSONB }
}, { timestamps: true });

module.exports = Notification;