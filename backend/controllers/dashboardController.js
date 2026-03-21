const { Product, Designer, UserActivity, Sale, SaleItem, PurchaseOrder, Customer, RepairOrder } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// Helper function to log user activity
const logActivity = async (action, entityType, entityId, description, req) => {
    try {
        await UserActivity.create({
            userId: req.headers['x-user-id'] || req.headers['x-user-name'] || 'Dharaneesh C',
            sessionId: req.headers['x-session-id'] || req.sessionID || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            action,
            entityType,
            entityId,
            description,
            success: true
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Helper function to get user-friendly action text
const getActionText = (activity) => {
    const entityType = activity.entityType || '';
    const action = activity.action;
    
    // Map actions to user-friendly descriptions
    if (action === 'CREATE') {
        if (entityType === 'PRODUCT' || entityType === 'PRODUCTS') return 'New Product Added';
        if (entityType === 'DESIGNER' || entityType === 'DESIGNERS') return 'New Designer Added';
        if (entityType === 'SALE') return 'New Sale Created';
        if (entityType === 'PURCHASE') return 'New Purchase Order Created';
        if (entityType === 'INVOICE') return 'New Invoice Generated';
        return 'New Item Created';
    }
    if (action === 'UPDATE') {
        if (entityType === 'PRODUCT' || entityType === 'PRODUCTS') return 'Product Updated';
        if (entityType === 'DESIGNER' || entityType === 'DESIGNERS') return 'Designer Information Updated';
        if (entityType === 'PREFERENCES') return 'General Preferences Updated';
        if (entityType === 'ORGANIZATION') return "Organization's Personally Identifiable Information (PII) has been updated";
        return 'Information Updated';
    }
    if (action === 'DELETE') {
        if (entityType === 'PRODUCT' || entityType === 'PRODUCTS') return 'Product Deleted';
        if (entityType === 'DESIGNER' || entityType === 'DESIGNERS') return 'Designer Removed';
        return 'Item Deleted';
    }
    if (action === 'VIEW') {
        if (entityType === 'PRODUCT' || entityType === 'PRODUCTS') return 'Viewed Products';
        if (entityType === 'DESIGNER' || entityType === 'DESIGNERS') return 'Viewed Designers';
        if (entityType === 'STOCK_LEVELS') return 'Viewed Stock Levels';
        if (entityType === 'DASHBOARD') return 'Viewed Dashboard';
        return 'Viewed Item';
    }
    if (action === 'EXPORT_CSV') return 'Exported Report';
    return activity.description || action;
};

// Helper function to get icon for entity type
const getEntityIcon = (entityType, action) => {
    if (action === 'CREATE') {
        if (entityType === 'PRODUCT' || entityType === 'PRODUCTS') return '📦';
        if (entityType === 'DESIGNER' || entityType === 'DESIGNERS') return '👤';
        if (entityType === 'SALE') return '💰';
        if (entityType === 'PURCHASE') return '🛒';
        if (entityType === 'INVOICE') return '🧾';
    }
    if (action === 'UPDATE') {
        if (entityType === 'PREFERENCES') return '⚙️';
        if (entityType === 'ORGANIZATION') return '📄';
        return '✏️';
    }
    if (action === 'VIEW') return '👁️';
    if (action === 'EXPORT_CSV') return '📥';
    
    const iconMap = {
        'PRODUCT': '📦',
        'PRODUCTS': '📦',
        'DESIGNER': '👤',
        'DESIGNERS': '👤',
        'DASHBOARD': '📊',
        'INVOICE': '🧾',
        'SALE': '💰',
        'PURCHASE': '🛒'
    };
    return iconMap[entityType] || '📄';
};

// @desc    Get dashboard metrics
// @route   GET /api/dashboard
// @access  Public
exports.getDashboardMetrics = async (req, res) => {
    try {
        console.log('Fetching dashboard metrics...');
        
        // Get all products with populated designer data
        const products = await Product.findAll({
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        console.log(`Found ${products.length} products`);
        
        // Calculate dashboard metrics
        const totalItems = products.length;
        const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
        
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let suggestedReorderValue = 0;
        
        products.forEach(product => {
            if (product.outOfStock()) {
                outOfStockCount++;
                suggestedReorderValue += parseFloat(product.cost) * 10;
            } else if (product.lowStock()) {
                lowStockCount++;
                suggestedReorderValue += parseFloat(product.cost) * 10;
            }
        });
        
        // Get unique product types count
        const typesResult = await Product.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('type')), 'type']],
            raw: true
        });
        const itemGroups = typesResult.length;
        
        // Calculate Pending Actions with real data
        // INVENTORY Section
        const belowReorderLevel = products.filter(p => p.lowStock() || p.outOfStock()).length;
        
        // SALES Section (using placeholder data for now - will be updated when sales/invoices modules are added)
        const toBePacked = 0;
        const toBeShipped = 0;
        const toBeDelivered = 0;
        const toBeInvoiced = 0;
        
        // PURCHASES Section (placeholder - will be updated when purchase orders module is added)
        const toBeReceived = 0;
        const receiveInProgress = 0;
        
        // Determine stock risk level
        let stockRiskLevel = 'low';
        if (lowStockCount > 5 || outOfStockCount > 2) {
            stockRiskLevel = 'high';
        } else if (lowStockCount > 2 || outOfStockCount > 0) {
            stockRiskLevel = 'medium';
        }
        
        // Get top products by quantity
        const topProducts = products
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 4);
        
        // Get recent activities (last 15)
        const recentActivities = await UserActivity.findAll({
            order: [['createdAt', 'DESC']],
            limit: 15,
            attributes: ['id', 'action', 'entityType', 'entityId', 'description', 'userId', 'createdAt']
        });
        
        // Format activities for frontend
        const formattedActivities = recentActivities
            .map(activity => {
                const actionText = getActionText(activity);
                if (!actionText) return null; // Skip if no action text (e.g., VIEW actions)
                
                return {
                    id: activity.id,
                    action: actionText,
                    entityType: activity.entityType,
                    entityId: activity.entityId,
                    description: activity.description,
                    userName: activity.userId || 'System User',
                    icon: getEntityIcon(activity.entityType, activity.action),
                    timestamp: activity.createdAt
                };
            })
            .filter(activity => activity !== null); // Remove null entries
        
        await logActivity('VIEW', 'DASHBOARD', null, 'Viewed dashboard metrics', req);
        
        res.json({
            totalItems,
            totalStock,
            lowStockCount,
            outOfStockCount,
            itemGroups,
            stockRiskLevel,
            suggestedReorder: suggestedReorderValue.toFixed(2),
            topProducts,
            pendingActions: {
                sales: {
                    toBePacked,
                    toBeShipped,
                    toBeDelivered,
                    toBeInvoiced
                },
                purchases: {
                    toBeReceived,
                    receiveInProgress
                },
                inventory: {
                    belowReorderLevel
                }
            },
            recentActivities: formattedActivities
        });
    } catch (error) {
        console.error('Error in getDashboardMetrics:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
        });
    }
};

