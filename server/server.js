const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming request bodies in JSON format
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);

// Base health check diagnostics endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'AuraPet backend server is online, database connected, and healthy.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`AuraPet Server running on port: ${PORT}`);
  console.log(`Health Check available: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});
