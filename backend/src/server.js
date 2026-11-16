require('dotenv').config();

const app = require('./app');
const { llmStatus } = require('./services/emotionService');

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Moodify backend running on port ${PORT}`);
    const llm = llmStatus();
    console.log(
      llm.configured
        ? `Mood analysis: ${llm.model}, keyword fallback on failure`
        : 'Mood analysis: LLM_API_KEY is not set, so every request uses the keyword fallback'
    );
  });
}

module.exports = app;
