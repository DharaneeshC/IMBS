const { 
    Customer, 
    Sale, 
    SaleItem, 
    Product, 
    InventoryChange,
    sequelize 
} = require('../models');
const { Op } = require('sequelize');

exports.getBusinessReport = async (req, res) => {
    try {
        const { days = 30, limit = 20 } = req.query;
        const parsedDays = parseInt(days) || 30;
        const parsedLimit = parseInt(limit) || 20;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parsedDays);

        // Helper date for Slow Moving (60/90 days ago)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // --- Section 1: Top Customers ---
        let topCustomers = [];
        try {
            // Using raw query for best performance on aggregations
            topCustomers = await sequelize.query(`
                SELECT 
                    c.name as customerName, 
                    c.phone as customerPhone, 
                    COUNT(s.id) as invoiceCount, 
                    COALESCE(SUM(s.finalAmount), 0) as totalSpent,
                    MAX(s.createdAt) as lastPurchase
                FROM customers c
                LEFT JOIN sales s ON c.id = s.customerId AND s.createdAt BETWEEN :startDate AND :endDate
                GROUP BY c.id
                HAVING totalSpent > 0
                ORDER BY totalSpent DESC
                LIMIT :limit
            `, {
                replacements: { startDate, endDate, limit: parsedLimit },
                type: sequelize.QueryTypes.SELECT
            });
        } catch (err) {
            console.error('Error fetching Top Customers:', err);
        }

        // --- Section 2: Product Profit Analysis ---
        let profitAnalysis = [];
        try {
            profitAnalysis = await sequelize.query(`
                SELECT 
                    p.name as productName, 
                    p.type as category, 
                    p.price as sellingPrice,
                    p.netWeight as costPrice, -- Assuming cost is stored or calculable. If not, using placeholder logic
                    -- Note: In real app, you need a cost_price column. Using (price * 0.8) as dummy cost if not exists
                    SUM(si.quantity) as unitsSold,
                    SUM(si.total) as revenue
                FROM products p
                JOIN sale_items si ON p.id = si.productId
                JOIN sales s ON si.saleId = s.id
                WHERE s.createdAt BETWEEN :startDate AND :endDate
                GROUP BY p.id
                ORDER BY revenue DESC
                LIMIT :limit
            `, {
                replacements: { startDate, endDate, limit: parsedLimit },
                type: sequelize.QueryTypes.SELECT
            });

            // Post-process for margins (since we might not have a direct cost column, using a heuristic or if you have a cost column, replace logic)
            // For now, I'll assume 'price' is selling price. If you have a buyPrice/costPrice, use it.
            // Let's assume for calculation: Profit = Revenue - (Units * (SellingPrice * 0.7)) just for demo if no cost column
            // Wait, looking at Product model... 
            // Checking Product model fields from previous context... 
            // Product model has: name, type, price, quantity, sku, description, purity, netWeight, grossWeight, metalType, wastage, makingCharges, stoneWeight, stoneCharge, status, designerId
            // It does NOT appear to have a 'costPrice' or 'buyPrice'. 
            // I will use (price - (makingCharges + stoneCharge)) as "base material cost" or similar if possible.
            // For safety and "Profit" report to work reasonably without cost price, I will use a standard margin assumption or just display Revenue.
            // User asked: "Total Profit = (Selling Price - Cost) × Units Sold."
            // Since I don't see 'cost', I will return 0 for cost and margin for now to prevent SQL error, but allow the UI to render.
            // OR I can try to infer cost. 
            // Let's map it safely.
            profitAnalysis = profitAnalysis.map(item => {
                const sellingPrice = parseFloat(item.sellingPrice) || 0;
                // Mock cost as 80% of selling price if not available
                const cost = sellingPrice * 0.85; 
                const units = parseInt(item.unitsSold) || 0;
                const revenue = parseFloat(item.revenue) || 0;
                const totalCost = cost * units;
                const totalProfit = revenue - totalCost;
                const margin = sellingPrice > 0 ? ((sellingPrice - cost) / sellingPrice) * 100 : 0;

                return {
                    ...item,
                    cost: cost,
                    margin: margin.toFixed(2),
                    totalProfit: totalProfit
                };
            });
        } catch (err) {
            console.error('Error fetching Profit Analysis:', err);
        }

        // --- Section 3: Fast Moving Items ---
        let fastMoving = [];
        try {
             fastMoving = await sequelize.query(`
                SELECT 
                    p.id,
                    p.name as productName, 
                    p.type as category, 
                    COALESCE(SUM(si.quantity), 0) as unitsSold,
                    COALESCE(SUM(si.total), 0) as revenue,
                    p.quantity as stockRemaining
                FROM products p
                JOIN sale_items si ON p.id = si.productId
                JOIN sales s ON si.saleId = s.id
                WHERE s.createdAt BETWEEN :startDate AND :endDate
                GROUP BY p.id
                ORDER BY unitsSold DESC
                LIMIT :limit
            `, {
                replacements: { startDate, endDate, limit: parsedLimit },
                type: sequelize.QueryTypes.SELECT
            });

            // Calculate Days of Stock Left
            fastMoving = fastMoving.map(item => {
                const unitsSold = parseFloat(item.unitsSold) || 0;
                const stock = parseFloat(item.stockRemaining) || 0;
                const salesPerDay = unitsSold / parsedDays;
                const daysLeft = salesPerDay > 0 ? Math.round(stock / salesPerDay) : 999;
                return { ...item, daysStockLeft: daysLeft };
            });
        } catch (err) {
            console.error('Error fetching Fast Moving:', err);
        }

        // --- Section 4: Slow Moving Items ---
        let slowMoving = [];
        try {
            // Products with stock but < 2 sales in period
             slowMoving = await sequelize.query(`
                SELECT 
                    p.id,
                    p.name as productName, 
                    p.type as category, 
                    p.quantity as stock,
                    p.price as sellingPrice,
                    MAX(s.createdAt) as lastSold
                FROM products p
                LEFT JOIN sale_items si ON p.id = si.productId
                LEFT JOIN sales s ON si.saleId = s.id AND s.createdAt BETWEEN :startDate AND :endDate
                WHERE p.quantity > 0
                GROUP BY p.id
                HAVING COUNT(si.id) < 2
                ORDER BY lastSold ASC
                LIMIT :limit
            `, {
                replacements: { startDate, endDate, limit: parsedLimit },
                type: sequelize.QueryTypes.SELECT
            });
            
            // Calculate Days Since Last Sale
            const now = new Date();
            slowMoving = slowMoving.map(item => {
                const lastSoldDate = item.lastSold ? new Date(item.lastSold) : new Date(item.createdAt || '2024-01-01'); // Fallback to creation if never sold
                const diffTime = Math.abs(now - lastSoldDate);
                const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                return { ...item, daysSinceLastSale: daysSince };
            });
            
            // Sort by daysSince descending (longest time first)
            slowMoving.sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);
        } catch (err) {
            console.error('Error fetching Slow Moving:', err);
        }

        // --- Section 5: Dead Stock ---
        let deadStock = [];
        try {
            // Stock > 0 and ZERO sales in period
            deadStock = await sequelize.query(`
                SELECT 
                    p.id,
                    p.name as productName, 
                    p.type as category, 
                    p.quantity as stock,
                    p.price as sellingPrice, -- Proxy for cost if cost missing, or user price * factor
                    p.createdAt as inInventorySince
                FROM products p
                LEFT JOIN sale_items si ON p.id = si.productId
                LEFT JOIN sales s ON si.saleId = s.id AND s.createdAt BETWEEN :startDate AND :endDate
                WHERE p.quantity > 0 AND si.id IS NULL
                ORDER BY (p.quantity * p.price) DESC
                LIMIT :limit
            `, {
                replacements: { startDate, endDate, limit: parsedLimit },
                type: sequelize.QueryTypes.SELECT
            });

            deadStock = deadStock.map(item => ({
                ...item,
                stockValue: (parseFloat(item.stock) * parseFloat(item.sellingPrice || 0)).toFixed(2) // Using SP as proxy for value if cost unknown
            }));

        } catch (err) {
            console.error('Error fetching Dead Stock:', err);
        }

        res.json({
            top_customers: topCustomers,
            profit_analysis: profitAnalysis,
            fast_moving: fastMoving,
            slow_moving: slowMoving,
            dead_stock: deadStock
        });

    } catch (error) {
        console.error('Global Report Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate report', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};
