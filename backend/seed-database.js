// Load environment variables FIRST
require('dotenv').config();

const { sequelize, Designer, Product } = require('./models');

/**
 * Seed Script - Sample Data
 * This script creates sample designers and products for testing
 */

async function seedDatabase() {
    console.log('🌱 Seeding database with sample data...\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to MySQL\n');

        // Check if data already exists
        const existingDesigners = await Designer.count();
        if (existingDesigners > 0) {
            console.log('⚠️  Database already has data!');
            console.log(`   Found ${existingDesigners} designers`);
            
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                readline.question('   Continue anyway? (yes/no): ', resolve);
            });
            readline.close();

            if (answer.toLowerCase() !== 'yes') {
                console.log('❌ Seeding cancelled.');
                process.exit(0);
            }
        }

        console.log('Creating sample designers...');
        
        const designers = await Designer.bulkCreate([
            {
                companyName: 'Royal Jewels Pvt Ltd',
                displayName: 'Royal Jewels',
                name: 'Rajesh Kumar',
                email: 'rajesh@royaljewels.com',
                phone: '+91-9876543210',
                street: '123 Jewelry Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                country: 'India',
                gstin: '27AABCR1234F1Z5',
                status: 'active'
            },
            {
                companyName: 'Diamond House International',
                displayName: 'Diamond House',
                name: 'Priya Sharma',
                email: 'priya@diamondhouse.com',
                phone: '+91-9865432109',
                street: '456 Diamond Plaza',
                city: 'Surat',
                state: 'Gujarat',
                pincode: '395003',
                country: 'India',
                gstin: '24AABCD5678G1Z1',
                status: 'active'
            },
            {
                companyName: 'Golden Creations',
                displayName: 'Golden Creations',
                name: 'Amit Patel',
                email: 'amit@goldencreations.com',
                phone: '+91-9754321098',
                street: '789 Gold Market',
                city: 'Jaipur',
                state: 'Rajasthan',
                pincode: '302001',
                country: 'India',
                gstin: '08AABCG9012H1Z3',
                status: 'active'
            }
        ]);

        console.log(`✅ Created ${designers.length} designers\n`);

        console.log('Creating sample products...');

        const products = await Product.bulkCreate([
            // Royal Jewels Products
            {
                name: 'Diamond Solitaire Ring',
                type: 'Rings',
                description: 'Elegant 1 carat diamond solitaire ring in 18K white gold',
                quantity: 12,
                cost: 85000,
                price: 125000,
                frontImage: '/diamondsolitarering.webp',
                designerId: designers[0].id
            },
            {
                name: 'Gold Chain Necklace',
                type: 'Necklaces',
                description: '22K gold chain necklace with traditional design, 30 grams',
                quantity: 8,
                cost: 150000,
                price: 185000,
                frontImage: '/goldchainnecklace.jpg',
                designerId: designers[0].id
            },
            {
                name: 'Pearl Earrings',
                type: 'Earrings',
                description: 'South sea pearl drop earrings with diamond accents',
                quantity: 15,
                cost: 35000,
                price: 48000,
                designerId: designers[0].id
            },
            
            // Diamond House Products
            {
                name: 'Platinum Band Ring',
                type: 'Rings',
                description: 'Contemporary platinum engagement ring with micro pave diamonds',
                quantity: 6,
                cost: 95000,
                price: 140000,
                frontImage: '/diamondring.webp',
                designerId: designers[1].id
            },
            {
                name: 'Tennis Bracelet',
                type: 'Bracelets',
                description: 'Classic tennis bracelet with 3 carats of round diamonds',
                quantity: 4,
                cost: 180000,
                price: 245000,
                designerId: designers[1].id
            },
            {
                name: 'Emerald Pendant',
                type: 'Pendants',
                description: 'Colombian emerald pendant with diamond halo in 18K gold',
                quantity: 7,
                cost: 125000,
                price: 175000,
                frontImage: '/emeraldpendant.webp',
                designerId: designers[1].id
            },
            
            // Golden Creations Products
            {
                name: 'Traditional Jhumka',
                type: 'Earrings',
                description: 'Handcrafted gold jhumka earrings with meenakari work',
                quantity: 20,
                cost: 28000,
                price: 38000,
                designerId: designers[2].id
            },
            {
                name: 'Kundan Choker Set',
                type: 'Necklaces',
                description: 'Bridal kundan choker necklace set with matching earrings',
                quantity: 3,
                cost: 220000,
                price: 295000,
                frontImage: '/Kundan.webp',
                designerId: designers[2].id
            },
            {
                name: 'Gold Bangles Set',
                type: 'Bracelets',
                description: 'Set of 4 traditional gold bangles, 22K, 40 grams',
                quantity: 10,
                cost: 200000,
                price: 240000,
                designerId: designers[2].id
            },
            {
                name: 'Silver Anklet Pair',
                type: 'Anklets',
                description: 'Oxidized silver anklets with traditional bell design',
                quantity: 2,
                cost: 4500,
                price: 7200,
                designerId: designers[2].id
            }
        ]);

        console.log(`✅ Created ${products.length} products\n`);

        console.log('📊 Database Summary:');
        console.log(`   Designers: ${designers.length}`);
        console.log(`   Products: ${products.length}`);
        console.log(`   Total Inventory Value (Cost): ₹${products.reduce((sum, p) => sum + (parseFloat(p.cost) * p.quantity), 0).toLocaleString('en-IN')}`);
        console.log(`   Total Inventory Value (Price): ₹${products.reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0).toLocaleString('en-IN')}\n`);

        console.log('✨ Sample data created successfully!\n');
        console.log('💡 You can now:');
        console.log('   - Start the server: npm run dev');
        console.log('   - View products at: http://localhost:5000/api/products');
        console.log('   - View designers at: http://localhost:5000/api/designers');
        console.log('   - Check dashboard: http://localhost:5000/api/dashboard\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            console.error('\n💡 Tip: Make sure tables are created first. Run: node setup-database.js');
        }
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seedDatabase();
