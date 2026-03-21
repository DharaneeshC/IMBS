const { RepairOrder } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db'); // Import sequelize for transaction

// Generate unique repair order number
const generateOrderNumber = async (transaction) => {
  const date = new Date();
  const fullYear = date.getFullYear();
  
  // Format: RO-YYYY-XXXX (e.g., RO-2026-0001)
  const prefix = `RO-${fullYear}-`;
  
  const lastOrder = await RepairOrder.findOne({
    where: {
      orderNumber: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['id', 'DESC']],
    transaction
  });
  
  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2]);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

// Generate unique token number
const generateTokenNumber = async (transaction) => {
  const lastOrder = await RepairOrder.findOne({
    order: [['id', 'DESC']],
    transaction
  });
  
  let sequence = 1;
  if (lastOrder && lastOrder.tokenNumber) {
    const parts = lastOrder.tokenNumber.split('-');
    if (parts.length === 2 && !isNaN(parts[1])) {
      sequence = parseInt(parts[1]) + 1;
    }
  }
  
  return `TOK-${String(sequence).padStart(4, '0')}`;
};

exports.getAllRepairOrders = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    
    let whereClause = {};
    
    if (status && status !== 'All') {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { customerPhone: { [Op.like]: `%${search}%` } },
        { productName: { [Op.like]: `%${search}%` } },
        { productSKU: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (startDate && endDate) {
      whereClause.receivedDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const repairOrders = await RepairOrder.findAll({
      where: whereClause,
      order: [['receivedDate', 'DESC']]
    });
    
    res.json(repairOrders);
  } catch (error) {
    console.error('Error fetching repair orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repair orders',
      details: error.message 
    });
  }
};

exports.getRepairOrderById = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findByPk(req.params.id);
    
    if (!repairOrder) {
      return res.status(404).json({ error: 'Repair order not found' });
    }
    
    res.json(repairOrder);
  } catch (error) {
    console.error('Error fetching repair order:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repair order',
      details: error.message 
    });
  }
};

exports.createRepairOrder = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      productName,
      productSKU,
      metalType,
      estimatedWeight,
      serviceType,
      priority,
      issueDescription,
      receivedDate,
      expectedDeliveryDate,
      repairCharges,
      advancePayment,
      paymentStatus,
      repairNotes,
      assignedTo
    } = req.body;
    
    // Basic validation
    if (!customerName || !customerPhone || !productName || !expectedDeliveryDate) {
        await t.rollback();
        return res.status(400).json({ 
            error: 'Missing required fields',
            details: 'Customer Name, Phone, Product Name and Expected Delivery Date are required.' 
        });
    }

    const orderNumber = await generateOrderNumber(t);
    const tokenNumber = await generateTokenNumber(t);
    
    const charges = parseFloat(repairCharges) || 0;
    const advance = parseFloat(advancePayment) || 0;
    const balanceAmount = charges - advance;
    
    // Merge repairNotes into issueDescription if both exist, or use whichever exists
    let finalIssueDescription = issueDescription || '';
    if (repairNotes) {
        finalIssueDescription = finalIssueDescription ? `${finalIssueDescription}\n\nInternal Notes: ${repairNotes}` : `Internal Notes: ${repairNotes}`;
    }
    
    const repairOrder = await RepairOrder.create({
      orderNumber,
      tokenNumber,
      customerName,
      customerPhone,
      customerEmail,
      productName,
      productSKU,
      metalType,
      estimatedWeight,
      serviceType,
      priority: priority || 'Normal',
      issueDescription: finalIssueDescription,
      receivedDate: receivedDate || new Date(),
      expectedDeliveryDate,
      repairCharges: charges,
      advancePayment: advance,
      balanceAmount,
      paymentStatus: paymentStatus || 'Pending',
      repairNotes: null, // We merged it, so clear strictly or keep it if model demands. User said "remove as separate field", so merging is good.
      assignedTo,
      status: 'Pending'
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).json(repairOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error creating repair order:', error);
    res.status(500).json({ 
      error: 'Failed to create repair order',
      details: error.message 
    });
  }
};

exports.updateRepairOrder = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findByPk(req.params.id);
    
    if (!repairOrder) {
      return res.status(404).json({ error: 'Repair order not found' });
    }
    
    const {
      customerName,
      customerPhone,
      customerEmail,
      productName,
      productSKU,
      metalType,
      estimatedWeight,
      serviceType,
      priority,
      issueDescription,
      expectedDeliveryDate,
      actualDeliveryDate,
      status,
      repairCharges,
      advancePayment,
      paymentStatus,
      repairNotes,
      assignedTo
    } = req.body;
    
    const balanceAmount = parseFloat(repairCharges !== undefined ? repairCharges : repairOrder.repairCharges) - 
                         parseFloat(advancePayment !== undefined ? advancePayment : repairOrder.advancePayment);
    
    await repairOrder.update({
      customerName: customerName || repairOrder.customerName,
      customerPhone: customerPhone || repairOrder.customerPhone,
      customerEmail,
      productName: productName || repairOrder.productName,
      productSKU,
      metalType,
      estimatedWeight,
      serviceType,
      priority: priority || repairOrder.priority,
      issueDescription: issueDescription || repairOrder.issueDescription,
      expectedDeliveryDate: expectedDeliveryDate || repairOrder.expectedDeliveryDate,
      actualDeliveryDate,
      status: status || repairOrder.status,
      repairCharges: repairCharges !== undefined ? repairCharges : repairOrder.repairCharges,
      advancePayment: advancePayment !== undefined ? advancePayment : repairOrder.advancePayment,
      balanceAmount,
      paymentStatus: paymentStatus || repairOrder.paymentStatus,
      repairNotes,
      assignedTo
    });
    
    res.json(repairOrder);
  } catch (error) {
    console.error('Error updating repair order:', error);
    res.status(500).json({ 
      error: 'Failed to update repair order',
      details: error.message 
    });
  }
};

exports.deleteRepairOrder = async (req, res) => {
  try {
    const repairOrder = await RepairOrder.findByPk(req.params.id);
    
    if (!repairOrder) {
      return res.status(404).json({ error: 'Repair order not found' });
    }
    
    await repairOrder.destroy();
    
    res.json({ message: 'Repair order deleted successfully' });
  } catch (error) {
    console.error('Error deleting repair order:', error);
    res.status(500).json({ 
      error: 'Failed to delete repair order',
      details: error.message 
    });
  }
};

exports.getRepairOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      deliveredOrders
    ] = await Promise.all([
      RepairOrder.count(),
      RepairOrder.count({ where: { status: 'Pending' } }),
      RepairOrder.count({ where: { status: 'In Progress' } }),
      RepairOrder.count({ where: { status: 'Completed' } }),
      RepairOrder.count({ where: { status: 'Delivered' } })
    ]);
    
    const totalRevenue = await RepairOrder.sum('repairCharges', {
      where: { status: ['Completed', 'Delivered'] }
    });
    
    const pendingRevenue = await RepairOrder.sum('balanceAmount', {
      where: { status: { [Op.notIn]: ['Delivered', 'Cancelled'] } }
    });
    
    res.json({
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      deliveredOrders,
      totalRevenue: totalRevenue || 0,
      pendingRevenue: pendingRevenue || 0
    });
  } catch (error) {
    console.error('Error fetching repair order stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repair order stats',
      details: error.message 
    });
  }
};
