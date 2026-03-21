const Product = require('../models/Product');

// Helper function to check and emit stock alerts
const checkStockLevel = (io, product) => {
  const quantity = product.quantity || 0;
  const reorderLevel = product.reorderLevel || 10;
  
  // Out of stock alert (critical)
  if (quantity === 0) {
    io.emit('stock:out', {
      productId: product.id,
      productName: product.name,
      quantity: 0,
      reorderLevel: reorderLevel,
      type: 'out-of-stock'
    });
    console.log(`🚨 Out of stock alert emitted for: ${product.name}`);
  }
  // Low stock alert (below reorder level but not zero)
  else if (quantity <= reorderLevel) {
    // Calculate estimated days left (assuming average 0.5 sales per day)
    const avgSalesPerDay = product.avgSalesPerDay || 0.5;
    const daysLeft = avgSalesPerDay > 0 ? Math.floor(quantity / avgSalesPerDay) : 999;
    
    // Critical alert if will run out within 3 days
    if (daysLeft <= 3) {
      io.emit('stock:critical', {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        reorderLevel: reorderLevel,
        daysLeft: daysLeft,
        type: 'critical'
      });
      console.log(`⚠️ Critical stock alert emitted for: ${product.name} (${daysLeft} days left)`);
    } else {
      io.emit('stock:low', {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        reorderLevel: reorderLevel,
        type: 'low-stock'
      });
      console.log(`📦 Low stock alert emitted for: ${product.name}`);
    }
  }
};

// Wrapper function to add stock monitoring to product updates
const withStockMonitoring = (controllerFunction) => {
  return async (req, res) => {
    const io = req.app.get('io');
    
    // Store original send and json methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // Override json method to check stock after response
    res.json = function(data) {
      // Check if this is a product update response
      if (data && (data.id || (Array.isArray(data) && data.length > 0))) {
        const products = Array.isArray(data) ? data : [data];
        
        // Check stock levels for all products
        products.forEach(product => {
          if (product && typeof product.quantity !== 'undefined') {
            checkStockLevel(io, product);
          }
        });
      }
      
      return originalJson(data);
    };
    
    // Call the original controller
    return controllerFunction(req, res);
  };
};

module.exports = {
  checkStockLevel,
  withStockMonitoring
};
