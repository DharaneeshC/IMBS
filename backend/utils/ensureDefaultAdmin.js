const User = require('../models/User');

const ADMIN_EMAIL = 'admin@jewellery.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE = 'admin';
const ADMIN_NAME = 'System Administrator';

async function ensureDefaultAdmin() {
    const existingAdmin = await User.findOne({ where: { email: ADMIN_EMAIL } });

    if (existingAdmin) {
        // Admin exists - don't overwrite password or other fields
        console.log('Default admin already exists');
        return;
    }

    // Create the admin only if it doesn't exist
    await User.create({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: ADMIN_ROLE,
        fullName: ADMIN_NAME,
        isActive: true
    });

    console.log('Default admin user created');
}

module.exports = { ensureDefaultAdmin };
