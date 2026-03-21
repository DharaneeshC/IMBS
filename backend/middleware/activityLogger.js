const UserActivity = require('../models/UserActivity');
const websocketService = require('../services/websocketService');

/**
 * Activity Logger Middleware
 * Logs all user activities to the database and broadcasts real-time updates
 */

const logActivity = async (req, action, entityType, entityId, description, oldValue = null, newValue = null) => {
    try {
        const userId = req.user?.id || req.user?.email || 'system';
        const userName = req.user?.fullName || req.user?.email || 'System';

        const activity = await UserActivity.create({
            userId: userId.toString(),
            sessionId: req.sessionID || null,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            action: action,
            entityType: entityType,
            entityId: entityId,
            description: `${description} by ${userName}`,
            oldValue: oldValue,
            newValue: newValue,
            statusCode: 200,
            success: true
        });

        // Broadcast activity via WebSocket
        websocketService.broadcastActivity({
            id: activity.id,
            action: activity.description,
            entityType: activity.entityType,
            userName: userName,
            timestamp: activity.createdAt
        });

        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

/**
 * Activity logging wrapper for route handlers
 */
const activityLogger = (action, entityType, getDescription) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to capture response
        res.send = function(data) {
            // Log activity if response is successful
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const entityId = req.params.id || req.body?.id || null;
                const description = typeof getDescription === 'function'
                    ? getDescription(req, res)
                    : getDescription;

                logActivity(
                    req,
                    action,
                    entityType,
                    entityId,
                    description,
                    req.oldValue || null,
                    req.newValue || null
                ).catch(err => console.error('Activity logging failed:', err));

                // Broadcast specific updates based on entity type
                if (entityType === 'product' && entityId) {
                    websocketService.broadcastInventoryUpdate(entityId, action, JSON.parse(data || '{}'));
                } else if (entityType === 'sale' && entityId) {
                    websocketService.broadcastSalesUpdate(entityId, action, JSON.parse(data || '{}'));
                } else if (entityType === 'purchase_order' && entityId) {
                    websocketService.broadcastPurchaseUpdate(entityId, action, JSON.parse(data || '{}'));
                }

                // Broadcast dashboard update for any significant changes
                websocketService.broadcastDashboardUpdate({
                    action,
                    entityType,
                    entityId,
                    timestamp: new Date()
                });
            }

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    logActivity,
    activityLogger
};
