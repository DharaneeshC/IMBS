const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Designer = sequelize.define('Designer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    companyName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add a company name' }
        }
    },
    displayName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add a display name' }
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add a designer name' }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: { 
            msg: 'Email already exists' 
        },
        validate: {
            notEmpty: { msg: 'Please add an email' },
            isEmail: { msg: 'Please add a valid email' }
        },
        set(value) {
            this.setDataValue('email', value.toLowerCase().trim());
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    street: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    pincode: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'India'
    },
    gstin: {
        type: DataTypes.STRING(20),
        allowNull: true,
        set(value) {
            if (value) {
                this.setDataValue('gstin', value.toUpperCase().trim());
            }
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false
    }
}, {
    tableName: 'designers',
    timestamps: true,
    indexes: [
        { fields: ['email'], unique: true },
        { fields: ['status'] }
    ]
});

module.exports = Designer;
