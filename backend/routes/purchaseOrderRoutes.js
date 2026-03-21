const express = require('express');
const router = express.Router();
const { activityLogger } = require('../middleware/activityLogger');
const purchaseOrderController = require('../controllers/purchaseOrderController');

// Purchase Order CRUD routes with activity logging
router.get('/', purchaseOrderController.getAllPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrderById);

router.post(
    '/',
    activityLogger('CREATE', 'purchase_order', (req) => `Created purchase order: ${req.body.poNumber || 'New PO'}`),
    purchaseOrderController.createPurchaseOrder
);

router.put(
    '/:id',
    activityLogger('UPDATE', 'purchase_order', (req) => `Updated purchase order: ${req.body.poNumber || 'ID ' + req.params.id}`),
    purchaseOrderController.updatePurchaseOrder
);

router.delete(
    '/:id',
    activityLogger('DELETE', 'purchase_order', (req) => `Deleted purchase order: ID ${req.params.id}`),
    purchaseOrderController.deletePurchaseOrder
);

// Mark as received
router.post(
    '/:id/receive',
    activityLogger('UPDATE', 'purchase_order', (req) => `Marked purchase order as received: ID ${req.params.id}`),
    purchaseOrderController.receivePurchaseOrder
);

module.exports = router;
