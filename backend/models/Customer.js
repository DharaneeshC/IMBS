const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fullName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'full_name',
        validate: {
            notEmpty: { msg: 'Full name is required' }
        }
    },
    displayName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'display_name'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Phone number is required' }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: { msg: 'Invalid email format' }
        }
    },
    customerType: {
        type: DataTypes.ENUM('Regular', 'Wholesale', 'VIP', 'Other'),
        defaultValue: 'Regular',
        allowNull: false,
        field: 'customer_type'
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Blocked'),
        defaultValue: 'Active',
        allowNull: false
    },
    gstin: {
        type: DataTypes.STRING(15),
        allowNull: true,
        comment: 'GST/Tax identification number'
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth'
    },
    streetAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'street_address'
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    pinCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'pin_code'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    totalPurchases: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        field: 'total_purchases'
    },
    invoiceCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'invoice_count'
    },
    lastPurchaseDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_purchase_date'
    },
    source: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'manual'
    }
}, {
    tableName: 'customers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['phone'] },
        { fields: ['email'] },
        { fields: ['customer_type'] },
        { fields: ['status'] }
    ]
});

// Instance methods
Customer.prototype.getFullName = function() {
    return this.fullName;
};

module.exports = Customer;
