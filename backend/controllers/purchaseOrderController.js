const { PurchaseOrder, PurchaseOrderItem, Product, Designer, StockMovement, UserActivity, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Public
exports.getAllPurchaseOrders = async (req, res) => {
    try {
        const { 
            search, 
            status, 
            designerId,
            startDate,
            endDate,
            sortBy = 'orderDate', 
            order = 'DESC',
            page = 1,
            limit = 10
        } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { poNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        if (status) {
            where.status = status;
        }

        if (designerId) {
            where.designerId = designerId;
        }

        if (startDate && endDate) {
            where.orderDate = {
                [Op.between]: [startDate, endDate]
            };
        }

        const offset = (page - 1) * limit;

        const { count, rows: purchaseOrders } = await PurchaseOrder.findAndCountAll({
            where,
            order: [[sortBy, order]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: Designer,
                    as: 'designer',
                    attributes: ['id', 'companyName', 'name', 'phone']
                },
                {
                    model: PurchaseOrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'type', 'quantity']
                        }
                    ]
                }
            ]
        });

        const totalPages = Math.ceil(count / limit);

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'VIEW',
                entityType: 'PURCHASE',
                entityId: null,
                description: 'Viewed all purchase orders',
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            data: purchaseOrders,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch purchase orders', 
            error: error.message 
        });
    }
};

// @desc    Get single purchase order by ID
// @route   GET /api/purchase-orders/:id
// @access  Public
exports.getPurchaseOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const purchaseOrder = await PurchaseOrder.findByPk(id, {
            include: [
                {
                    model: Designer,
                    as: 'designer'
                },
                {
                    model: PurchaseOrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
        });

        if (!purchaseOrder) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'VIEW',
                entityType: 'PURCHASE',
                entityId: id,
                description: `Viewed purchase order ${purchaseOrder.poNumber}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            data: purchaseOrder
        });
    } catch (error) {
        console.error('Error fetching purchase order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch purchase order', 
            error: error.message 
        });
    }
};

// @desc    Create new purchase order
// @route   POST /api/purchase-orders
// @access  Public
exports.createPurchaseOrder = async (req, res) => {
    // Generate PO number
    const t = await sequelize.transaction();
    
    try {
        const {
            designerId,
            items,
            expectedDeliveryDate,
            subtotal,
            taxAmount,
            shippingCost,
            discountAmount,
            totalAmount,
            notes,
            status = 'pending'
        } = req.body;

        // Validate required fields
        if (!designerId || !items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Designer and items are required' 
            });
        }

        // Check if designer exists
        const designer = await Designer.findByPk(designerId, { transaction: t });
        if (!designer) {
            await t.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Designer not found',
                error: `Designer with ID ${designerId} does not exist`
            });
        }

        // Generate PO number safely
        const date = new Date();
        const fullYear = date.getFullYear();
        
        // Use a lock or just findOne with order to get last one
        // Note: For high concurrency, consider a separate sequence table or atomic increment.
        // For this app scale, finding last one is likely fine.
        const lastPO = await PurchaseOrder.findOne({
            order: [['id', 'DESC']],
            transaction: t,
            lock: true // Basic locking
        });

        let nextSequence = 1;
        if (lastPO && lastPO.poNumber) {
             const parts = lastPO.poNumber.split('-');
             // Format: PO-YYYY-XXXX
             if (parts.length === 3 && parts[1] === fullYear.toString()) {
                 const lastSeq = parseInt(parts[2]);
                 if (!isNaN(lastSeq)) {
                    nextSequence = lastSeq + 1;
                 }
             }
        }
        
        const poNumber = `PO-${fullYear}-${String(nextSequence).padStart(4, '0')}`;

        // Create purchase order
        const purchaseOrder = await PurchaseOrder.create({
            poNumber,
            designerId,
            orderDate: new Date(),
            expectedDeliveryDate,
            subtotal: parseFloat(subtotal) || 0,
            taxAmount: parseFloat(taxAmount) || 0,
            shippingCost: parseFloat(shippingCost) || 0,
            discountAmount: parseFloat(discountAmount) || 0,
            totalAmount: parseFloat(totalAmount) || 0,
            notes,
            status
        }, { transaction: t });

        // Create purchase order items
        for (const item of items) {
            const { 
                productId, 
                quantity, 
                unitPrice, 
                lineTotal,
                taxRate = 0,
                taxAmount: itemTax = 0
            } = item;

            let productIdValue = null;
            let productNameValue = item.productName || 'Custom Item';

            // Check if product exists if ID is provided
            if (productId) {
                const product = await Product.findByPk(productId, { transaction: t });
                if (!product) {
                    // Just log, don't fail for this, treat as custom item if needed or handle gracefully
                    // But for strict integrity, we might want to check.
                    // Assuming productId comes from selection, it should exist.
                    // If not found, set to null and use name
                    console.warn(`Product ID ${productId} not found during PO creation`);
                } else {
                    productIdValue = productId;
                }
            }

            await PurchaseOrderItem.create({
                purchaseOrderId: purchaseOrder.id,
                productId: productIdValue,
                productName: productNameValue,
                quantity: parseFloat(quantity) || 0,
                receivedQuantity: 0,
                unitPrice: parseFloat(unitPrice) || 0,
                taxRate: parseFloat(taxRate) || 0,
                taxAmount: parseFloat(itemTax) || 0,
                lineTotal: parseFloat(lineTotal) || 0
            }, { transaction: t });
        }

        // Update designer outstanding balance
        await designer.update({
            outstandingBalance: parseFloat(designer.outstandingBalance || 0) + parseFloat(totalAmount)
        }, { transaction: t });

        await t.commit();

        // Fetch complete purchase order with items
        const completePO = await PurchaseOrder.findByPk(purchaseOrder.id, {
            include: [
                {
                    model: Designer,
                    as: 'designer'
                },
                {
                    model: PurchaseOrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
        });

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'CREATE',
                entityType: 'PURCHASE',
                entityId: purchaseOrder.id,
                description: `Created purchase order ${poNumber}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.status(201).json({
            success: true,
            message: 'Purchase order created successfully',
            data: completePO
        });
    } catch (error) {
        if (t && !t.finished) await t.rollback();
        console.error('Error creating purchase order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create purchase order', 
            error: error.message 
        });
    }
};

