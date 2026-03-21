const { Designer, Product, UserActivity } = require('../models');
const { Op } = require('sequelize');

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

// @desc    Get all designers
// @route   GET /api/designers
// @access  Public
exports.getAllDesigners = async (req, res) => {
    try {
        const designers = await Designer.findAll({
            order: [['id', 'ASC']]
        });
        
        await logActivity('VIEW', 'DESIGNERS', null, 'Viewed all designers', req);
        res.json(designers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single designer
// @route   GET /api/designers/:id
// @access  Public
exports.getDesignerById = async (req, res) => {
    try {
        const designer = await Designer.findByPk(req.params.id);
        
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        
        const products = await Product.findAll({ 
            where: { designerId: req.params.id }
        });
        
        await logActivity('VIEW', 'DESIGNER', req.params.id, `Viewed designer: ${designer.name}`, req);
        res.json({ designer, products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new designer
// @route   POST /api/designers
// @access  Public
exports.createDesigner = async (req, res) => {
    try {
        const { companyName, displayName, name, email, phone, street, city, state, pincode, country, gstin } = req.body;
        
        if (!companyName || !displayName || !name || !email) {
            return res.status(400).json({ message: 'Please provide company name, display name, contact person name, and email' });
        }
        
        const designer = await Designer.create({
            companyName,
            displayName,
            name,
            email,
            phone,
            street,
            city,
            state,
            pincode,
            country: country || 'India',
            gstin,
            status: 'active'
        });
        
        await logActivity('CREATE', 'DESIGNER', designer.id, `Created designer: ${designer.name}`, req, null, designer.toJSON());
        res.status(201).json(designer);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update designer
// @route   PUT /api/designers/:id
// @access  Public
exports.updateDesigner = async (req, res) => {
    try {
        const { companyName, displayName, name, email, phone, street, city, state, pincode, country, gstin, status } = req.body;
        
        if (!companyName || !displayName || !name || !email) {
            return res.status(400).json({ message: 'Please provide company name, display name, contact person name, and email' });
        }
        
        const designer = await Designer.findByPk(req.params.id);
        
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        
        const oldValue = designer.toJSON();
        
        await designer.update({
            companyName,
            displayName,
            name,
            email,
            phone,
            street,
            city,
            state,
            pincode,
            country: country || 'India',
            gstin,
            status: status || 'active'
        });
        
        await logActivity('UPDATE', 'DESIGNER', designer.id, `Updated designer: ${designer.name}`, req, oldValue, designer.toJSON());
        res.json(designer);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete designer
// @route   DELETE /api/designers/:id
// @access  Public
exports.deleteDesigner = async (req, res) => {
    try {
        const designer = await Designer.findByPk(req.params.id);
        
        if (!designer) {
            return res.status(404).json({ message: 'Designer not found' });
        }
        
        // Check if designer has products
        const productCount = await Product.count({ where: { designerId: req.params.id } });
        
        if (productCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete designer. ${productCount} product(s) are associated with this designer.` 
            });
        }
        
        const oldValue = designer.toJSON();
        await designer.destroy();
        
        await logActivity('DELETE', 'DESIGNER', req.params.id, `Deleted designer: ${oldValue.name}`, req, oldValue, null);
        res.json({ message: 'Designer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
