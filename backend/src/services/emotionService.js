/**
 * LLM Emotion Detection Service (Aditya Jha).
 * Analyzes natural language mood expressions in English, Hindi (Devanagari), and Romanised Hinglish.
 *
 * Uses Gemini in JSON output mode with strict structured validation and a 3-second timeout.
 * Gracefully falls back to keywordFallback on timeout, network error, or invalid output.
 * Never throws to the caller.
 */
const { MOODS, LEVELS, LIMITS } = require('../config/constants');
const { formatMoodDefinitions, formatFewShot } = require('./promptExamples');
const { keywordFallback } = require('./keywordFallback');

const SYSTEM_PROMPT = `You are Moodify's multilingual mood and emotion classifier.
Your job is to analyze how the user feels and classify their emotional state into 1 to 3 target mood categories from the supported list, ranked strongest first.

Supported Mood Categories:
${formatMoodDefinitions()}

Rules:
1. The user input may be in English, Hindi (written in Devanagari script), or Romanised Hinglish (Hindi written using the English/Latin alphabet, e.g. "aaj bahut thak gaya hu"), or code-mixed with slang, typos, and emojis.
2. "targetMoods" MUST be an array containing between 1 and 3 moods from: [${MOODS.map((m) => `"${m}"`).join(', ')}]. The first element (targetMoods[0]) must be the primary detected mood.
3. "energy" MUST be one of: "low", "medium", "high".
4. "intensity" MUST be one of: "low", "medium", "high".
5. "emotion" must be a concise snake_case or single word string (e.g. "exhaustion", "joy", "longing", "anxiety", "frustration").
6. "context" must be a concise snake_case or single word category (e.g. "work", "studies", "relationship", "fitness", "celebration", "general").
7. Exhaustion/tiredness/fatigue maps to primary mood "Relaxed" with low energy.
8. Output MUST be strictly valid JSON matching the schema, with NO markdown formatting, NO backticks, and NO conversational text.

Examples:
${formatFewShot()}
`;

/**
 * Validates and cleans the parsed LLM result according to the contract shape.
 * Returns null if validation fails.
 */
function validateAndCleanLlmOutput(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  const { emotion, energy, intensity, context, targetMoods } = parsed;

  if (typeof emotion !== 'string' || !emotion.trim()) return null;
  if (!LEVELS.includes(energy)) return null;
  if (!LEVELS.includes(intensity)) return null;
  if (typeof context !== 'string' || !context.trim()) return null;

  if (!Array.isArray(targetMoods) || targetMoods.length < 1 || targetMoods.length > LIMITS.TARGET_MOODS_MAX) {
    return null;
  }

  // Verify all moods are valid
  for (const m of targetMoods) {
    if (!MOODS.includes(m)) return null;
  }

  // Deduplicate moods while preserving order
  const uniqueMoods = [...new Set(targetMoods)];

  return {
    emotion: emotion.trim().toLowerCase().replace(/\s+/g, '_'),
    energy,
    intensity,
    context: context.trim().toLowerCase().replace(/\s+/g, '_'),
    targetMoods: uniqueMoods,
    source: 'llm',
  };
}

/**
 * Analyzes mood text using Gemini, falling back to keywordFallback on any failure or timeout.
 * @param {string} text - User mood input
 * @returns {Promise<import('../../mobile/src/types').MoodAnalysisResult>}
 */
async function analyzeMood(text) {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    return keywordFallback(text);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LIMITS.LLM_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Analyze the mood of this text and return structured JSON:\nInput: ${JSON.stringify(text)}` }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API error: ${response.status} ${response.statusText}`);
      return keywordFallback(text);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.warn('Gemini returned an empty candidate text');
      return keywordFallback(text);
    }

    let parsed;
    try {
      parsed = JSON.parse(candidateText.trim());
    } catch (parseErr) {
      console.warn('Failed to parse Gemini output as JSON:', parseErr.message);
      return keywordFallback(text);
    }

    const validated = validateAndCleanLlmOutput(parsed);
    if (!validated) {
      console.warn('Gemini JSON output failed contract validation, falling back to keywords:', JSON.stringify(parsed));
      return keywordFallback(text);
    }

    return validated;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`Gemini call timed out after ${LIMITS.LLM_TIMEOUT_MS}ms, falling back to keywords`);
    } else {
      console.warn('Error calling Gemini API:', err.message);
    }
    return keywordFallback(text);
  }
}

module.exports = {
  analyzeMood,
  SYSTEM_PROMPT,
};

