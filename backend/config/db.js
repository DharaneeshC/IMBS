const { Sequelize } = require('sequelize');

// Create Sequelize instance with MySQL connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'jewellery_shop',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true
        }
    }
);

// Test database connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Database Connected Successfully');
        
        // Sync all models with database
        // In production, ensure tables exist. Use migrations for schema changes.
        // { alter: true } helps keeping dev DB in sync
        await sequelize.sync({ alter: true });
        console.log('✅ Database Models Synchronized');
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    } catch (error) {
        console.error('❌ Unable to connect to MySQL database:', error.message);
        console.error('Error details:', error);
        throw error;
    }
};

module.exports = { sequelize, connectDB };
