const express = require('express');
const router = express.Router();
const { activityLogger } = require('../middleware/activityLogger');
const saleController = require('../controllers/saleController');

// Sale/Invoice CRUD routes with activity logging
router.get('/', saleController.getAllSales);
router.get('/stats', saleController.getSalesStats);
router.get('/search-products', saleController.searchProducts);
router.get('/:id', saleController.getSaleById);

router.post(
    '/',
    activityLogger('CREATE', 'sale', (req) => `Created invoice/sale: ${req.body.invoiceNumber || 'New Sale'}`),
    saleController.createSale
);

router.put(
    '/:id',
    activityLogger('UPDATE', 'sale', (req) => `Updated invoice/sale: ${req.body.invoiceNumber || 'ID ' + req.params.id}`),
    saleController.updateSale
);

router.delete(
    '/:id',
    activityLogger('DELETE', 'sale', (req) => `Deleted invoice/sale: ID ${req.params.id}`),
    saleController.deleteSale
);

module.exports = router;
