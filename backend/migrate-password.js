require('dotenv').config();
const { sequelize } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const migratePasswordToHash = async () => {
  try {
    console.log('🔐 Starting password migration to bcrypt hashing...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');

    // Find the admin user
    const adminUser = await User.findOne({ 
      where: { email: 'admin@jewellery.com' } 
    });

    if (!adminUser) {
      console.log('⚠️  Admin user not found. Creating new admin user with hashed password...');
      
      // Create admin user with hashed password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@jewellery.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'System Administrator',
        isActive: true
      });

      console.log('✅ Admin user created with hashed password\n');
    } else {
      console.log('📝 Admin user found. Checking password...');
      
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isAlreadyHashed = adminUser.password.startsWith('$2');
      
      if (isAlreadyHashed) {
        console.log('✅ Password is already hashed. No migration needed.\n');
      } else {
        console.log('🔄 Password is not hashed. Migrating to bcrypt...');
        
        // Hash the plain text password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Update directly in database to bypass hooks
        await sequelize.query(
          'UPDATE users SET password = ? WHERE email = ?',
          {
            replacements: [hashedPassword, 'admin@jewellery.com']
          }
        );

        console.log('✅ Password migrated successfully!\n');
      }
    }

    // Verify the password works
    const verifyUser = await User.findOne({ 
      where: { email: 'admin@jewellery.com' } 
    });

    const isPasswordValid = await bcrypt.compare('admin123', verifyUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('📧 Email: admin@jewellery.com');
      console.log('🔑 Password: admin123');
      console.log('\n✅ Migration completed successfully!\n');
    } else {
      console.error('❌ Password verification failed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the migration
migratePasswordToHash();
