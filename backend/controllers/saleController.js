const { Sale, SaleItem, Product, Customer, Payment, StockMovement, UserActivity, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all sales/invoices
// @route   GET /api/sales
// @access  Public
exports.getAllSales = async (req, res) => {
    try {
        const { 
            search, 
            paymentStatus, 
            status,
            startDate,
            endDate,
            customerId,
            sortBy = 'saleDate', 
            order = 'DESC',
            page = 1,
            limit = 10
        } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { invoiceNumber: { [Op.like]: `%${search}%` } },
                { customerName: { [Op.like]: `%${search}%` } },
                { customerPhone: { [Op.like]: `%${search}%` } }
            ];
        }

        if (paymentStatus) {
            where.paymentStatus = paymentStatus;
        }

        if (status) {
            where.status = status;
        }

        if (customerId) {
            where.customerId = customerId;
        }

        if (startDate && endDate) {
            where.saleDate = {
                [Op.between]: [startDate, endDate]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: sales } = await Sale.findAndCountAll({
            where,
            order: [[sortBy, order]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'fullName', 'email', 'phone']
                },
                {
                    model: SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'type', 'frontImage']
                        }
                    ]
                },
                {
                    model: Payment,
                    as: 'payments'
                }
            ]
        });

        const totalPages = Math.ceil(count / limit);

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'VIEW',
                entityType: 'SALES',
                entityId: null,
                description: 'Viewed all sales',
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            data: sales,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch sales', 
            error: error.message 
        });
    }
};

// @desc    Get single sale/invoice by ID
// @route   GET /api/sales/:id
// @access  Public
exports.getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const sale = await Sale.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                },
                {
                    model: Payment,
                    as: 'payments',
                    order: [['paymentDate', 'DESC']]
                }
            ]
        });

        if (!sale) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sale not found' 
            });
        }

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'VIEW',
                entityType: 'SALE',
                entityId: id,
                description: `Viewed invoice ${sale.invoiceNumber}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            data: sale
        });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch sale', 
            error: error.message 
        });
    }
};

// @desc    Create new sale/invoice with items
// @route   POST /api/sales
// @access  Public
exports.createSale = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const {
            customerId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            items,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            paymentMethod,
            paymentStatus,
            notes,
            status = 'confirmed'
        } = req.body;

        console.log('Creating sale with data:', JSON.stringify(req.body, null, 2));

        // Validate required fields
        if (!customerName || !items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Customer name and items are required' 
            });
        }

        // Generate invoice number
        const count = await Sale.count();
        const invoiceNumber = `INV${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;

        // Customer Auto-Save / Lookup
        let finalCustomerId = customerId || null;

        if (!finalCustomerId && customerPhone && customerName) {
            // Check if customer exists by phone
            let existingCustomer = await Customer.findOne({ 
                where: { phone: customerPhone }, 
                transaction: t 
            });
            
            if (existingCustomer) {
                finalCustomerId = existingCustomer.id;
            } else {
                // Auto-create new customer
                const newCustomer = await Customer.create({
                    fullName: customerName,
                    phone: customerPhone,
                    email: customerEmail || null,
                    streetAddress: customerAddress || null,
                    customerType: 'Regular',
                    status: 'Active',
                    source: 'invoice'
                }, { transaction: t });
                finalCustomerId = newCustomer.id;
            }
        }

        // Create sale
        const sale = await Sale.create({
            invoiceNumber,
            customerId: finalCustomerId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            paymentMethod,
            paymentStatus: paymentStatus || 'pending',
            notes,
            status,
            saleDate: new Date()
        }, { transaction: t });

        // Process each sale item
        for (const item of items) {
            const { 
                productId, 
                quantity, 
                unitPrice, 
                netWeight,
                metalRate,
                makingCharge,
                taxRate = 3,
                taxAmount: itemTax,
                lineTotal 
            } = item;

            // Check product stock
            const product = await Product.findByPk(productId, { transaction: t });
            
            if (!product) {
                await t.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: `Product with ID ${productId} not found` 
                });
            }

            if (product.quantity < quantity) {
                await t.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${quantity}` 
                });
            }

            // Create sale item
            await SaleItem.create({
                saleId: sale.id,
                productId,
                productName: product.name,
                quantity,
                unitPrice,
                totalPrice: lineTotal,
                discount: 0,
                taxRate: taxRate || 3,
                taxAmount: itemTax || 0,
                lineTotal: lineTotal
            }, { transaction: t });

            // Record previous stock before update
            const previousStock = product.quantity;
            const newStock = previousStock - quantity;

            // Update product stock (REDUCE)
            await product.update({
                quantity: newStock
            }, { transaction: t });

            // Create stock movement record
            await StockMovement.create({
                productId,
                movementType: 'sale',
                quantity: -quantity,  // Negative for stock out
                previousStock,
                newStock,
                referenceType: 'sale',
                referenceId: sale.id,
                referenceNumber: invoiceNumber,
                unitPrice,
                totalValue: lineTotal,
                notes: `Sale to ${customerName}`,
                movementDate: new Date()
            }, { transaction: t });
        }

        await t.commit();

        // Fetch complete sale with items
        const completeSale = await Sale.findByPk(sale.id, {
            include: [
                {
                    model: SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                },
                {
                    model: Customer,
                    as: 'customer'
                }
            ]
        });

        console.log('Sale created successfully:', completeSale.id);

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'CREATE',
                entityType: 'SALE',
                entityId: sale.id,
                description: `Created invoice ${invoiceNumber} for ${customerName}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            data: completeSale
        });
    } catch (error) {
        await t.rollback();
        console.error('===== ERROR CREATING SALE =====');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
            console.error('SQL Error:', error.original?.message || error.original);
            console.error('SQL Error Code:', error.original?.code);
            console.error('SQL State:', error.original?.sqlState);
            console.error('Validation errors:', error.errors);
        }
        
        console.error('Request body was:', JSON.stringify(req.body, null, 2));
        console.error('================================');
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create sale', 
            error: error.message,
            details: error.toString(),
            sqlError: error.original?.message
        });
    }
};

