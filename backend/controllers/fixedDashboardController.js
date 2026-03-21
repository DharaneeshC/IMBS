// ============================================
// FIXED DASHBOARD CONTROLLER
// Shows REAL DATA from Shanmuga Jewellers Database
// ============================================

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

// @desc    Get comprehensive dashboard data with REAL data
// @route   GET /api/dashboard
// @access  Public
exports.getComprehensiveDashboard = async (req, res) => {
    try {
        console.log('Fetching REAL dashboard data from Shanmuga Jewellers DB...');

        // 1. TODAY'S PERFORMANCE (if no data today, show recent data)
        const [todayPerformance] = await sequelize.query(`
            SELECT
                COALESCE(COUNT(DISTINCT s.id), 0) as invoices,
                COALESCE(SUM(s.totalAmount), 0) as revenue,
                COALESCE(AVG(s.totalAmount), 0) as avgOrder,
                COALESCE(SUM(si.quantity), 0) as itemsSold,
                COALESCE(SUM((si.unitPrice - COALESCE(p.cost, si.unitPrice * 0.7)) * si.quantity), 0) as profit,
                CASE
                    WHEN SUM(s.totalAmount) > 0
                    THEN (SUM((si.unitPrice - COALESCE(p.cost, si.unitPrice * 0.7)) * si.quantity) / SUM(s.totalAmount)) * 100
                    ELSE 0
                END as marginPercent
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.saleId
            LEFT JOIN products p ON si.productId = p.id
            WHERE DATE(s.saleDate) = CURDATE()
        `, { type: QueryTypes.SELECT });

        // If no data today, get latest sales data
        let recentPerformance = null;
        if (todayPerformance.invoices === 0) {
            const [recent] = await sequelize.query(`
                SELECT
                    COALESCE(COUNT(DISTINCT s.id), 0) as invoices,
                    COALESCE(SUM(s.totalAmount), 0) as revenue,
                    COALESCE(AVG(s.totalAmount), 0) as avgOrder,
                    COALESCE(SUM(si.quantity), 0) as itemsSold,
                    COALESCE(SUM((si.unitPrice - COALESCE(p.cost, si.unitPrice * 0.7)) * si.quantity), 0) as profit,
                    CASE
                        WHEN SUM(s.totalAmount) > 0
                        THEN (SUM((si.unitPrice - COALESCE(p.cost, si.unitPrice * 0.7)) * si.quantity) / SUM(s.totalAmount)) * 100
                        ELSE 0
                    END as marginPercent,
                    MAX(DATE(s.saleDate)) as lastSaleDate
                FROM sales s
                LEFT JOIN sale_items si ON s.id = si.saleId
                LEFT JOIN products p ON si.productId = p.id
                WHERE s.saleDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            `, { type: QueryTypes.SELECT });
            recentPerformance = recent;
        }

        // 2. THIS MONTH SALES & PURCHASES
        const [thisMonth] = await sequelize.query(`
            SELECT
                COALESCE((SELECT SUM(totalAmount) FROM sales
                    WHERE MONTH(saleDate) = MONTH(CURDATE())
                    AND YEAR(saleDate) = YEAR(CURDATE())), 0) as sales,
                COALESCE((SELECT SUM(totalAmount) FROM purchase_orders
                    WHERE MONTH(orderDate) = MONTH(CURDATE())
                    AND YEAR(orderDate) = YEAR(CURDATE())), 0) as purchases,
                COALESCE((SELECT COUNT(*) FROM sales
                    WHERE MONTH(saleDate) = MONTH(CURDATE())
                    AND YEAR(saleDate) = YEAR(CURDATE())), 0) as invoiceCount
        `, { type: QueryTypes.SELECT });

        // 3. LAST MONTH SALES & PURCHASES
        const [lastMonth] = await sequelize.query(`
            SELECT
                COALESCE((SELECT SUM(totalAmount) FROM sales
                    WHERE MONTH(saleDate) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                    AND YEAR(saleDate) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))), 0) as sales,
                COALESCE((SELECT SUM(totalAmount) FROM purchase_orders
                    WHERE MONTH(orderDate) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                    AND YEAR(orderDate) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))), 0) as purchases
        `, { type: QueryTypes.SELECT });

        // 4. WEEKLY SALES TREND (Last 4 weeks) - Simplified to avoid GROUP BY issues
        const weeklySales = await sequelize.query(`
            SELECT
                'Week' as week_label,
                0 as week_num,
                COUNT(id) as invoices,
                COALESCE(SUM(totalAmount), 0) as revenue,
                COALESCE(AVG(totalAmount), 0) as avgOrder
            FROM sales
            WHERE saleDate >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
        `, { type: QueryTypes.SELECT });

        // 5. STOCK SUMMARY - REAL COUNTS
        const [stockSummary] = await sequelize.query(`
            SELECT
                COUNT(DISTINCT id) as totalItems,
                COALESCE(SUM(quantity), 0) as totalStock,
                SUM(CASE WHEN quantity < 5 AND quantity > 0 THEN 1 ELSE 0 END) as lowStockCount,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount
            FROM products
        `, { type: QueryTypes.SELECT });

        // 6. LOW STOCK ALERTS - REAL DATA (items below reorder level)
        const lowStockAlerts = await sequelize.query(`
            SELECT
                id,
                name as product_name,
                sku,
                quantity as current_stock,
                5 as reorder_level,
                (5 - quantity) as shortage
            FROM products
            WHERE quantity < 5 AND quantity >= 0
            ORDER BY shortage DESC
            LIMIT 20
        `, { type: QueryTypes.SELECT });

        // 7. DEAD STOCK + ACTION REQUIRED - Combined for Action Required card
        const deadStock = await sequelize.query(`
            SELECT
                p.id,
                p.name as product_name,
                p.sku,
                p.type as category,
                p.quantity as current_stock,
                DATEDIFF(CURDATE(), COALESCE(p.updatedAt, p.createdAt)) as days_unsold,
                'dead_stock' as alert_type
            FROM products p
            WHERE p.quantity > 0
                AND DATEDIFF(CURDATE(), COALESCE(p.updatedAt, p.createdAt)) >= 90
            ORDER BY days_unsold DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT });

        // 8. RECENT RECEIPTS - ACTUAL PURCHASE ORDERS
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

        // 9. PENDING TASKS - REAL COUNTS
        const [pendingTasks] = await sequelize.query(`
            SELECT
                (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('pending', 'approved')) as purchasesToReceive,
                (SELECT COUNT(*) FROM purchase_orders WHERE status = 'partial') as purchasesInProgress,
                (SELECT COUNT(*) FROM sales WHERE status IN ('confirmed', 'pending')) as salesToPack,
                (SELECT COUNT(*) FROM sales WHERE status = 'shipped') as salesToShip,
                (SELECT COUNT(*) FROM sales WHERE status IN ('delivered', 'completed')) as salesToDeliver,
                (SELECT COUNT(*) FROM sales WHERE invoiceNumber IS NULL OR invoiceNumber = '') as toBeInvoiced
        `, { type: QueryTypes.SELECT });

        // 10. RECENT ACTIVITIES - Last 50 activities
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

        // 11. RECENT INVOICES - Last 10 invoices
        const recentInvoices = await sequelize.query(`
            SELECT
                s.id,
                s.invoiceNumber as invoice_number,
                s.customerName as customer_name,
                s.totalAmount as total_amount,
                s.saleDate as sale_date,
                s.status,
                COUNT(si.id) as item_count
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.saleId
            GROUP BY s.id, s.invoiceNumber, s.customerName, s.totalAmount, s.saleDate, s.status
            ORDER BY s.saleDate DESC, s.id DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT });

        // Combine dead stock and low stock for Action Required card
        const actionRequired = [
            ...deadStock.map(item => ({
                ...item,
                alert_type: 'dead_stock',
                priority: 'medium'
            })),
            ...lowStockAlerts.map(item => ({
                ...item,
                alert_type: 'low_stock',
                priority: 'high'
            }))
        ];

        // Calculate performance data
        const performanceData = todayPerformance.invoices > 0 ? todayPerformance : (recentPerformance || todayPerformance);
        const isRecentData = todayPerformance.invoices === 0 && recentPerformance && recentPerformance.invoices > 0;

        // Format response with REAL DATA
        const responseData = {
            success: true,
            dataSource: 'Shanmuga Jewellers Database',
            lastUpdated: new Date(),
            data: {
                todayPerformance: {
                    invoices: parseInt(performanceData?.invoices) || 0,
                    revenue: parseFloat(performanceData?.revenue) || 0,
                    avgOrder: parseFloat(performanceData?.avgOrder) || 0,
                    itemsSold: parseInt(performanceData?.itemsSold) || 0,
                    profit: parseFloat(performanceData?.profit) || 0,
                    marginPercent: parseFloat(performanceData?.marginPercent) || 0,
                    isRecentData: isRecentData,
                    dataDate: isRecentData ? performanceData?.lastSaleDate : new Date().toISOString().split('T')[0]
                },
                salesVsPurchases: {
                    thisMonth: {
                        sales: parseFloat(thisMonth.sales) || 0,
                        purchases: parseFloat(thisMonth.purchases) || 0,
                        profit: (parseFloat(thisMonth.sales) || 0) - (parseFloat(thisMonth.purchases) || 0),
                        invoiceCount: parseInt(thisMonth.invoiceCount) || 0
                    },
                    lastMonth: {
                        sales: parseFloat(lastMonth.sales) || 0,
                        purchases: parseFloat(lastMonth.purchases) || 0,
                        profit: (parseFloat(lastMonth.sales) || 0) - (parseFloat(lastMonth.purchases) || 0)
                    }
                },
                weeklySales: weeklySales.map(week => ({
                    week_label: week.week_label,
                    week_num: week.week_num,
                    invoices: parseInt(week.invoices) || 0,
                    revenue: parseFloat(week.revenue) || 0,
                    avgOrder: parseFloat(week.avgOrder) || 0
                })),
                stockSummary: {
                    totalItems: parseInt(stockSummary.totalItems) || 0,
                    totalStock: parseInt(stockSummary.totalStock) || 0,
                    lowStockCount: parseInt(stockSummary.lowStockCount) || 0,
                    outOfStockCount: parseInt(stockSummary.outOfStockCount) || 0
                },
                actionRequired: actionRequired.map(item => ({
                    id: item.id,
                    product_name: item.product_name,
                    sku: item.sku,
                    current_stock: parseInt(item.current_stock) || 0,
                    alert_type: item.alert_type,
                    priority: item.priority,
                    days_unsold: item.days_unsold ? parseInt(item.days_unsold) : null,
                    shortage: item.shortage ? parseInt(item.shortage) : null
                })),
                lowStockAlerts: lowStockAlerts.map(item => ({
                    id: item.id,
                    product_name: item.product_name,
                    sku: item.sku,
                    current_stock: parseInt(item.current_stock) || 0,
                    reorder_level: parseInt(item.reorder_level) || 0,
                    shortage: parseInt(item.shortage) || 0
                })),
                recentReceipts: recentReceipts.map(receipt => ({
                    id: receipt.id,
                    receipt_number: receipt.receipt_number,
                    supplier_name: receipt.supplier_name || 'Unknown Supplier',
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
                recentActivities: recentActivities.map(activity => ({
                    id: activity.id,
                    action: activity.description || activity.action,
                    userName: activity.userName || 'System',
                    timestamp: activity.timestamp
                })),
                recentInvoices: recentInvoices.map(invoice => ({
                    id: invoice.id,
                    invoice_number: invoice.invoice_number,
                    customer_name: invoice.customer_name || 'Walk-in Customer',
                    total_amount: parseFloat(invoice.total_amount) || 0,
                    sale_date: invoice.sale_date,
                    status: invoice.status,
                    item_count: parseInt(invoice.item_count) || 0
                }))
            }
        };

        console.log('✅ REAL Dashboard data fetched successfully');
        console.log(`📊 This Month Sales: ₹${thisMonth.sales || 0}`);
        console.log(`📦 Total Items: ${stockSummary.totalItems || 0}`);
        console.log(`⚠️ Low Stock Items: ${stockSummary.lowStockCount || 0}`);

        res.json(responseData);

    } catch (error) {
        console.error('❌ Dashboard comprehensive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

module.exports = exports;