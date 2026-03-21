const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Must be a valid email address'
            }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'staff'),
        defaultValue: 'staff',
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeSave: async (user) => {
            // Hash password only if it's new or changed, and not already hashed
            if (user.changed('password') && !user.password.startsWith('$2a$')) {
                console.log('Hashing password for user:', user.email);
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to validate password
User.prototype.validatePassword = async function(password) {
    console.log('Validating password for user:', this.email);
    const isValid = await bcrypt.compare(password, this.password);
    console.log('Password validation result:', isValid);
    return isValid;
};

// Don't send password in JSON responses
User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
};

module.exports = User;
