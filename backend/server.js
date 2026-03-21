const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

// Load environment variables FIRST (before any other imports that use them)
dotenv.config();

const { connectDB } = require('./config/db');
const { ensureDefaultAdmin } = require('./utils/ensureDefaultAdmin');
const websocketService = require('./services/websocketService');

// Initialize models and relationships
require('./models');

// Initialize Express app
const app = express();
let dbConnected = false;
let dbLastError = null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/designers', require('./routes/designerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrderRoutes'));
app.use('/api/repair-orders', require('./routes/repairOrderRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/metal-rates', require('./routes/metalRatesRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/api', (req, res) => {
    res.json({ 
        message: 'Jewellery Shop API is running',
        database: 'MySQL',
        version: '2.0.1'
    }); 
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Jewellery Shop API',
        docs: '/api',
        health: '/health'
    }); 
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ 
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDBWithRetry = async () => {
    const retryDelayMs = 10000;

    while (!dbConnected) {
        try {
            await connectDB();
            await ensureDefaultAdmin();
            dbConnected = true;
            dbLastError = null;
            console.log('✅ Database connection established');
        } catch (error) {
            dbLastError = error.message;
            console.error(`❌ Database connection failed. Retrying in ${retryDelayMs / 1000}s...`);
            await wait(retryDelayMs);
        }
    }
};

// Connect to MySQL and start server
const startServer = async () => {
    try {
        // Create HTTP server
        const server = http.createServer(app);

        // Initialize WebSocket service
        websocketService.initialize(server);

        server.listen(PORT, HOST, () => {
            console.log(`✅ Server is running on ${HOST}:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database: MySQL`);
            console.log(`WebSocket: Enabled`);
            console.log(`Health check: http://${HOST}:${PORT}/health`);
        });

        // Keep the API process alive and retry DB connection in the background.
        // This prevents platform health checks from failing during DB cold starts.
        connectDBWithRetry().catch((error) => {
            console.error('Unexpected DB retry loop error:', error);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