// @desc    Get fast moving items (most sold products)
// @route   GET /api/dashboard/fast-moving
// @access  Public
exports.getFastMovingItems = async (req, res) => {
    try {
        const { period = 30, limit = 10 } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        const fastMoving = await SaleItem.findAll({
            attributes: [
                'productId',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
                [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalRevenue']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'type', 'price', 'cost', 'quantity'],
                include: [{
                    model: Designer,
                    as: 'designer',
                    attributes: ['id', 'name']
                }]
            }, {
                model: Sale,
                as: 'sale',
                attributes: [],
                where: {
                    saleDate: {
                        [Op.gte]: startDate
                    },
                    status: {
                        [Op.notIn]: ['Cancelled']
                    }
                }
            }],
            group: ['productId', 'product.id'],
            order: [[sequelize.literal('totalSold'), 'DESC']],
            limit: parseInt(limit)
        });
        
        res.json(fastMoving);
    } catch (error) {
        console.error('Error fetching fast moving items:', error);
        res.status(500).json({ 
            message: 'Failed to fetch fast moving items',
            error: error.message 
        });
    }
};

// @desc    Get slow moving items (not sold recently)
// @route   GET /api/dashboard/slow-moving
// @access  Public
exports.getSlowMovingItems = async (req, res) => {
    try {
        const { period = 30, limit = 10 } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        // Get products that have sales but no recent sales
        const productsWithSales = await SaleItem.findAll({
            attributes: ['productId'],
            include: [{
                model: Sale,
                as: 'sale',
                attributes: [],
                where: {
                    saleDate: {
                        [Op.gte]: startDate
                    }
                }
            }],
            group: ['productId']
        });
        
        const productsWithRecentSalesIds = productsWithSales.map(item => item.productId);
        
        // Find products with stock but without recent sales
        const slowMoving = await Product.findAll({
            where: {
                quantity: {
                    [Op.gt]: 0
                },
                id: {
                    [Op.notIn]: productsWithRecentSalesIds.length > 0 ? productsWithRecentSalesIds : [0]
                }
            },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name']
            }],
            limit: parseInt(limit),
            order: [['quantity', 'DESC']]
        });
        
        res.json(slowMoving);
    } catch (error) {
        console.error('Error fetching slow moving items:', error);
        res.status(500).json({ 
            message: 'Failed to fetch slow moving items',
            error: error.message 
        });
    }
};

