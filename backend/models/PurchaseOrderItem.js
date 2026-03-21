const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchaseOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'purchase_orders',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
        field: 'product_name',
        comment: 'Name of the product if not in inventory yet'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Quantity must be at least 1' }
        }
    },
    receivedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Quantity received so far'
    },
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Unit price cannot be negative' }
        }
    },
    taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tax rate in percentage'
    },
    taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    lineTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total for this line item including tax'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'purchase_order_items',
    timestamps: true,
    indexes: [
        { fields: ['purchaseOrderId'] },
        { fields: ['productId'] }
    ]
});

module.exports = PurchaseOrderItem;
