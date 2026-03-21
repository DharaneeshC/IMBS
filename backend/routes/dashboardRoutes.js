const express = require('express');
const router = express.Router();
const {
    getDashboardMetrics,
    getFastMovingItems,
    getSlowMovingItems,
    getDeadStock,
    getProductAnalytics,
    getInventoryValue,
    // Phase 3 - Smart Analytics
    getTodaySummary,
    getMonthlySalesChart,
    getSalesVsPurchases,
    getTopCustomers,
    getProductProfitReport,
    getStockPrediction,
    // Phase 3 - Automated Alerts
    getRepairStats,
    getSystemAlerts,
    getLowStockAlerts,
    getOverdueRepairAlerts,
    getDesignerPendingPayments
} = require('../controllers/dashboardController');

// Import FIXED comprehensive dashboard controller that shows REAL data
const { getComprehensiveDashboard } = require('../controllers/fixedDashboardController');

// Main dashboard endpoint - now uses FIXED controller with REAL data
router.get('/', getComprehensiveDashboard);

// Other dashboard endpoints
router.get('/fast-moving', getFastMovingItems);
router.get('/slow-moving', getSlowMovingItems);
router.get('/dead-stock', getDeadStock);
router.get('/product-analytics/:productId', getProductAnalytics);
router.get('/inventory-value', getInventoryValue);

// Phase 3 - Smart Analytics Routes
router.get('/today-summary', getTodaySummary);
router.get('/monthly-sales-chart', getMonthlySalesChart);
router.get('/sales-vs-purchases', getSalesVsPurchases);
router.get('/top-customers', getTopCustomers);
router.get('/product-profit-report', getProductProfitReport);
router.get('/stock-prediction', getStockPrediction);

// Phase 3 - Automated Alerts Routes
router.get('/alerts', getSystemAlerts);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/alerts/overdue-repairs', getOverdueRepairAlerts);
router.get('/alerts/designer-payments', getDesignerPendingPayments);

module.exports = router;
