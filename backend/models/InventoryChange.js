const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InventoryChange = sequelize.define('InventoryChange', {
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
    changeType: {
        type: DataTypes.ENUM('restock', 'sale', 'adjustment', 'return', 'damage', 'transfer'),
        allowNull: false,
        comment: 'Type of inventory change'
    },
    quantityBefore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Stock quantity before change'
    },
    quantityChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Change in quantity (positive or negative)'
    },
    quantityAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Stock quantity after change'
    },
    referenceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of reference (SALE, PURCHASE_ORDER, etc.)'
    },
    referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the related transaction'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for the inventory change'
    },
    performedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'User who performed the change'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'inventory_changes',
    timestamps: true,
    updatedAt: false,
    indexes: [
        { fields: ['productId'] },
        { fields: ['changeType'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = InventoryChange;
