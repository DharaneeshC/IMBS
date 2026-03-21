const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    poNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique purchase order number'
    },
    designerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'designers',
            key: 'id'
        },
        field: 'designerId', // Map correctly
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    orderDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    expectedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    actualDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true
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
    shippingCost: {
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
        type: DataTypes.ENUM('pending', 'partial', 'paid'),
        defaultValue: 'pending',
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'received', 'partial', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Order status'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    receivedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Person who received the order'
    }
}, {
    tableName: 'purchase_orders',
    timestamps: true,
    indexes: [
        { fields: ['poNumber'], unique: true },
        { fields: ['designerId'] },
        { fields: ['status'] },
        { fields: ['orderDate'] }
    ]
});

module.exports = PurchaseOrder;
