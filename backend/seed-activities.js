const { connectDB, sequelize } = require('./config/db');
const { UserActivity } = require('./models');

const sampleActivities = [
    {
        userId: 'Dharaneesh C',
        action: 'UPDATE',
        entityType: 'PREFERENCES',
        description: 'General Preferences Updated',
        success: true,
        createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
        userId: 'Dharaneesh C',
        action: 'UPDATE',
        entityType: 'ORGANIZATION',
        description: "Organization's Personally Identifiable Information (PII) has been updated",
        success: true,
        createdAt: new Date(Date.now() - 66 * 60 * 1000) // 66 minutes ago
    },
    {
        userId: 'Dharaneesh C',
        action: 'CREATE',
        entityType: 'PRODUCT',
        entityId: 1,
        description: 'New Product Added',
        success: true,
        createdAt: new Date(Date.now() - 195 * 60 * 1000) // 3 hours 15 minutes ago
    },
    {
        userId: 'Admin User',
        action: 'DELETE',
        entityType: 'PRODUCT',
        entityId: 5,
        description: 'Product Deleted',
        success: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
        userId: 'Store Manager',
        action: 'CREATE',
        entityType: 'DESIGNER',
        entityId: 2,
        description: 'New Designer Added',
        success: true,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    },
    {
        userId: 'Dharaneesh C',
        action: 'UPDATE',
        entityType: 'PRODUCT',
        entityId: 3,
        description: 'Product Updated',
        success: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
        userId: 'Sales Team',
        action: 'CREATE',
        entityType: 'SALE',
        entityId: 1,
        description: 'New Sale Created',
        success: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
        userId: 'Purchase Manager',
        action: 'CREATE',
        entityType: 'PURCHASE',
        entityId: 1,
        description: 'New Purchase Order Created',
        success: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
];

const seedActivities = async () => {
    try {
        console.log('🔄 Connecting to database...');
        await connectDB();

        console.log('🗑️  Clearing existing activities...');
        await UserActivity.destroy({ where: {} });

        console.log('📝 Creating sample activities...');
        await UserActivity.bulkCreate(sampleActivities);

        console.log('✅ Successfully seeded sample activities!');
        console.log(`📊 Created ${sampleActivities.length} sample activities`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding activities:', error);
        process.exit(1);
    }
};

seedActivities();