// @desc    Get dead stock (stock exists but no sales ever)
// @route   GET /api/dashboard/dead-stock
// @access  Public
exports.getDeadStock = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // Get all products that have been sold
        const productsWithSales = await SaleItem.findAll({
            attributes: ['productId'],
            group: ['productId']
        });
        
        const productsSoldIds = productsWithSales.map(item => item.productId);
        
        // Find products with stock that have never been sold
        const deadStock = await Product.findAll({
            where: {
                quantity: {
                    [Op.gt]: 0
                },
                id: {
                    [Op.notIn]: productsSoldIds.length > 0 ? productsSoldIds : [0]
                }
            },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name']
            }],
            limit: parseInt(limit),
            order: [['createdAt', 'ASC']] // Oldest first
        });
        
        res.json(deadStock);
    } catch (error) {
        console.error('Error fetching dead stock:', error);
        res.status(500).json({ 
            message: 'Failed to fetch dead stock',
            error: error.message 
        });
    }
};

// @desc    Get product analytics (sales metrics)
// @route   GET /api/dashboard/product-analytics/:productId
// @access  Public
exports.getProductAnalytics = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Get total sold quantity and revenue
        const salesData = await SaleItem.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
                [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalRevenue'],
                [sequelize.fn('MAX', sequelize.col('sale.saleDate')), 'lastSoldDate']
            ],
            where: { productId },
            include: [{
                model: Sale,
                as: 'sale',
                attributes: [],
                where: {
                    status: {
                        [Op.notIn]: ['Cancelled']
                    }
                }
            }],
            raw: true
        });
        
        const totalSold = parseInt(salesData?.totalSold) || 0;
        const totalRevenue = parseFloat(salesData?.totalRevenue) || 0;
        const lastSoldDate = salesData?.lastSoldDate || null;
        
        // Calculate profit
        const totalCost = totalSold * parseFloat(product.cost);
        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;
        
        res.json({
            productId,
            totalSold,
            totalRevenue,
            totalCost,
            profit,
            profitMargin,
            lastSoldDate,
            currentStock: product.quantity
        });
    } catch (error) {
        console.error('Error fetching product analytics:', error);
        res.status(500).json({ 
            message: 'Failed to fetch product analytics',
            error: error.message 
        });
    }
};

