const express = require('express');
const router = express.Router();
const { activityLogger } = require('../middleware/activityLogger');
const customerController = require('../controllers/customerController');

// Customer CRUD routes with activity logging
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);

router.post(
    '/',
    activityLogger('CREATE', 'customer', (req) => `Created customer: ${req.body.name}`),
    customerController.createCustomer
);

router.put(
    '/:id',
    activityLogger('UPDATE', 'customer', (req) => `Updated customer: ${req.body.name || 'ID ' + req.params.id}`),
    customerController.updateCustomer
);

router.delete(
    '/:id',
    activityLogger('DELETE', 'customer', (req) => `Deleted customer: ID ${req.params.id}`),
    customerController.deleteCustomer
);

// Customer statistics
router.get('/:id/stats', customerController.getCustomerStats);

module.exports = router;
