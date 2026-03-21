// Load environment variables FIRST
require('dotenv').config();

const { sequelize, Designer, Product, Sale, SaleItem, Payment, InventoryChange, UserActivity } = require('./models');

/**
 * Database Setup Script
 * This script will:
 * 1. Test MySQL connection
 * 2. Create all tables
 * 3. Optionally seed sample data
 */

async function setupDatabase() {
    console.log('🔧 Starting Database Setup...\n');

    try {
        // Test connection
        console.log('1️Testing MySQL connection...');
        await sequelize.authenticate();
        console.log('   Connected to MySQL successfully!\n');

        // Sync all models
        console.log('2️Creating/Updating database tables...');
        await sequelize.sync({ alter: true });
        console.log('   All tables created/updated successfully!\n');

        // Show created tables
        console.log('3️⃣  Database Tables:');
        console.log('   📊 designers - Supplier/designer information');
        console.log('   📦 products - Product inventory');
        console.log('   🛒 sales - Sales transactions');
        console.log('   📝 sale_items - Sale line items');
        console.log('   💳 payments - Payment records');
        console.log('   📈 inventory_changes - Stock movement audit');
        console.log('   👤 user_activities - Activity logs\n');

        // Get table counts
        const designerCount = await Designer.count();
        const productCount = await Product.count();
        const saleCount = await Sale.count();
        const activityCount = await UserActivity.count();
        const inventoryChangeCount = await InventoryChange.count();

        console.log('4️⃣  Current Data:');
        console.log(`   Designers: ${designerCount}`);
        console.log(`   Products: ${productCount}`);
        console.log(`   Sales: ${saleCount}`);
        console.log(`   Activities Logged: ${activityCount}`);
        console.log(`   Inventory Changes: ${inventoryChangeCount}\n`);

        console.log('✨ Database setup completed successfully!\n');
        console.log('💡 Next steps:');
        console.log('   - Run "npm run dev" to start the development server');
        console.log('   - Visit http://localhost:5000/api to verify API is running');
        console.log('   - Use the frontend to create designers and products\n');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Verify MySQL server is running');
        console.error('   2. Check .env file has correct credentials');
        console.error('   3. Ensure database exists: CREATE DATABASE jewellery_shop;');
        console.error('   4. Check MySQL user has proper permissions\n');
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔌 Database connection closed.');
        process.exit(0);
    }
}

// Run setup
setupDatabase();
