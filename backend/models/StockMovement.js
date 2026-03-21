const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StockMovement = sequelize.define('StockMovement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    movementType: {
        type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'damage', 'transfer'),
        allowNull: false,
        comment: 'Type of stock movement'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Positive for stock in, negative for stock out'
    },
    previousStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Stock level before this movement'
    },
    newStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Stock level after this movement'
    },
    referenceType: {
        type: DataTypes.ENUM('sale', 'purchase_order', 'adjustment', 'return', 'other'),
        allowNull: true,
        comment: 'Type of reference document'
    },
    referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the related document (sale_id, purchase_order_id, etc.)'
    },
    referenceNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Reference document number (invoice number, PO number, etc.)'
    },
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Price per unit at time of movement'
    },
    totalValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Total value of this movement'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    performedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'User who performed this action'
    },
    movementDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'stock_movements',
    timestamps: true,
    indexes: [
        { fields: ['productId'] },
        { fields: ['movementType'] },
        { fields: ['referenceType', 'referenceId'] },
        { fields: ['movementDate'] }
    ]
});

module.exports = StockMovement;
