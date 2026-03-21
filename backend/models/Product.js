const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add a product name' }
        }
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add a product type' }
        }
    },
    metalType: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    metalPurity: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    grossWeight: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0
    },
    netWeight: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0
    },
    stoneWeight: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0
    },
    gemstoneType: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    gemstoneCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    gemstoneCarat: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0
    },
    size: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add a description' }
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Quantity cannot be negative' }
        }
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Cost cannot be negative' }
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Price cannot be negative' }
        }
    },
    designerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'designers',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    frontImage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rearImage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    otherImages: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'products',
    timestamps: true,
    indexes: [
        { fields: ['type'] },
        { fields: ['designerId'] },
        { fields: ['quantity'] },
        { fields: ['sku'], unique: true }
    ]
});

// Instance methods
Product.prototype.lowStock = function() {
    const LOW_QUANTITY = 5;
    return this.quantity <= LOW_QUANTITY && this.quantity > 0;
};

Product.prototype.outOfStock = function() {
    return this.quantity <= 0;
};

Product.prototype.calculateMarkup = function() {
    return parseFloat(this.price) - parseFloat(this.cost);
};

Product.prototype.calculateProfit = function() {
    return parseFloat(this.price) - parseFloat(this.cost);
};

Product.prototype.calculateMarginPercentage = function() {
    const profit = this.calculateProfit();
    const price = parseFloat(this.price);
    return price > 0 ? ((profit / price) * 100).toFixed(2) : 0;
};

module.exports = Product;
