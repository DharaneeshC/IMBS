
require('dotenv').config();
const { sequelize } = require('./config/db');
async function test() {
   try {
       const [rows] = await sequelize.query('SELECT * FROM customers;');
       console.log('Customers found:', rows.length);
       if(rows.length>0) console.log(rows[0]);
   } catch(e) { console.error(e); }
   process.exit();
}
test();

