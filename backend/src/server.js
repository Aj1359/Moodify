const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint (unauthenticated)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Moodify API', timestamp: new Date() });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Moodify API. Feel it. Express it. Play it.' });
});

// API Routes
app.use('/api', apiRoutes);

// Central Error Handler Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Moodify backend running on port ${PORT}`);
  });
}

module.exports = app;
