const express = require('express');
const router = express.Router();
const METAL_RATES = require('../config/metalRates');

// GET /api/metal-rates - Get current metal rates (static with manual daily update)
router.get('/', async (req, res) => {
  try {
    // Return current static rates from config
    res.json({
      success: true,
      source: METAL_RATES.source,
      gold24K: METAL_RATES.gold24k,
      gold22K: METAL_RATES.gold22k,
      silver: METAL_RATES.silver,
      trends: METAL_RATES.trends,
      timestamp: METAL_RATES.getTimestamp(),
      lastUpdated: METAL_RATES.lastUpdated,
      formatted: {
        gold24K: METAL_RATES.formatRate(METAL_RATES.gold24k),
        gold22K: METAL_RATES.formatRate(METAL_RATES.gold22k),
        silver: METAL_RATES.formatRate(METAL_RATES.silver)
      }
    });
  } catch (error) {
    console.error('Error fetching metal rates:', error.message);

    // Return basic fallback rates on any error
    res.json({
      success: false,
      message: 'Error loading rates',
      gold24K: 7150,
      gold22K: 6554,
      silver: 89,
      trends: {
        gold: 'up',
        silver: 'up'
      },
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    });
  }
});

// GET /api/metal-rates/current - Alternative endpoint for current rates
router.get('/current', async (req, res) => {
  try {
    res.json({
      gold24k: METAL_RATES.gold24k,
      gold22k: METAL_RATES.gold22k,
      silver: METAL_RATES.silver,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metal rates' });
  }
});

module.exports = router;