// @desc    Get inventory value
// @route   GET /api/dashboard/inventory-value
// @access  Public
exports.getInventoryValue = async (req, res) => {
    try {
        const inventoryValue = await Product.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.literal('quantity * cost')), 'totalCostValue'],
                [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalSellingValue']
            ],
            raw: true
        });
        
        const totalCostValue = parseFloat(inventoryValue[0]?.totalCostValue) || 0;
        const totalSellingValue = parseFloat(inventoryValue[0]?.totalSellingValue) || 0;
        const potentialProfit = totalSellingValue - totalCostValue;
        
        res.json({
            totalCostValue,
            totalSellingValue,
            potentialProfit,
            items: await Product.count()
        });
    } catch (error) {
        console.error('Error fetching inventory value:', error);
        res.status(500).json({ 
            message: 'Failed to fetch inventory value',
            error: error.message 
        });
    }
};

// ============ PHASE 3 - SMART ANALYTICS & BUSINESS INTELLIGENCE ============

// @desc    Get today's business summary (Profit, Sales, Invoices)
// @route   GET /api/dashboard/today-summary
// @access  Public
exports.getTodaySummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Today's sales
        const todaySales = await Sale.findAll({
            where: {
                saleDate: {
                    [Op.gte]: today
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                }
            },
            include: [{
                model: SaleItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['cost']
                }]
            }]
        });
        
        // Yesterday's sales for comparison
        const yesterdaySales = await Sale.findAll({
            where: {
                saleDate: {
                    [Op.gte]: yesterday,
                    [Op.lt]: today
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                }
            },
            include: [{
                model: SaleItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['cost']
                }]
            }]
        });
        
        // Calculate today's metrics
        const todayRevenue = todaySales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
        const todayInvoices = todaySales.length;
        const todayItemsSold = todaySales.reduce((sum, sale) => 
            sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        
        // Calculate today's profit (revenue - cost)
        const todayCost = todaySales.reduce((sum, sale) => 
            sum + sale.items.reduce((itemSum, item) => 
                itemSum + (item.quantity * parseFloat(item.product?.cost || 0)), 0), 0);
        const todayProfit = todayRevenue - todayCost;
        
        // Calculate yesterday's metrics
        const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
        
        // Comparison
        const revenueChange = todayRevenue - yesterdayRevenue;
        const revenueChangePercent = yesterdayRevenue > 0 
            ? ((revenueChange / yesterdayRevenue) * 100).toFixed(1) 
            : 0;
        
        res.json({
            today: {
                revenue: todayRevenue.toFixed(2),
                profit: todayProfit.toFixed(2),
                invoices: todayInvoices,
                itemsSold: todayItemsSold
            },
            yesterday: {
                revenue: yesterdayRevenue.toFixed(2)
            },
            comparison: {
                revenueChange: revenueChange.toFixed(2),
                revenueChangePercent,
                trend: revenueChange >= 0 ? 'up' : 'down'
            }
        });
    } catch (error) {
        console.error('Error fetching today summary:', error);
        res.status(500).json({ 
            message: 'Failed to fetch today summary',
            error: error.message 
        });
    }
};

// @desc    Get monthly sales chart data
// @route   GET /api/dashboard/monthly-sales-chart
// @access  Public
exports.getMonthlySalesChart = async (req, res) => {
    try {
        const { months = 6 } = req.query;
        
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        const sales = await Sale.findAll({
            where: {
                saleDate: {
                    [Op.gte]: startDate
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                }
            },
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('saleDate'), '%Y-%m'), 'month'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'invoiceCount']
            ],
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('saleDate'), '%Y-%m')],
            order: [[sequelize.fn('DATE_FORMAT', sequelize.col('saleDate'), '%Y-%m'), 'ASC']],
            raw: true
        });
        
        res.json(sales);
    } catch (error) {
        console.error('Error fetching monthly sales chart:', error);
        res.status(500).json({ 
            message: 'Failed to fetch monthly sales chart',
            error: error.message 
        });
    }
};

