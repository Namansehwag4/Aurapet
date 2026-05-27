const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) so frontend pages can fetch API endpoints
app.use(cors());

// Parse incoming request bodies in JSON format
app.use(express.json());

// Base Server route for health check diagnostics
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'AuraPet backend server is online and healthy.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start listening for inbound requests on configured port
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`AuraPet Server running on port: ${PORT}`);
  console.log(`Health Check available: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});
