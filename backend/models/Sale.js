const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoiceNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique invoice number'
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'customers',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Reference to customer (optional for walk-in)'
    },
    customerName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    customerEmail: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    customerPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    customerAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    saleDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'partial', 'paid', 'refunded'),
        defaultValue: 'pending',
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'other'),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('draft', 'confirmed', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'confirmed',
        allowNull: false
    }
}, {
    tableName: 'sales',
    timestamps: true,
    indexes: [
        { fields: ['customerEmail'] },
        { fields: ['paymentStatus'] },
        { fields: ['status'] },
        { fields: ['saleDate'] }
    ]
});

module.exports = Sale;