// @desc    Get sales vs purchases chart data
// @route   GET /api/dashboard/sales-vs-purchases
// @access  Public
exports.getSalesVsPurchases = async (req, res) => {
    try {
        const { months = 6 } = req.query;
        
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        // Get sales data
        const salesData = await Sale.findAll({
            where: {
                saleDate: {
                    [Op.gte]: startDate
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                }
            },
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('saleDate'), '%Y-%m'), 'month'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'amount']
            ],
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('saleDate'), '%Y-%m')],
            order: [[sequelize.fn('DATE_FORMAT', sequelize.col('saleDate'), '%Y-%m'), 'ASC']],
            raw: true
        });
        
        // Get purchases data
        const purchasesData = await PurchaseOrder.findAll({
            where: {
                orderDate: {
                    [Op.gte]: startDate
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                }
            },
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('orderDate'), '%Y-%m'), 'month'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'amount']
            ],
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('orderDate'), '%Y-%m')],
            order: [[sequelize.fn('DATE_FORMAT', sequelize.col('orderDate'), '%Y-%m'), 'ASC']],
            raw: true
        });
        
        // Merge data
        const result = [];
        const allMonths = new Set([
            ...salesData.map(s => s.month),
            ...purchasesData.map(p => p.month)
        ]);
        
        allMonths.forEach(month => {
            const sale = salesData.find(s => s.month === month);
            const purchase = purchasesData.find(p => p.month === month);
            
            result.push({
                month,
                sales: parseFloat(sale?.amount || 0),
                purchases: parseFloat(purchase?.amount || 0)
            });
        });
        
        result.sort((a, b) => a.month.localeCompare(b.month));
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching sales vs purchases:', error);
        res.status(500).json({ 
            message: 'Failed to fetch sales vs purchases',
            error: error.message 
        });
    }
};

// @desc    Get top customers by purchase amount
// @route   GET /api/dashboard/top-customers
// @access  Public
exports.getTopCustomers = async (req, res) => {
    try {
        const { period = 30, limit = 10 } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        const topCustomers = await Sale.findAll({
            where: {
                saleDate: {
                    [Op.gte]: startDate
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                },
                customerId: {
                    [Op.ne]: null
                }
            },
            attributes: [
                'customerId',
                [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'purchaseCount'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSpent']
            ],
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['id', 'name', 'email', 'phone']
            }],
            group: ['customerId', 'customer.id'],
            order: [[sequelize.literal('totalSpent'), 'DESC']],
            limit: parseInt(limit)
        });
        
        res.json(topCustomers);
    } catch (error) {
        console.error('Error fetching top customers:', error);
        res.status(500).json({ 
            message: 'Failed to fetch top customers',
            error: error.message 
        });
    }
};

// @desc    Get product profit report
// @route   GET /api/dashboard/product-profit-report
// @access  Public
exports.getProductProfitReport = async (req, res) => {
    try {
        const { period = 30, limit = 20 } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        const productProfits = await SaleItem.findAll({
            attributes: [
                'productId',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
                [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalRevenue']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku', 'cost', 'price'],
                include: [{
                    model: Designer,
                    as: 'designer',
                    attributes: ['id', 'name']
                }]
            }, {
                model: Sale,
                as: 'sale',
                attributes: [],
                where: {
                    saleDate: {
                        [Op.gte]: startDate
                    },
                    status: {
                        [Op.notIn]: ['Cancelled']
                    }
                }
            }],
            group: ['productId', 'product.id'],
            order: [[sequelize.literal('totalRevenue'), 'DESC']],
            limit: parseInt(limit)
        });
        
        // Calculate profit for each product
        const profitReport = productProfits.map(item => {
            const totalSold = parseInt(item.dataValues.totalSold);
            const totalRevenue = parseFloat(item.dataValues.totalRevenue);
            const cost = parseFloat(item.product.cost);
            const totalCost = totalSold * cost;
            const profit = totalRevenue - totalCost;
            const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;
            
            return {
                productId: item.product.id,
                productName: item.product.name,
                sku: item.product.sku,
                designer: item.product.designer?.name || 'N/A',
                totalSold,
                totalRevenue: totalRevenue.toFixed(2),
                totalCost: totalCost.toFixed(2),
                profit: profit.toFixed(2),
                profitMargin: `${profitMargin}%`
            };
        });
        
        res.json(profitReport);
    } catch (error) {
        console.error('Error fetching product profit report:', error);
        res.status(500).json({ 
            message: 'Failed to fetch product profit report',
            error: error.message 
        });
    }
};