// @desc    Mark purchase order as received (Complete receive logic)
// @route   POST /api/purchase-orders/:id/receive
// @access  Public
exports.receivePurchaseOrder = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { items, receivedBy } = req.body;

        const purchaseOrder = await PurchaseOrder.findByPk(id, {
            include: [
                {
                    model: PurchaseOrderItem,
                    as: 'items'
                },
                {
                    model: Designer,
                    as: 'designer'
                }
            ]
        }, { transaction: t });

        if (!purchaseOrder) {
            await t.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        if (purchaseOrder.status === 'received' || purchaseOrder.status === 'cancelled') {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Cannot receive purchase order with status: ${purchaseOrder.status}` 
            });
        }

        // Process each item received
        let allItemsFullyReceived = true;

        for (const receivedItem of items) {
            const { itemId, quantityReceived } = receivedItem;

            // Find the purchase order item
            const poItem = await PurchaseOrderItem.findByPk(itemId, { transaction: t });
            
            if (!poItem) {
                await t.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: `Purchase order item with ID ${itemId} not found` 
                });
            }

            // Calculate new received quantity
            const newReceivedQuantity = poItem.receivedQuantity + quantityReceived;

            if (newReceivedQuantity > poItem.quantity) {
                await t.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot receive more than ordered quantity for item ID ${itemId}` 
                });
            }

            // Update received quantity
            await poItem.update({
                receivedQuantity: newReceivedQuantity
            }, { transaction: t });

            // INCREASE STOCK if productId is present
            if (poItem.productId) {
                const product = await Product.findByPk(poItem.productId, { transaction: t });
                if (product) {
                    const previousStock = product.quantity;
                    const newStock = previousStock + quantityReceived;

                    await product.update({
                        quantity: newStock
                    }, { transaction: t });

                    // Create stock movement record
                    await StockMovement.create({
                        productId: poItem.productId,
                        movementType: 'purchase',
                        quantity: quantityReceived,  // Positive for stock in
                        previousStock,
                        newStock,
                        referenceType: 'purchase_order',
                        referenceId: purchaseOrder.id,
                        referenceNumber: purchaseOrder.poNumber,
                        unitPrice: poItem.unitPrice,
                        totalValue: quantityReceived * parseFloat(poItem.unitPrice),
                        notes: `Purchase from ${purchaseOrder.designer?.name || 'Designer'}`,
                        performedBy: receivedBy || 'Admin',
                        movementDate: new Date()
                    }, { transaction: t });
                }
            }

            // Check if this item is fully received
            if (newReceivedQuantity < poItem.quantity) {
                allItemsFullyReceived = false;
            }
        }

        // Update purchase order status
        const newStatus = allItemsFullyReceived ? 'received' : 'partial';
        await purchaseOrder.update({
            status: newStatus,
            actualDeliveryDate: allItemsFullyReceived ? new Date() : null,
            receivedBy: receivedBy || 'Admin'
        }, { transaction: t });

        await t.commit();

        // Fetch updated purchase order
        const updatedPO = await PurchaseOrder.findByPk(id, {
            include: [
                {
                    model: Designer,
                    as: 'designer'
                },
                {
                    model: PurchaseOrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
        });

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'UPDATE',
                entityType: 'PURCHASE',
                entityId: id,
                description: `Received purchase order ${updatedPO.poNumber}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            message: 'Purchase order received successfully and stock updated',
            data: updatedPO
        });
    } catch (error) {
        await t.rollback();
        console.error('Error receiving purchase order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to receive purchase order', 
            error: error.message 
        });
    }
};

// @desc    Update purchase order
// @route   PUT /api/purchase-orders/:id
// @access  Public
exports.updatePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const purchaseOrder = await PurchaseOrder.findByPk(id);

        if (!purchaseOrder) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        // Don't allow updating items through this endpoint
        delete updateData.items;

        await purchaseOrder.update(updateData);

        const updatedPO = await PurchaseOrder.findByPk(id, {
            include: [
                {
                    model: Designer,
                    as: 'designer'
                },
                {
                    model: PurchaseOrderItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
        });

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'UPDATE',
                entityType: 'PURCHASE',
                entityId: id,
                description: `Updated purchase order ${updatedPO.poNumber}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            message: 'Purchase order updated successfully',
            data: updatedPO
        });
    } catch (error) {
        console.error('Error updating purchase order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update purchase order', 
            error: error.message 
        });
    }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Public
exports.deletePurchaseOrder = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;

        const purchaseOrder = await PurchaseOrder.findByPk(id, {
            include: [
                {
                    model: PurchaseOrderItem,
                    as: 'items'
                }
            ]
        }, { transaction: t });

        if (!purchaseOrder) {
            await t.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase order not found' 
            });
        }

        // Check if any items have been received
        const hasReceivedItems = purchaseOrder.items.some(item => item.receivedQuantity > 0);
        
        if (hasReceivedItems) {
            await t.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete purchase order with received items. Consider cancelling instead.' 
            });
        }

        await purchaseOrder.destroy({ transaction: t });
        await t.commit();

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'DELETE',
                entityType: 'PURCHASE',
                entityId: id,
                description: `Deleted purchase order ${purchaseOrder.poNumber}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            message: 'Purchase order deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting purchase order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete purchase order', 
            error: error.message 
        });
    }
};
