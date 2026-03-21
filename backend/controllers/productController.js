const { Product, Designer, InventoryChange, UserActivity } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { checkStockLevel } = require('../utils/stockMonitor');

// Auto SKU Generator based on product type and metal purity
const generateSKU = async (type, metalPurity = '') => {
    const typeMap = {
        'Ring': 'RNG',
        'Necklace': 'NKL',
        'Bracelet': 'BRC',
        'Earrings': 'ERG',
        'Chain': 'CHN',
        'Pendant': 'PND',
        'Bangle': 'BNG',
        'Anklet': 'ANK',
        'Nose Pin': 'NSP',
        'Mangalsutra': 'MNG',
        'Other': 'OTH'
    };
    
    const purityMap = {
        '24K': '24K',
        '22K': '22K',
        '18K': '18K',
        '14K': '14K',
        '916': '916',
        '750': '750',
        'Silver': 'SLV'
    };
    
    const prefix = typeMap[type] || 'PRD';
    const purityCode = purityMap[metalPurity] || '';
    
    // Find the last SKU with this prefix
    const lastProduct = await Product.findOne({
        where: {
            sku: {
                [Op.like]: `${prefix}-${purityCode}%`
            }
        },
        order: [['sku', 'DESC']]
    });
    
    let sequence = 1;
    if (lastProduct && lastProduct.sku) {
        const lastSequence = parseInt(lastProduct.sku.split('-').pop());
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }
    
    return `${prefix}-${purityCode ? purityCode + '-' : ''}${String(sequence).padStart(4, '0')}`;
};