// @desc    Get stock prediction and reorder alerts
// @route   GET /api/dashboard/stock-prediction
// @access  Public
exports.getStockPrediction = async (req, res) => {
    try {
        const { daysToAnalyze = 30, predictDays = 7 } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(daysToAnalyze));
        
        // Get all products with their sales data
        const products = await Product.findAll({
            where: {
                quantity: {
                    [Op.gt]: 0
                }
            },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name']
            }]
        });
        
        const predictions = [];
        
        for (const product of products) {
            // Get sales for this product in the analysis period
            const salesData = await SaleItem.findAll({
                where: {
                    productId: product.id
                },
                include: [{
                    model: Sale,
                    as: 'sale',
                    where: {
                        saleDate: {
                            [Op.gte]: startDate
                        },
                        status: {
                            [Op.notIn]: ['Cancelled']
                        }
                    },
                    attributes: []
                }],
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']
                ],
                raw: true
            });
            
            const totalSold = parseInt(salesData[0]?.totalSold || 0);
            
            if (totalSold > 0) {
                // Calculate average daily sales
                const avgDailySales = totalSold / parseInt(daysToAnalyze);
                
                // Calculate days remaining
                const daysRemaining = avgDailySales > 0 
                    ? Math.floor(product.quantity / avgDailySales) 
                    : 999;
                
                // Determine risk level
                let riskLevel = 'safe';
                let recommendation = 'Stock level is adequate';
                
                if (daysRemaining < parseInt(predictDays)) {
                    riskLevel = 'critical';
                    recommendation = 'Reorder immediately';
                } else if (daysRemaining < parseInt(predictDays) * 2) {
                    riskLevel = 'warning';
                    recommendation = 'Reorder soon';
                } else if (daysRemaining < parseInt(predictDays) * 3) {
                    riskLevel = 'attention';
                    recommendation = 'Monitor stock levels';
                }
                
                if (riskLevel !== 'safe') {
                    predictions.push({
                        productId: product.id,
                        productName: product.name,
                        sku: product.sku,
                        designer: product.designer?.name || 'N/A',
                        currentStock: product.quantity,
                        avgDailySales: avgDailySales.toFixed(2),
                        daysRemaining,
                        riskLevel,
                        recommendation
                    });
                }
            }
        }
        
        // Sort by days remaining (most urgent first)
        predictions.sort((a, b) => a.daysRemaining - b.daysRemaining);
        
        res.json(predictions);
    } catch (error) {
        console.error('Error fetching stock prediction:', error);
        res.status(500).json({ 
            message: 'Failed to fetch stock prediction',
            error: error.message 
        });
    }
};

// ============ PHASE 3 - AUTOMATED ALERTS SYSTEM ============

