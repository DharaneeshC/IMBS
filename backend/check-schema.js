require('dotenv').config();
const { sequelize } = require('./config/db');

async function checkSchema() {
    try {
        const [results] = await sequelize.query('DESCRIBE customers;');
        console.log(results);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
