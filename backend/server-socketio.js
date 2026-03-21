const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST (before any other imports that use them)
dotenv.config();

const { connectDB } = require('./config/db');

// Initialize models and relationships
require('./models');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });

  // Listen for stock updates
  socket.on('stock:update', (data) => {
    console.log('📦 Stock update received:', data);
  });
});

// Routes
app.use('/api/designers', require('./routes/designerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/metal-rates', require('./routes/metalRatesRoutes'));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test route
app.get('/api', (req, res) => {
    res.json({ 
        message: 'Jewellery Shop API is running',
        database: 'MySQL',
        version: '2.0.0',
        socketIO: 'enabled'
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

// Connect to MySQL and start server
const startServer = async () => {
    try {
        await connectDB();
        
        server.listen(PORT, HOST, () => {
            console.log(`✅ Server is running on ${HOST}:${PORT}`);
            console.log(`🔌 Socket.IO enabled on ${HOST}:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database: MySQL`);
            console.log(`Health check: http://${HOST}:${PORT}/health`);
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

// Export io for use in controllers
module.exports = { io };

startServer();
