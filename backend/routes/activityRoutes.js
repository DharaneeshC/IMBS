const express = require('express');
const router = express.Router();
const { logClientActivity } = require('../controllers/activityController');

router.post('/log', logClientActivity);

module.exports = router;
