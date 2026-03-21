const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RepairOrder = sequelize.define('RepairOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  tokenNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  customerName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  productName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  productSKU: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  metalType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  estimatedWeight: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  serviceType: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('Normal', 'Urgent'),
    allowNull: false,
    defaultValue: 'Normal'
  },
  issueDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receivedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expectedDeliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  actualDeliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  repairCharges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  advancePayment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  balanceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  repairNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  tableName: 'repair_orders',
  timestamps: true
});

module.exports = RepairOrder;
