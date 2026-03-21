const dotenv = require('dotenv');
dotenv.config();

const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');

const ADMIN_EMAIL = 'admin@jewellery.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE = 'admin';
const ADMIN_NAME = 'System Administrator';

const setupAdminUser = async () => {
    try {
        console.log('🔧 Setting up admin user...');
        
        // Connect to database
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ 
            where: { email: ADMIN_EMAIL } 
        });

        if (existingAdmin) {
            await existingAdmin.update({
                password: ADMIN_PASSWORD,
                role: ADMIN_ROLE,
                fullName: ADMIN_NAME,
                isActive: true
            });

            console.log('✅ Admin user already existed. Credentials were reset.');
            console.log('==========================================');
            console.log(`Email: ${ADMIN_EMAIL}`);
            console.log(`Password: ${ADMIN_PASSWORD}`);
            console.log(`Role: ${ADMIN_ROLE}`);
            console.log('==========================================');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD, // Will be hashed automatically by the model hook
            role: ADMIN_ROLE,
            fullName: ADMIN_NAME,
            isActive: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('==========================================');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log(`Role: ${ADMIN_ROLE}`);
        console.log('==========================================');
        console.log('⚠️  Please change the password after first login!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error setting up admin user:', error);
        process.exit(1);
    }
};

setupAdminUser();