// Helper function to log user activity
const logActivity = async (action, entityType, entityId, description, req, oldValue = null, newValue = null) => {
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
            oldValue,
            newValue,
            success: true
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Helper function to log inventory changes
const logInventoryChange = async (productId, changeType, quantityBefore, quantityChange, quantityAfter, reason, referenceType = null, referenceId = null, performedBy = 'system') => {
    try {
        await InventoryChange.create({
            productId,
            changeType,
            quantityBefore,
            quantityChange,
            quantityAfter,
            referenceType,
            referenceId,
            reason,
            performedBy
        });
    } catch (error) {
        console.error('Error logging inventory change:', error);
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        await logActivity('VIEW', 'PRODUCTS', null, 'Viewed all products', req);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        await logActivity('VIEW', 'PRODUCT', req.params.id, `Viewed product: ${product.name}`, req);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get products by type
// @route   GET /api/products/type/:type
// @access  Public
exports.getProductsByType = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { type: req.params.type },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        await logActivity('VIEW', 'PRODUCTS', null, `Viewed products of type: ${req.params.type}`, req);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get products by designer
// @route   GET /api/products/designer/:designerId
// @access  Public
exports.getProductsByDesigner = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { designerId: req.params.designerId },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        await logActivity('VIEW', 'PRODUCTS', null, `Viewed products by designer ID: ${req.params.designerId}`, req);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unique product types
// @route   GET /api/products/types/all
// @access  Public
exports.getProductTypes = async (req, res) => {
    try {
        const types = await Product.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('type')), 'type']],
            raw: true
        });
        
        const typeList = types.map(t => t.type);
        res.json(typeList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Public
exports.createProduct = async (req, res) => {
    try {
        const { 
            name, sku, type, metalType, metalPurity, grossWeight, netWeight, stoneWeight,
            gemstoneType, gemstoneCount, gemstoneCarat, size, description, 
            quantity, cost, price, designer, frontImage, rearImage, otherImages 
        } = req.body;
        
        // Validate required fields
        if (!name || !type || !description || quantity === undefined || !cost || !price || !designer) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }
        
        // Check if designer exists
        const designerExists = await Designer.findByPk(designer);
        if (!designerExists) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        
        // Auto-generate SKU if not provided
        let finalSKU = sku;
        if (!finalSKU) {
            finalSKU = await generateSKU(type, metalPurity);
        }
        
        const product = await Product.create({
            name,
            sku: finalSKU,
            type,
            metalType,
            metalPurity,
            grossWeight: grossWeight || 0,
            netWeight: netWeight || 0,
            stoneWeight: stoneWeight || 0,
            gemstoneType,
            gemstoneCount: gemstoneCount || 0,
            gemstoneCarat: gemstoneCarat || 0,
            size,
            description,
            quantity,
            cost,
            price,
            designerId: designer,
            frontImage: frontImage || null,
            rearImage: rearImage || null,
            otherImages: otherImages || null
        });
        
        // Log inventory change for initial stock
        if (quantity > 0) {
            await logInventoryChange(
                product.id,
                'restock',
                0,
                quantity,
                quantity,
                'Initial stock on product creation',
                'PRODUCT_CREATION',
                product.id,
                req.headers['x-user-id'] || 'system'
            );
        }
        
        const populatedProduct = await Product.findByPk(product.id, {
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        // Check and emit stock level alert for new product
        const io = req.app.get('io');
        if (io && quantity !== undefined) {
            checkStockLevel(io, populatedProduct);
        }
        
        await logActivity('CREATE', 'PRODUCT', product.id, `Created product: ${product.name}`, req, null, populatedProduct.toJSON());
        res.status(201).json(populatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
exports.updateProduct = async (req, res) => {
    try {
        const { name, type, description, quantity, cost, price, designer, frontImage, rearImage, otherImages } = req.body;
        
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const oldValue = product.toJSON();
        const oldQuantity = product.quantity;
        
        // Check if designer exists
        if (designer) {
            const designerExists = await Designer.findByPk(designer);
            if (!designerExists) {
                return res.status(404).json({ message: 'Designer not found' });
            }
        }
        
        await product.update({
            name: name !== undefined ? name : product.name,
            type: type !== undefined ? type : product.type,
            description: description !== undefined ? description : product.description,
            quantity: quantity !== undefined ? quantity : product.quantity,
            cost: cost !== undefined ? cost : product.cost,
            price: price !== undefined ? price : product.price,
            designerId: designer !== undefined ? designer : product.designerId,
            frontImage: frontImage !== undefined ? frontImage : product.frontImage,
            rearImage: rearImage !== undefined ? rearImage : product.rearImage,
            otherImages: otherImages !== undefined ? otherImages : product.otherImages
        });
        
        // Log inventory change if quantity changed
        if (quantity !== undefined && quantity !== oldQuantity) {
            const changeType = quantity > oldQuantity ? 'restock' : 'adjustment';
            const quantityChange = quantity - oldQuantity;
            
            await logInventoryChange(
                product.id,
                changeType,
                oldQuantity,
                quantityChange,
                quantity,
                `Manual ${changeType} via product update`,
                'PRODUCT_UPDATE',
                product.id,
                req.headers['x-user-id'] || 'system'
            );
        }
        
        const populatedProduct = await Product.findByPk(product.id, {
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        // Check and emit stock level alerts via Socket.IO
        if (quantity !== undefined) {
            const io = req.app.get('io');
            if (io) {
                checkStockLevel(io, populatedProduct);
            }
        }
        
        await logActivity('UPDATE', 'PRODUCT', product.id, `Updated product: ${product.name}`, req, oldValue, populatedProduct.toJSON());
        res.json(populatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const oldValue = product.toJSON();
        
        // Log inventory change for deletion
        if (product.quantity > 0) {
            await logInventoryChange(
                product.id,
                'adjustment',
                product.quantity,
                -product.quantity,
                0,
                'Product deleted from system',
                'PRODUCT_DELETION',
                product.id,
                req.headers['x-user-id'] || 'system'
            );
        }
        
        await product.destroy();
        
        await logActivity('DELETE', 'PRODUCT', req.params.id, `Deleted product: ${oldValue.name}`, req, oldValue, null);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   POST /api/products/generate-sku
// @desc    Generate SKU suggestion
// @access  Public
exports.generateSKUSuggestion = async (req, res) => {
    try {
        const { type, metalPurity } = req.body;
        
        if (!type) {
            return res.status(400).json({ message: 'Product type is required' });
        }
        
        const suggestedSKU = await generateSKU(type, metalPurity);
        
        res.json({ sku: suggestedSKU });
    } catch (error) {
        console.error('Error generating SKU:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   GET /api/products/sku/:sku
// @desc    Get product by SKU (for barcode scanning)
// @access  Public
exports.getProductBySKU = async (req, res) => {
    try {
        const { sku } = req.params;
        
        if (!sku) {
            return res.status(400).json({ message: 'SKU is required' });
        }
        
        const product = await Product.findOne({
            where: { sku: sku.trim().toUpperCase() },
            include: [{
                model: Designer,
                as: 'designer',
                attributes: ['id', 'name', 'email', 'status']
            }]
        });
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found with this SKU' });
        }
        
        // Check stock availability
        if (product.quantity <= 0) {
            return res.status(200).json({ 
                ...product.toJSON(),
                warning: 'Out of stock'
            });
        }
        
        await logActivity('SCAN', 'PRODUCT', product.id, `Scanned product: ${product.name} (SKU: ${sku})`, req);
        res.json(product);
    } catch (error) {
        console.error('Error fetching product by SKU:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
