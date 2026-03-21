// Load environment variables FIRST
require('dotenv').config();

const { sequelize } = require('./config/db');
const { QueryTypes } = require('sequelize');

async function addImageColumns() {
    try {
        console.log('Adding image columns to products table...');
        
        // Check if columns already exist
        const columns = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'products' 
            AND TABLE_SCHEMA = DATABASE()
        `, { type: QueryTypes.SELECT });
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        
        // Add frontImage column if it doesn't exist
        if (!existingColumns.includes('frontImage')) {
            await sequelize.query(`
                ALTER TABLE products 
                ADD COLUMN frontImage TEXT NULL
            `);
            console.log('✓ Added frontImage column');
        } else {
            console.log('- frontImage column already exists');
        }
        
        // Add rearImage column if it doesn't exist
        if (!existingColumns.includes('rearImage')) {
            await sequelize.query(`
                ALTER TABLE products 
                ADD COLUMN rearImage TEXT NULL
            `);
            console.log('✓ Added rearImage column');
        } else {
            console.log('- rearImage column already exists');
        }
        
        // Add otherImages column if it doesn't exist
        if (!existingColumns.includes('otherImages')) {
            await sequelize.query(`
                ALTER TABLE products 
                ADD COLUMN otherImages TEXT NULL
            `);
            console.log('✓ Added otherImages column');
        } else {
            console.log('- otherImages column already exists');
        }
        
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

addImageColumns();
