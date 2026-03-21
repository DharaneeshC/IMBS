// ============================================
// ENHANCED DASHBOARD CONTROLLER
// For Professional Jewelry Dashboard
// ============================================

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

// @desc    Get comprehensive dashboard data
// @route   GET /api/dashboard
// @access  Public
exports.getComprehensiveDashboard = async (req,res) => {
    try {
        console.log('Fetching comprehensive dashboard data...');

        // 1. TODAY'S PERFORMANCE
        const [todayPerformance] = await sequelize.query(`
            SELECT
                COALESCE(COUNT(DISTINCT s.id), 0) as invoices,
                COALESCE(SUM(s.totalAmount), 0) as revenue,
                COALESCE(AVG(s.totalAmount), 0) as avgOrder,
                COALESCE(SUM(si.quantity), 0) as itemsSold,
                COALESCE(SUM((si.unitPrice - COALESCE(p.cost, 0)) * si.quantity), 0) as profit,
                CASE
                    WHEN SUM(s.totalAmount) > 0
                    THEN (SUM((si.unitPrice - COALESCE(p.cost, 0)) * si.quantity) / SUM(s.totalAmount)) * 100
                    ELSE 0
                END as marginPercent
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.saleId
            LEFT JOIN products p ON si.productId = p.id
            WHERE DATE(s.saleDate) = CURDATE()
        `, { type: QueryTypes.SELECT });

        // 2. SALES VS PURCHASES - This Month
        const [thisMonth] = await sequelize.query(`
            SELECT
                COALESCE((SELECT SUM(totalAmount) FROM sales
                    WHERE MONTH(saleDate) = MONTH(CURDATE())
                    AND YEAR(saleDate) = YEAR(CURDATE())), 0) as sales,
                COALESCE((SELECT SUM(totalAmount) FROM purchase_orders
                    WHERE MONTH(orderDate) = MONTH(CURDATE())
                    AND YEAR(orderDate) = YEAR(CURDATE())), 0) as purchases
        `, { type: QueryTypes.SELECT });

        // 3. SALES VS PURCHASES - Last Month
        const [lastMonth] = await sequelize.query(`
            SELECT
                COALESCE((SELECT SUM(totalAmount) FROM sales
                    WHERE MONTH(saleDate) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                    AND YEAR(saleDate) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))), 0) as sales,
                COALESCE((SELECT SUM(totalAmount) FROM purchase_orders
                    WHERE MONTH(orderDate) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                    AND YEAR(orderDate) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))), 0) as purchases
        `, { type: QueryTypes.SELECT });

        // 4. WEEKLY SALES TREND (Last 4 weeks)
        const weeklySales = await sequelize.query(`
            SELECT
                YEARWEEK(saleDate, 1) as week_num,
                COUNT(id) as invoices,
                COALESCE(SUM(totalAmount), 0) as revenue,
                COALESCE(AVG(totalAmount), 0) as avgOrder
            FROM sales
            WHERE saleDate >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
            GROUP BY YEARWEEK(saleDate, 1)
            ORDER BY week_num ASC
        `, { type: QueryTypes.SELECT });

        // 5. DEAD STOCK (90+ days unsold)
        const deadStock = await sequelize.query(`
            SELECT
                p.id,
                p.name as product_name,
                p.sku,
                p.type as category,
                p.quantity as current_stock,
                DATEDIFF(CURDATE(), COALESCE(p.updatedAt, p.createdAt)) as days_unsold
            FROM products p
            WHERE p.quantity > 0
                AND DATEDIFF(CURDATE(), COALESCE(p.updatedAt, p.createdAt)) >= 90
            ORDER BY days_unsold DESC
            LIMIT 20
        `, { type: QueryTypes.SELECT });

        // 6. STOCK SUMMARY
        const [stockSummary] = await sequelize.query(`
            SELECT
                COUNT(DISTINCT sku) as totalItems,
                COALESCE(SUM(quantity), 0) as totalStock,
                SUM(CASE WHEN quantity < 5 AND quantity > 0 THEN 1 ELSE 0 END) as lowStockCount,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount
            FROM products
        `, { type: QueryTypes.SELECT });

        // 7. RECENT RECEIPTS (Last 10 purchase orders)
        const recentReceipts = await sequelize.query(`
            SELECT
                po.id,
                po.poNumber as receipt_number,
                d.companyName as supplier_name,
                COUNT(poi.id) as total_items,
                po.totalAmount as total_amount,
                po.orderDate as purchase_date,
                po.status
            FROM purchase_orders po
            LEFT JOIN designers d ON po.designerId = d.id
            LEFT JOIN purchase_order_items poi ON po.id = poi.purchaseOrderId
            GROUP BY po.id, po.poNumber, d.companyName, po.totalAmount, po.orderDate, po.status
            ORDER BY po.orderDate DESC, po.id DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT });

        // 8. PENDING TASKS
        const [pendingTasks] = await sequelize.query(`
            SELECT
                (SELECT COUNT(*) FROM purchase_orders WHERE status = 'pending') as purchasesToReceive,
                (SELECT COUNT(*) FROM purchase_orders WHERE status = 'partial') as purchasesInProgress,
                (SELECT COUNT(*) FROM sales WHERE status = 'confirmed') as salesToPack,
                (SELECT COUNT(*) FROM sales WHERE status = 'shipped') as salesToShip,
                (SELECT COUNT(*) FROM sales WHERE status = 'delivered') as salesToDeliver,
                (SELECT COUNT(*) FROM sales WHERE invoiceNumber IS NULL OR invoiceNumber = '') as toBeInvoiced
        `, { type: QueryTypes.SELECT });

        // 9. LOW STOCK ALERTS
        const lowStockAlerts = await sequelize.query(`
            SELECT
                id,
                name as product_name,
                sku,
                quantity as current_stock,
                5 as reorder_level,
                (5 - quantity) as shortage
            FROM products
            WHERE quantity < 5
                AND quantity >= 0
            ORDER BY shortage DESC
            LIMIT 20
        `, { type: QueryTypes.SELECT });

        // 10. RECENT ACTIVITIES (from user_activities table)
        const recentActivities = await sequelize.query(`
            SELECT
                id,
                action,
                entityType,
                description,
                userId as userName,
                createdAt as timestamp
            FROM user_activities
            ORDER BY createdAt DESC
            LIMIT 50
        `, { type: QueryTypes.SELECT });

        // Format response data
        const responseData = {
            success: true,
            data: {
                todayPerformance: {
                    invoices: parseInt(todayPerformance.invoices) || 0,
                    revenue: parseFloat(todayPerformance.revenue) || 0,
                    avgOrder: parseFloat(todayPerformance.avgOrder) || 0,
                    itemsSold: parseInt(todayPerformance.itemsSold) || 0,
                    profit: parseFloat(todayPerformance.profit) || 0,
                    marginPercent: parseFloat(todayPerformance.marginPercent) || 0
                },
                salesVsPurchases: {
                    thisMonth: {
                        sales: parseFloat(thisMonth.sales) || 0,
                        purchases: parseFloat(thisMonth.purchases) || 0,
                        profit: (parseFloat(thisMonth.sales) || 0) - (parseFloat(thisMonth.purchases) || 0)
                    },
                    lastMonth: {
                        sales: parseFloat(lastMonth.sales) || 0,
                        purchases: parseFloat(lastMonth.purchases) || 0,
                        profit: (parseFloat(lastMonth.sales) || 0) - (parseFloat(lastMonth.purchases) || 0)
                    }
                },
                weeklySales: weeklySales.map(week => ({
                    week_num: week.week_num,
                    invoices: parseInt(week.invoices) || 0,
                    revenue: parseFloat(week.revenue) || 0,
                    avgOrder: parseFloat(week.avgOrder) || 0
                })),
                deadStock: deadStock.map(item => ({
                    id: item.id,
                    product_name: item.product_name,
                    sku: item.sku,
                    category: item.category,
                    current_stock: parseInt(item.current_stock) || 0,
                    days_unsold: parseInt(item.days_unsold) || 0
                })),
                stockSummary: {
                    totalItems: parseInt(stockSummary.totalItems) || 0,
                    totalStock: parseInt(stockSummary.totalStock) || 0,
                    lowStockCount: parseInt(stockSummary.lowStockCount) || 0,
                    outOfStockCount: parseInt(stockSummary.outOfStockCount) || 0
                },
                recentReceipts: recentReceipts.map(receipt => ({
                    id: receipt.id,
                    receipt_number: receipt.receipt_number,
                    supplier_name: receipt.supplier_name || 'Unknown',
                    total_items: parseInt(receipt.total_items) || 0,
                    total_amount: parseFloat(receipt.total_amount) || 0,
                    purchase_date: receipt.purchase_date,
                    status: receipt.status
                })),
                pendingTasks: {
                    purchasesToReceive: parseInt(pendingTasks.purchasesToReceive) || 0,
                    purchasesInProgress: parseInt(pendingTasks.purchasesInProgress) || 0,
                    salesToPack: parseInt(pendingTasks.salesToPack) || 0,
                    salesToShip: parseInt(pendingTasks.salesToShip) || 0,
                    salesToDeliver: parseInt(pendingTasks.salesToDeliver) || 0,
                    toBeInvoiced: parseInt(pendingTasks.toBeInvoiced) || 0
                },
                lowStockAlerts: lowStockAlerts.map(item => ({
                    id: item.id,
                    product_name: item.product_name,
                    sku: item.sku,
                    current_stock: parseInt(item.current_stock) || 0,
                    reorder_level: parseInt(item.reorder_level) || 0,
                    shortage: parseInt(item.shortage) || 0
                })),
                recentActivities: recentActivities.map(activity => ({
                    id: activity.id,
                    action: activity.description || activity.action,
                    userName: activity.userName || 'System',
                    timestamp: activity.timestamp
                }))
            }
        };

        console.log('Dashboard data fetched successfully');
        res.json(responseData);

    } catch (error) {
        console.error('Dashboard comprehensive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

module.exports = exports;
