require('dotenv').config();
const { sequelize } = require('./config/db');
const Customer = require('./models/Customer');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        // Drop foreign key constraints and the customers table manually if necessary
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        await sequelize.query('DROP TABLE IF EXISTS customers;');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

        // Create the new customers table
        await Customer.sync({ force: true });
        console.log('customers table dropped and recreated successfully with new schema.');

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}
migrate();
