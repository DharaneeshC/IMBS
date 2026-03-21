
require('dotenv').config();
const { sequelize } = require('./config/db');
const { Customer, Sale } = require('./models');

async function testFetch() {
    try {
        const result = await Customer.findAndCountAll({
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Sale,
                    as: 'sales',
                    attributes: ['id', 'invoiceNumber', 'totalAmount', 'paymentStatus', 'saleDate'],
                    required: false
                }
            ],
            logging: console.log
        });
        console.log('Result count API equivalent:', result.count);
        console.log('Rows API equivalent:', result.rows.length);
    } catch(e) {
        console.error('Fetch error:', e);
    } finally {
        process.exit();
    }
}
testFetch();

