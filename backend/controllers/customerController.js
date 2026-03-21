const { Customer, Sale, Payment, UserActivity } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
exports.getAllCustomers = async (req, res) => {
    try {
        const { 
            search, 
            customerType, 
            status, 
            sortBy = 'createdAt', 
            order = 'DESC',
            page = 1,
            limit = 10
        } = req.query;

        // Build filter conditions
        const where = {};

        if (search) {
            where[Op.or] = [
                { fullName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { displayName: { [Op.like]: `%${search}%` } }
            ];
        }

        if (customerType) {
            where.customerType = customerType;
        }

        if (status) {
            where.status = status;
        }

        // Pagination
        const offset = (page - 1) * limit;

        const orderColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;

        const { count, rows: customers } = await Customer.findAndCountAll({
            where,
            order: [[orderColumn, order]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: Sale,
                    as: 'sales',
                    attributes: ['id', 'invoiceNumber', 'totalAmount', 'paymentStatus', 'saleDate'],
                    required: false
                }
            ]
        });

        // Calculate total pages
        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            data: customers,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch customers', 
            error: error.message 
        });
    }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Public
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findByPk(id, {
            include: [
                {
                    model: Sale,
                    as: 'sales',
                    include: [
                        {
                            model: Payment,
                            as: 'payments'
                        }
                    ],
                    order: [['saleDate', 'DESC']]
                }
            ]
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Customer not found' 
            });
        }

        // Calculate customer statistics
        const totalPurchases = customer.sales.length;
        const totalSpent = customer.sales.reduce((sum, sale) => 
            sum + parseFloat(sale.totalAmount || 0), 0
        );
        const totalPaid = customer.sales.reduce((sum, sale) => {
            const paidAmount = sale.payments.reduce((pSum, payment) => 
                pSum + parseFloat(payment.amount || 0), 0
            );
            return sum + paidAmount;
        }, 0);
        const totalPending = totalSpent - totalPaid;

        res.json({
            success: true,
            data: customer,
            statistics: {
                totalPurchases,
                totalSpent: totalSpent.toFixed(2),
                totalPaid: totalPaid.toFixed(2),
                totalPending: totalPending.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch customer', 
            error: error.message 
        });
    }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Public
exports.createCustomer = async (req, res) => {
    try {
        const customerData = req.body;

        // Check if phone already exists
        if (customerData.phone) {
            const existingCustomerByPhone = await Customer.findOne({ 
                where: { phone: customerData.phone } 
            });
            if (existingCustomerByPhone) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Customer phone already exists' 
                });
            }
        }

        // Check if email already exists
        if (customerData.email) {
            const existingCustomerByEmail = await Customer.findOne({ 
                where: { email: customerData.email } 
            });
            if (existingCustomerByEmail) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already exists' 
                });
            }
        }

        const customer = await Customer.create(customerData);

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'CREATE',
                entityType: 'CUSTOMER',
                entityId: customer.id,
                description: `Added new customer ${customer.fullName}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: customer
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create customer', 
            error: error.message 
        });
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const customer = await Customer.findByPk(id);

        if (!customer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Customer not found' 
            });
        }

        // Check if email is being changed and if it already exists
        if (updateData.email && updateData.email !== customer.email) {
            const existingCustomer = await Customer.findOne({ 
                where: { 
                    email: updateData.email,
                    id: { [Op.ne]: id }
                } 
            });
            if (existingCustomer) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already exists' 
                });
            }
        }

        // Check if phone is being changed and if it already exists
        if (updateData.phone && updateData.phone !== customer.phone) {
            const existingCustomer = await Customer.findOne({ 
                where: { 
                    phone: updateData.phone,
                    id: { [Op.ne]: id }
                } 
            });
            if (existingCustomer) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Customer phone already exists' 
                });
            }
        }

        await customer.update(updateData);

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'UPDATE',
                entityType: 'CUSTOMER',
                entityId: customer.id,
                description: `Updated details for customer ${customer.fullName}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: customer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update customer', 
            error: error.message 
        });
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findByPk(id);

        if (!customer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Customer not found' 
            });
        }

        // Check if customer has any sales
        const salesCount = await Sale.count({ where: { customerId: id } });
        if (salesCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete customer with existing sales. Consider deactivating instead.' 
            });
        }

        await customer.destroy();

        try {
            await UserActivity.create({
                userId: req.user?.id || req.headers['x-user-id'] || 'Dharaneesh C',
                action: 'DELETE',
                entityType: 'CUSTOMER',
                entityId: id,
                description: `Deleted customer ${customer.fullName}`,
                success: true
            });
        } catch (actErr) {
            console.error('Error logging activity:', actErr);
        }

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete customer', 
            error: error.message 
        });
    }
};

// @desc    Get customer statistics
// @route   GET /api/customers/:id/stats
// @access  Public
exports.getCustomerStats = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findByPk(id, {
            include: [
                {
                    model: Sale,
                    as: 'sales',
                    include: [
                        {
                            model: Payment,
                            as: 'payments'
                        }
                    ]
                }
            ]
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Customer not found' 
            });
        }

        // Calculate statistics
        const totalOrders = customer.sales.length;
        const totalSpent = customer.sales.reduce((sum, sale) => 
            sum + parseFloat(sale.totalAmount || 0), 0
        );
        
        const paidOrders = customer.sales.filter(sale => sale.paymentStatus === 'paid').length;
        const pendingOrders = customer.sales.filter(sale => 
            sale.paymentStatus === 'pending' || sale.paymentStatus === 'partial'
        ).length;
        
        const totalPaid = customer.sales.reduce((sum, sale) => {
            const paidAmount = sale.payments.reduce((pSum, payment) => 
                pSum + parseFloat(payment.amount || 0), 0
            );
            return sum + paidAmount;
        }, 0);
        
        const totalPending = totalSpent - totalPaid;

        // Get recent orders
        const recentOrders = customer.sales
            .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
            .slice(0, 5)
            .map(sale => ({
                id: sale.id,
                invoiceNumber: sale.invoiceNumber,
                amount: sale.totalAmount,
                paymentStatus: sale.paymentStatus,
                date: sale.saleDate
            }));

        res.json({
            success: true,
            data: {
                customer: {
                    id: customer.id,
                    name: customer.getFullName(),
                    email: customer.email,
                    phone: customer.phone,
                    customerType: customer.customerType
                },
                statistics: {
                    totalOrders,
                    totalSpent: totalSpent.toFixed(2),
                    totalPaid: totalPaid.toFixed(2),
                    totalPending: totalPending.toFixed(2),
                    paidOrders,
                    pendingOrders,
                    averageOrderValue: totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00'
                },
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error fetching customer statistics:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch customer statistics', 
            error: error.message 
        });
    }
};
