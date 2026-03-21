const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/business', reportController.getBusinessReport);

module.exports = router;