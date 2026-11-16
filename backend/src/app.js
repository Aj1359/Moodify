/**
 * Express application: middleware, routes and error handling.
 *
 * Kept separate from server.js (which only calls listen) so tests can start
 * the real app on a random port without side effects.
 */
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { LIMITS } = require('./config/constants');
const { llmStatus } = require('./services/emotionService');

const app = express();

app.disable('x-powered-by');

// CORS only matters for the web build; the phone app sends no Origin header.
// CORS_ORIGINS is a comma-separated allow-list (e.g. https://moodify.example.com);
// leave it unset during development to allow every origin.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: LIMITS.JSON_BODY_LIMIT }));

// Health check (unauthenticated), used by the hosting platform and the app's connectivity check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Moodify API',
    timestamp: new Date().toISOString(),
    llm: llmStatus(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Moodify API. Feel it. Express it. Play it.' });
});

app.use('/api', apiRoutes);

// Anything not matched above answers with the JSON error envelope, never Express's HTML page
app.use(notFound);
app.use(errorHandler);

module.exports = app;
