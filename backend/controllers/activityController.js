const { UserActivity } = require('../models');

// @desc    Log a client-side activity
// @route   POST /api/activities/log
// @access  Public
exports.logClientActivity = async (req, res) => {
    try {
        const { action, entityType, entityId, description } = req.body;
        
        if (!action || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Action and description are required' 
            });
        }

        const activity = await UserActivity.create({
            userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
            sessionId: req.headers['x-session-id'] || req.sessionID || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            action,
            entityType: entityType || 'SYSTEM',
            entityId: entityId || null,
            description,
            success: true
        });

        // Broadcast activity if websocket service is available
        // Note: activityLogger middleware usually handles this, but since we're manually creating,
        // we might need to manually trigger broadcast if we want real-time update for this custom log.
        // Importing websocketService here might cause circular deps if not careful, 
        // but let's see if we can just rely on the database entry being picked up or if we need to emit.
        // For now, let's assume the dashboard polling or WS elsewhere handles "recent activities".
        // Actually, dashboardController listens to WS events. 
        // The activityLogger middleware automatically broadcasts. 
        // Since we are NOT using the middleware here (we are the controller), we should broadcast.
        
        try {
            const websocketService = require('../services/websocketService');
            websocketService.broadcastActivity({
                id: activity.id,
                action: activity.description,
                entityType: activity.entityType,
                userName: activity.userId || 'Dharaneesh C',
                timestamp: activity.createdAt
            });
        } catch (wsError) {
            console.warn('Failed to broadcast client activity:', wsError);
        }

        res.status(201).json({
            success: true,
            message: 'Activity logged successfully',
            data: activity
        });
    } catch (error) {
        console.error('Error logging client activity:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to log activity', 
            error: error.message 
        });
    }
};
