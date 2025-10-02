const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const menuCodeRoutes = require('./routes/menuCodes');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');


// Initialize express app
const app = express();

// CORS Configuration - รองรับ Render (Backend) + Vercel (Frontend)
app.use(cors({
  origin: function(origin, callback) {
    // อนุญาต requests ที่ไม่มี origin (Postman, mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // ✅ Allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://projectbingsu.vercel.app',              // Vercel production
      'https://projectbingsu-git-main.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // ✅ Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // ✅ Check Vercel preview URLs (projectbingsu-*.vercel.app)
    if (origin.match(/^https:\/\/projectbingsu.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    // ✅ Development mode - allow all
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // ❌ Block other origins
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = require('./config/db');
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu-codes', menuCodeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bingsu API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bingsu API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      menuCodes: '/api/menu-codes',
      reviews: '/api/reviews',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🍧 Bingsu Backend Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});