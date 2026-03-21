require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jewellery_shop'
    });
    
    console.log('Connected to database\n');
    
    // Check current structure
    const [columns] = await connection.query('DESCRIBE sale_items');
    console.log('Current sale_items columns:');
    console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Default: c.Default })));
    
    const existingColumns = columns.map(c => c.Field);
    
    // Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'taxRate', sql: 'ALTER TABLE sale_items ADD COLUMN taxRate DECIMAL(5,2) DEFAULT 3.00 AFTER discount' },
      { name: 'taxAmount', sql: 'ALTER TABLE sale_items ADD COLUMN taxAmount DECIMAL(10,2) DEFAULT 0.00 AFTER taxRate' },
      { name: 'lineTotal', sql: 'ALTER TABLE sale_items ADD COLUMN lineTotal DECIMAL(10,2) NULL AFTER taxAmount' }
    ];
    
    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`\nAdding column: ${col.name}`);
        await connection.query(col.sql);
        console.log(`✅ Added ${col.name}`);
      } else {
        console.log(`✓ Column ${col.name} already exists`);
      }
    }
    
    // Make productName nullable if it's NOT NULL
    const productNameCol = columns.find(c => c.Field === 'productName');
    if (productNameCol && productNameCol.Null === 'NO') {
      console.log('\nMaking productName nullable...');
      await connection.query('ALTER TABLE sale_items MODIFY COLUMN productName VARCHAR(255) NULL');
      console.log('✅ productName is now nullable');
    }
    
    // Make totalPrice nullable if it's NOT NULL
    const totalPriceCol = columns.find(c => c.Field === 'totalPrice');
    if (totalPriceCol && totalPriceCol.Null === 'NO') {
      console.log('\nMaking totalPrice nullable...');
      await connection.query('ALTER TABLE sale_items MODIFY COLUMN totalPrice DECIMAL(10,2) NULL');
      console.log('✅ totalPrice is now nullable');
    }
    
    console.log('\n✅ Database migration completed!');
    
    // Show final structure
    const [finalColumns] = await connection.query('DESCRIBE sale_items');
    console.log('\nFinal sale_items structure:');
    console.table(finalColumns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Default: c.Default })));
    
    await connection.end();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
})();
