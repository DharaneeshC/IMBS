const WebSocket = require('ws');
const { sequelize, Product } = require('../models');
const { QueryTypes } = require('sequelize');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Set();
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            console.log('WebSocket client connected');
            this.clients.add(ws);

            // Send initial connection message
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to IBMS WebSocket server',
                timestamp: new Date()
            }));

            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        // Check for low stock alerts every 30 seconds
        setInterval(() => {
            this.checkLowStockAlerts();
        }, 30000);

        console.log('WebSocket server initialized');
    }

    async checkLowStockAlerts() {
        try {
            const lowStockProducts = await sequelize.query(`
                SELECT
                    id,
                    name,
                    sku,
                    quantity,
                    5 as reorderLevel
                FROM products
                WHERE quantity < 5 AND quantity >= 0
                ORDER BY quantity ASC
            `, { type: QueryTypes.SELECT });

            if (lowStockProducts.length > 0) {
                this.broadcast({
                    type: 'LOW_STOCK_ALERT',
                    data: lowStockProducts,
                    count: lowStockProducts.length,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Error checking low stock alerts:', error);
        }
    }

    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    // Broadcast activity updates
    broadcastActivity(activity) {
        this.broadcast({
            type: 'ACTIVITY_UPDATE',
            data: activity,
            timestamp: new Date()
        });
    }

    // Broadcast dashboard updates
    broadcastDashboardUpdate(data) {
        this.broadcast({
            type: 'DASHBOARD_UPDATE',
            data: data,
            timestamp: new Date()
        });
    }

    // Broadcast inventory updates
    broadcastInventoryUpdate(productId, action, data) {
        this.broadcast({
            type: 'INVENTORY_UPDATE',
            productId,
            action,
            data,
            timestamp: new Date()
        });
    }

    // Broadcast sales/invoice updates
    broadcastSalesUpdate(saleId, action, data) {
        this.broadcast({
            type: 'SALES_UPDATE',
            saleId,
            action,
            data,
            timestamp: new Date()
        });
    }

    // Broadcast purchase order updates
    broadcastPurchaseUpdate(purchaseOrderId, action, data) {
        this.broadcast({
            type: 'PURCHASE_UPDATE',
            purchaseOrderId,
            action,
            data,
            timestamp: new Date()
        });
    }
}

module.exports = new WebSocketService();