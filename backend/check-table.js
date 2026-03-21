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
    
    const [rows] = await connection.query('DESCRIBE sale_items');
    
    console.log('Sale Items Table Structure:');
    console.table(rows);
    
    await connection.end();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
