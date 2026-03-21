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
    const [columns] = await connection.query('DESCRIBE sales');
    console.log('Current sales table columns:');
    console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
    
    const existingColumns = columns.map(c => c.Field);
    
    // Add customerId if missing
    if (!existingColumns.includes('customerId')) {
      console.log('\nAdding customerId column...');
      await connection.query(`
        ALTER TABLE sales 
        ADD COLUMN customerId INT NULL AFTER invoiceNumber
      `);
      console.log('✅ Added customerId column');
    } else {
      console.log('✓ customerId column already exists');
    }
    
    // Show final structure
    const [finalColumns] = await connection.query('DESCRIBE sales');
    console.log('\nFinal sales table structure:');
    console.table(finalColumns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
    
    await connection.end();
    console.log('\n✅ Database fix completed!');
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
