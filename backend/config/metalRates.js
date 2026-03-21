// ============================================
// MANUAL METAL RATES CONFIGURATION
// Update these rates daily from any gold website
// ============================================

const CURRENT_RATES = {
  // Current market rates (Update daily)
  gold24k: 16128.97,    // Gold 24K per gram
  gold22k: 14774.10,    // Gold 22K per gram (91.6% of 24K)
  silver: 261.58,       // Silver (99.9% pure) per gram

  // Last updated date (Update when rates change)
  lastUpdated: '2026-03-17',

  // Trends (up/down/same) - Update based on market movement
  trends: {
    gold: 'up',     // 'up', 'down', or 'same'
    silver: 'up'    // 'up', 'down', or 'same'
  },

  // Rate source for reference
  source: 'Manual Update',

  // Format rates with proper Indian number system
  formatRate: function(rate) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rate);
  },

  // Get formatted timestamp
  getTimestamp: function() {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};

// Instructions for daily update:
// 1. Visit any gold rate website (e.g., goldprice.org, livechennai.com)
// 2. Update gold24k with current 24K gold rate per gram
// 3. Calculate gold22k = gold24k * 0.916 (22K is 91.6% pure)
// 4. Update silver rate per gram
// 5. Change lastUpdated date to today
// 6. Update trends based on market movement
// 7. Restart server or rates will auto-refresh

module.exports = CURRENT_RATES;