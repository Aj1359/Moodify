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
const llmGuard = require('./llmGuard');

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
8. Joy or warmth about a specific person (a crush, partner or someone they love) or about a date is primarily "Romantic"; "Happy" may follow as a secondary mood.
9. Losing interest in everything, emptiness or "nothing feels right" is "Sad" with low energy, not "Relaxed". "Relaxed" is a pleasant calm the user wants.
10. Output MUST be strictly valid JSON matching the schema, with NO markdown formatting, NO backticks, and NO conversational text.

Examples:
${formatFewShot()}
`;

/**
 * Gemini 2.5 Flash models accept thinkingBudget 0; Pro models and older ones do not.
 * @param {string} model
 */
function supportsThinkingOff(model) {
  return /gemini-2\.5-flash/i.test(model);
}

/**
 * Remove a ```json ... ``` wrapper if the model added one despite JSON mode.
 * @param {string} raw
 */
function stripCodeFence(raw) {
  return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

/**
 * Validates and cleans the parsed LLM result according to the contract shape.
 * Returns null if validation fails.
 */
function validateAndCleanLlmOutput(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  const { emotion, context, targetMoods } = parsed;
  // Accept "Low" / "happy" style casing: the meaning is right, only the case is off
  const energy = typeof parsed.energy === 'string' ? parsed.energy.trim().toLowerCase() : parsed.energy;
  const intensity = typeof parsed.intensity === 'string' ? parsed.intensity.trim().toLowerCase() : parsed.intensity;

  if (typeof emotion !== 'string' || !emotion.trim()) return null;
  if (!LEVELS.includes(energy)) return null;
  if (!LEVELS.includes(intensity)) return null;
  if (typeof context !== 'string' || !context.trim()) return null;

  if (!Array.isArray(targetMoods) || targetMoods.length < 1 || targetMoods.length > LIMITS.TARGET_MOODS_MAX) {
    return null;
  }

  // Map each mood to its contract spelling and drop any the app does not support
  // (e.g. ["Happy", "Excited"] keeps "Happy"). Only an answer with no supported mood is rejected.
  const canonicalMoods = [];
  for (const m of targetMoods) {
    const match = typeof m === 'string' && MOODS.find((mood) => mood.toLowerCase() === m.trim().toLowerCase());
    if (match) canonicalMoods.push(match);
  }
  if (canonicalMoods.length === 0) return null;

  // Deduplicate moods while preserving order
  const uniqueMoods = [...new Set(canonicalMoods)];

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
 * @param {{ userId?: string }} [options] - userId enables the per-user rate limit
 * @returns {Promise<import('../../mobile/src/types').MoodAnalysisResult>}
 */
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

// What happened on the most recent Gemini attempts, for GET /health. Holds no
// text from users and no secrets: only a short reason and a timestamp.
const status = { lastSuccessAt: null, lastFallback: null };

function noteFallback(reason) {
  status.lastFallback = { reason, at: new Date().toISOString() };
}

/**
 * Whether the LLM is set up, and how the latest calls went. Lets a deployment be
 * checked from outside: a missing key is otherwise silent.
 */
function llmStatus() {
  return {
    configured: Boolean(process.env.LLM_API_KEY),
    model: process.env.LLM_MODEL || DEFAULT_MODEL,
    lastSuccessAt: status.lastSuccessAt,
    lastFallback: status.lastFallback,
  };
}

async function analyzeMood(text, { userId } = {}) {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return keywordFallback(text);
  }

  const cached = llmGuard.getCached(text);
  if (cached) return cached;

  const slot = llmGuard.reserve(userId);
  if (!slot.allowed) {
    console.warn(`Gemini ${slot.reason} reached, using the keyword fallback`);
    noteFallback(`${slot.reason} reached`);
    return keywordFallback(text);
  }

  const result = await callWithDeadline(text, model, apiKey);
  if (result.source === 'llm') {
    llmGuard.remember(text, result);
    status.lastSuccessAt = new Date().toISOString();
  }
  return result;
}

/**
 * One Gemini call under a hard deadline; the keyword fallback on any failure.
 * @param {string} text
 * @param {string} model
 * @param {string} apiKey
 */
async function callWithDeadline(text, model, apiKey) {
  const controller = new AbortController();
  let timeoutId;
  // A hard deadline for the whole call, including reading the body. Clearing the
  // timer when headers arrive would let a slow body stream run far past 3 s.
  const deadline = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      resolve(TIMED_OUT);
    }, LIMITS.LLM_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([requestGemini(text, model, apiKey, controller.signal), deadline]);
    if (result === TIMED_OUT) {
      console.warn(`Gemini call timed out after ${LIMITS.LLM_TIMEOUT_MS}ms, falling back to keywords`);
      noteFallback(`timed out after ${LIMITS.LLM_TIMEOUT_MS}ms`);
      return keywordFallback(text);
    }
    return result || keywordFallback(text);
  } catch (err) {
    console.warn('Error calling Gemini API:', err.message);
    noteFallback(`network error: ${err.message}`);
    return keywordFallback(text);
  } finally {
    clearTimeout(timeoutId);
  }
}

const TIMED_OUT = Symbol('timed out');

/**
 * One Gemini request. Resolves to a validated MoodAnalysisResult, or null when the
 * reply is unusable (HTTP error, empty, invalid JSON, off-contract). Rejects on network errors.
 * @param {string} text
 * @param {string} model
 * @param {string} apiKey
 * @param {AbortSignal} signal
 */
async function requestGemini(text, model, apiKey, signal) {
  // The key goes in a header, not the URL, so it never appears in logs or error messages
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

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
      // Gemini 2.5 Flash "thinks" by default, which pushes replies past the 3 s budget.
      // A short classification does not need it, so turn it off where the model allows.
      ...(supportsThinkingOff(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    console.warn(`Gemini API error: ${response.status} ${response.statusText}`);
    noteFallback(`Gemini API error ${response.status}`);
    return null;
  }

  const data = await response.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidateText) {
    console.warn('Gemini returned an empty candidate text');
    noteFallback('empty reply');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(stripCodeFence(candidateText));
  } catch (parseErr) {
    console.warn('Failed to parse Gemini output as JSON:', parseErr.message);
    noteFallback('reply was not JSON');
    return null;
  }

  const validated = validateAndCleanLlmOutput(parsed);
  if (!validated) {
    console.warn('Gemini JSON output failed contract validation, falling back to keywords:', JSON.stringify(parsed));
    noteFallback('reply had no supported mood');
    return null;
  }

  return validated;
}

module.exports = {
  analyzeMood,
  llmStatus,
  validateAndCleanLlmOutput,
  stripCodeFence,
  supportsThinkingOff,
  SYSTEM_PROMPT,
};

