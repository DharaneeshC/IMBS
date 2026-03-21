const express = require('express');
const router = express.Router();
const repairOrderController = require('../controllers/repairOrderController');

router.get('/', repairOrderController.getAllRepairOrders);
router.get('/stats', repairOrderController.getRepairOrderStats);
router.get('/:id', repairOrderController.getRepairOrderById);
router.post('/', repairOrderController.createRepairOrder);
router.put('/:id', repairOrderController.updateRepairOrder);
router.delete('/:id', repairOrderController.deleteRepairOrder);

module.exports = router;
