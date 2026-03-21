const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserActivity = sequelize.define('UserActivity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'User identifier (for future user authentication system)'
    },
    sessionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Session identifier for tracking user sessions'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP address of the user'
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Browser/device information'
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Action performed (e.g., CREATE, UPDATE, DELETE, VIEW, LOGIN)'
    },
    entityType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of entity affected (PRODUCT, DESIGNER, INVOICE, etc.)'
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the affected entity'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description of the activity'
    },
    oldValue: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Previous state (for updates)'
    },
    newValue: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'New state (for updates)'
    },
    statusCode: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'HTTP status code of the request'
    },
    success: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether the action was successful'
    }
}, {
    tableName: 'user_activities',
    timestamps: true,
    updatedAt: false,
    indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['entityType'] },
        { fields: ['entityId'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = UserActivity;
