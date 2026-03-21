const { Sale, SaleItem, Product, sequelize } = require('./models');

(async () => {
  const t = await sequelize.transaction();
  
  try {
    console.log('Starting test sale creation...\n');
    
    // Get a product
    const product = await Product.findOne();
    if (!product) {
      console.log('No products found in database!');
      process.exit(1);
    }
    
    console.log('Using product:', product.name, 'ID:', product.id);
    
    // Create a test sale
    const sale = await Sale.create({
      invoiceNumber: 'TEST' + Date.now(),
      customerName: 'Test Customer',
      customerEmail: 'test@test.com',
      customerPhone: '1234567890',
      subtotal: 1000,
      taxAmount: 30,
      discountAmount: 0,
      totalAmount: 1030,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'confirmed',
      saleDate: new Date()
    }, { transaction: t });
    
    console.log('Sale created with ID:', sale.id);
    
    // Try to create sale item
    console.log('\nAttempting to create sale item...');
    const saleItem = await SaleItem.create({
      saleId: sale.id,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: 1000.00,
      totalPrice: 1000.00,
      discount: 0
    }, { transaction: t });
    
    console.log('Sale item created successfully!');
    console.log('Sale item data:', JSON.stringify(saleItem.toJSON(), null, 2));
    
    await t.rollback(); // Don't actually save the test data
    console.log('\nTest completed successfully (rolled back)');
    process.exit(0);
  } catch (error) {
    await t.rollback();
    console.error('\n===== ERROR =====');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.original) {
      console.error('\nSQL Error:', error.original.message);
      console.error('SQL Code:', error.original.code);
      console.error('SQL State:', error.original.sqlState);
      console.error('SQL:', error.original.sql);
    }
    
    if (error.errors) {
      console.error('\nValidation errors:', error.errors);
    }
    
    process.exit(1);
  }
})();
