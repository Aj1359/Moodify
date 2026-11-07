const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Moodify API', timestamp: new Date() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Moodify API. Feel it. Express it. Play it.' });
});

// TODO: Register routes
// app.use('/api/mood', moodRoutes);
// app.use('/api/recommendations', recommendationRoutes);
// app.use('/api/feedback', feedbackRoutes);
// app.use('/api/preferences', userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Moodify backend running on port ${PORT}`);
});
