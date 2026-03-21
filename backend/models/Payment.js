const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    saleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sales',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0.01], msg: 'Amount must be greater than 0' }
        }
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other'),
        allowNull: false
    },
    transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Transaction/Reference ID from payment gateway'
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'completed',
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
        { fields: ['saleId'] },
        { fields: ['paymentDate'] },
        { fields: ['status'] }
    ]
});

module.exports = Payment;
