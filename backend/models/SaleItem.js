const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SaleItem = sequelize.define('SaleItem', {
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
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    productName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Snapshot of product name at time of sale'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Quantity must be at least 1' }
        }
    },
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per unit at time of sale'
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Total price for this line item (quantity * unitPrice)'
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: true,
        comment: 'Discount applied to this item'
    },
    taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 3,
        allowNull: true,
        comment: 'Tax rate percentage'
    },
    taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: true,
        comment: 'Tax amount'
    },
    lineTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Line total (unitPrice * quantity + tax)'
    }
}, {
    tableName: 'sale_items',
    timestamps: true,
    indexes: [
        { fields: ['saleId'] },
        { fields: ['productId'] }
    ]
});

module.exports = SaleItem;