// @desc    Get all system alerts (comprehensive)
// @route   GET /api/dashboard/alerts
// @access  Public
exports.getSystemAlerts = async (req, res) => {
    try {
        const alerts = {
            lowStock: [],
            overdueRepairs: [],
            designerPayments: [],
            criticalStock: [],
            summary: {
                total: 0,
                critical: 0,
                warning: 0,
                info: 0
            }
        };

        // 1. Low Stock Alerts
        const lowStockProducts = await Product.findAll({
            where: {
                [Op.or]: [
                    sequelize.where(
                        sequelize.col('quantity'),
                        '<=',
                        sequelize.col('reorderLevel')
                    ),
                    { quantity: 0 }
                ]
            },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name']
            }],
            order: [['quantity', 'ASC']]
        });

        alerts.lowStock = lowStockProducts.map(product => ({
            id: product.id,
            type: 'low_stock',
            severity: product.quantity === 0 ? 'critical' : 'warning',
            title: product.quantity === 0 ? 'Out of Stock' : 'Low Stock',
            message: `${product.name} (SKU: ${product.sku}) - Current: ${product.quantity}, Reorder: ${product.reorderLevel}`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentStock: product.quantity,
            reorderLevel: product.reorderLevel,
            action: 'Create Purchase Order',
            actionLink: '/purchase-orders/new'
        }));

        // 2. Overdue Repair Alerts
        const today = new Date();
        const overdueRepairs = await RepairOrder.findAll({
            where: {
                expectedDeliveryDate: {
                    [Op.lt]: today
                },
                status: {
                    [Op.notIn]: ['Delivered', 'Cancelled', 'Completed']
                }
            },
            order: [['expectedDeliveryDate', 'ASC']]
        });

        alerts.overdueRepairs = overdueRepairs.map(repair => {
            const daysOverdue = Math.floor((today - new Date(repair.expectedDeliveryDate)) / (1000 * 60 * 60 * 24));
            return {
                id: repair.id,
                type: 'overdue_repair',
                severity: daysOverdue > 7 ? 'critical' : 'warning',
                title: 'Overdue Repair',
                message: `${repair.productName} for ${repair.customerName} - ${daysOverdue} days overdue`,
                orderNumber: repair.orderNumber,
                customerName: repair.customerName,
                customerPhone: repair.customerPhone,
                productName: repair.productName,
                expectedDate: repair.expectedDeliveryDate,
                daysOverdue,
                status: repair.status,
                action: 'View Repair Order',
                actionLink: `/services/repairs/${repair.id}`
            };
        });

        // 3. Vendor Pending Payments (Purchase Orders with pending payments)
        const pendingPayments = await PurchaseOrder.findAll({
            where: {
                paymentStatus: {
                    [Op.in]: ['pending', 'partial']
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                }
            },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'phone']
            }],
            order: [['orderDate', 'ASC']]
        });

        alerts.designerPayments = pendingPayments.map(po => {
            const daysOutstanding = Math.floor((today - new Date(po.orderDate)) / (1000 * 60 * 60 * 24));
            const amountDue = parseFloat(po.totalAmount) - parseFloat(po.paidAmount || 0);
            
            return {
                id: po.id,
                type: 'designer_payment',
                severity: daysOutstanding > 30 ? 'critical' : amountDue > 100000 ? 'warning' : 'info',
                title: 'Pending Payment',
                message: `Payment to ${po.designer?.name || 'Designer'} - ₹${amountDue.toFixed(2)} due`,
                poNumber: po.poNumber,
                designerName: po.designer?.name,
                designerPhone: po.designer?.phone,
                totalAmount: parseFloat(po.totalAmount),
                paidAmount: parseFloat(po.paidAmount || 0),
                amountDue: amountDue,
                daysOutstanding,
                paymentStatus: po.paymentStatus,
                action: 'Make Payment',
                actionLink: `/purchase-orders/${po.id}`
            };
        });

        // 4. Critical Stock (products with zero quantity)
        const criticalStock = lowStockProducts.filter(p => p.quantity === 0);
        alerts.criticalStock = criticalStock.map(product => ({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            designer: product.designer?.name || 'N/A'
        }));

        // Calculate summary
        const allAlerts = [...alerts.lowStock, ...alerts.overdueRepairs, ...alerts.designerPayments];
        alerts.summary.total = allAlerts.length;
        alerts.summary.critical = allAlerts.filter(a => a.severity === 'critical').length;
        alerts.summary.warning = allAlerts.filter(a => a.severity === 'warning').length;
        alerts.summary.info = allAlerts.filter(a => a.severity === 'info').length;

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching system alerts:', error);
        res.status(500).json({ 
            message: 'Failed to fetch system alerts',
            error: error.message 
        });
    }
};

