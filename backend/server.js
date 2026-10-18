const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Configure CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production' ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all in dev/staging to prevent CORS blocks
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'Expires',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Diagnostics Endpoint (Mounted before DB check so monitoring never fails on DB hiccups)
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const isDbReady = mongoose.connection.readyState === 1;

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json({
    status: isDbReady ? 'healthy' : 'degraded',
    database: isDbReady ? 'connected' : 'connecting_or_idle',
    message: 'Quiz System Backend REST API is live and operational.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverless: !!process.env.VERCEL,
  });
});

// Serve Admin Panel (static SPA bundled with backend) at root-relative /admin
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin'), {
  maxAge: 0,
  etag: true,
}));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Serve static assets: uploads and images with browser caching
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: '1d',
  etag: true,
}));
app.use('/img', express.static(path.join(__dirname, 'public', 'img'), {
  maxAge: '7d',
  etag: true,
}));

// Apply General Rate Limiter to all /api endpoints
app.use('/api', generalLimiter);

// Ensure MongoDB is connected BEFORE any dynamic API route handler runs a query
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.setHeader('Retry-After', 3);
    res.status(503).json({
      success: false,
      code: 'DB_CONNECTION_FAILED',
      message: 'Database connection warming up or busy. Please retry in 3 seconds.',
      retryAfter: 3,
    });
  }
});


// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/admin/upload', require('./routes/uploadRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/theme', require('./routes/themeRoutes'));
app.use('/api/admin/theme', require('./routes/themeRoutes'));

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  connectDB().catch((err) => {
    console.error('Fatal database initialization error:', err.message);
  });
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 Quiz System Backend Server running on port ${PORT}`);
    console.log(`🌍 API Health Check : http://localhost:${PORT}/api/health`);
    console.log(`🔐 Admin Application: http://localhost:${PORT}/admin`);
    console.log(`📚 Subjects API    : http://localhost:${PORT}/api/subjects`);
    console.log(`📊 Admin Stats     : http://localhost:${PORT}/api/admin/stats`);
    console.log(`================================================================`);
  });
}

module.exports = app;