// @desc    Update sale/invoice
// @route   PUT /api/sales/:id
// @access  Public
exports.updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const sale = await Sale.findByPk(id);

        if (!sale) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sale not found' 
            });
        }

        // Don't allow updating items through this endpoint
        // Items should be updated separately or recreate the sale
        delete updateData.items;

        await sale.update(updateData);

        const updatedSale = await Sale.findByPk(id, {
            include: [
                {
                    model: SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                },
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: Payment,
                    as: 'payments'
                }
            ]
        });

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'UPDATE',
                entityType: 'SALE',
                entityId: id,
                description: `Updated invoice ${updatedSale.invoiceNumber}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            message: 'Sale updated successfully',
            data: updatedSale
        });
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update sale', 
            error: error.message 
        });
    }
};

// @desc    Delete sale/invoice
// @route   DELETE /api/sales/:id
// @access  Public
exports.deleteSale = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;

        const sale = await Sale.findByPk(id, {
            include: [
                {
                    model: SaleItem,
                    as: 'items'
                }
            ]
        }, { transaction: t });

        if (!sale) {
            await t.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Sale not found' 
            });
        }

        // Restore stock for each item
        for (const item of sale.items) {
            const product = await Product.findByPk(item.productId, { transaction: t });
            
            if (product) {
                const previousStock = product.quantity;
                const newStock = previousStock + item.quantity;

                await product.update({
                    quantity: newStock
                }, { transaction: t });

                // Create stock movement record for restoration
                await StockMovement.create({
                    productId: item.productId,
                    movementType: 'return',
                    quantity: item.quantity,  // Positive for stock in
                    previousStock,
                    newStock,
                    referenceType: 'sale',
                    referenceId: sale.id,
                    referenceNumber: sale.invoiceNumber,
                    unitPrice: item.unitPrice,
                    totalValue: item.lineTotal,
                    notes: `Return from deleted sale ${sale.invoiceNumber}`,
                    movementDate: new Date()
                }, { transaction: t });
            }
        }

        await sale.destroy({ transaction: t });
        await t.commit();

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'DELETE',
                entityType: 'SALE',
                entityId: id,
                description: `Deleted invoice ${sale.invoiceNumber} and restored stock`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            message: 'Sale deleted successfully and stock restored'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting sale:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete sale', 
            error: error.message 
        });
    }
};

// @desc    Search products by SKU or name for invoice
// @route   GET /api/sales/search-products
// @access  Public
exports.searchProducts = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const products = await Product.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { type: { [Op.like]: `%${query}%` } },
                    { description: { [Op.like]: `%${query}%` } }
                ],
                quantity: { [Op.gt]: 0 }  // Only show products with stock
            },
            include: [
                {
                    model: require('./Designer'),
                    as: 'designer',
                    attributes: ['id', 'name']
                }
            ],
            limit: 10
        });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search products', 
            error: error.message 
        });
    }
};

// @desc    Get sales statistics
// @route   GET /api/sales/stats
// @access  Public
exports.getSalesStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const where = {};
        if (startDate && endDate) {
            where.saleDate = {
                [Op.between]: [startDate, endDate]
            };
        }

        const totalSales = await Sale.count({ where });
        const totalRevenue = await Sale.sum('totalAmount', { where });
        const totalPaid = await Payment.sum('amount');
        
        const pendingSales = await Sale.count({ 
            where: { ...where, paymentStatus: 'pending' } 
        });
        const paidSales = await Sale.count({ 
            where: { ...where, paymentStatus: 'paid' } 
        });

        // Get top selling products
        const topProducts = await SaleItem.findAll({
            attributes: [
                'productId',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
                [sequelize.fn('SUM', sequelize.col('lineTotal')), 'totalValue']
            ],
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['name', 'type', 'frontImage']
                }
            ],
            group: ['productId'],
            order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
            limit: 5
        });

        res.json({
            success: true,
            data: {
                totalSales,
                totalRevenue: totalRevenue || 0,
                totalPaid: totalPaid || 0,
                totalPending: (totalRevenue || 0) - (totalPaid || 0),
                pendingSales,
                paidSales,
                topProducts
            }
        });
    } catch (error) {
        console.error('Error fetching sales statistics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch sales statistics', 
            error: error.message 
        });
    }
};