// @desc    Get low stock alerts only
// @route   GET /api/dashboard/alerts/low-stock
// @access  Public
exports.getLowStockAlerts = async (req, res) => {
    try {
        const lowStockProducts = await Product.findAll({
            where: {
                [Op.or]: [
                    sequelize.where(
                        sequelize.col('quantity'),
                        '<=',
                        sequelize.col('reorderLevel')
                    ),
                    { quantity: 0 }
                ]
            },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name']
            }],
            order: [['quantity', 'ASC']]
        });

        const alerts = lowStockProducts.map(product => ({
            id: product.id,
            severity: product.quantity === 0 ? 'critical' : 'warning',
            productName: product.name,
            sku: product.sku,
            designer: product.designer?.name || 'N/A',
            currentStock: product.quantity,
            reorderLevel: product.reorderLevel,
            recommendedOrder: product.reorderLevel * 2
        }));

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching low stock alerts:', error);
        res.status(500).json({ 
            message: 'Failed to fetch low stock alerts',
            error: error.message 
        });
    }
};

// @desc    Get overdue repair alerts
// @route   GET /api/dashboard/alerts/overdue-repairs
// @access  Public
exports.getOverdueRepairAlerts = async (req, res) => {
    try {
        const today = new Date();
        const overdueRepairs = await RepairOrder.findAll({
            where: {
                expectedDeliveryDate: {
                    [Op.lt]: today
                },
                status: {
                    [Op.notIn]: ['Delivered', 'Cancelled', 'Completed']
                }
            },
            order: [['expectedDeliveryDate', 'ASC']]
        });

        const alerts = overdueRepairs.map(repair => {
            const daysOverdue = Math.floor((today - new Date(repair.expectedDeliveryDate)) / (1000 * 60 * 60 * 24));
            return {
                id: repair.id,
                severity: daysOverdue > 7 ? 'critical' : 'warning',
                orderNumber: repair.orderNumber,
                customerName: repair.customerName,
                customerPhone: repair.customerPhone,
                productName: repair.productName,
                expectedDate: repair.expectedDeliveryDate,
                daysOverdue,
                status: repair.status,
                repairCharges: parseFloat(repair.repairCharges)
            };
        });

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching overdue repair alerts:', error);
        res.status(500).json({ 
            message: 'Failed to fetch overdue repair alerts',
            error: error.message 
        });
    }
};

// @desc    Get designer pending payment alerts
// @route   GET /api/dashboard/alerts/designer-payments
// @access  Public
exports.getDesignerPendingPayments = async (req, res) => {
    try {
        const today = new Date();
        const pendingPayments = await PurchaseOrder.findAll({
            where: {
                paymentStatus: {
                    [Op.in]: ['pending', 'partial']
                },
                status: {
                    [Op.notIn]: ['Cancelled']
                }
            },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'phone', 'street']
            }],
            order: [['orderDate', 'ASC']]
        });

        const alerts = pendingPayments.map(po => {
            const daysOutstanding = Math.floor((today - new Date(po.orderDate)) / (1000 * 60 * 60 * 24));
            const amountDue = parseFloat(po.totalAmount) - parseFloat(po.paidAmount || 0);
            
            return {
                id: po.id,
                severity: daysOutstanding > 30 ? 'critical' : amountDue > 100000 ? 'warning' : 'info',
                poNumber: po.poNumber,
                designerName: po.designer?.name,
                designerPhone: po.designer?.phone,
                orderDate: po.orderDate,
                totalAmount: parseFloat(po.totalAmount),
                paidAmount: parseFloat(po.paidAmount || 0),
                amountDue: amountDue,
                daysOutstanding,
                paymentStatus: po.paymentStatus
            };
        });

        res.json(alerts);
    } catch (error) {
        console.error('Error fetching designer payment alerts:', error);
        res.status(500).json({ 
            message: 'Failed to fetch designer payment alerts',
            error: error.message 
        });
    }
};
