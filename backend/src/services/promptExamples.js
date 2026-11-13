/**
 * Few-shot examples and mood definitions for the LLM mood-analysis prompt
 * (services/emotionService.js).
 *
 * Design
 * - Covers all 8 moods and all three input styles: English, Hindi in
 *   Devanagari and Romanised Hinglish, including code-mixed text.
 * - Includes hard cases the model must get right: negation ("not really
 *   sad"), a music request with no feeling word, mixed feelings ranked by
 *   strength, exhaustion mapped to Relaxed, and longing.
 * - Outputs follow the API contract exactly (camelCase, Title Case moods,
 *   1-3 targetMoods, strongest first). `source` is added by the service, not
 *   the model, so it is not part of the examples.
 * - None of these sentences appear in tests/hinglish_eval.json; a test
 *   enforces that, so the benchmark stays a fair measure.
 */

/** One line per mood: what it covers, for the system prompt. */
const MOOD_DEFINITIONS = {
  Happy: 'joy, excitement, celebration, good news, wanting upbeat or party music',
  Sad: 'sadness, heartbreak, loneliness, grief, disappointment, feeling low',
  Angry: 'anger, frustration, irritation, feeling wronged, wanting to vent',
  Stressed: 'anxiety, pressure, worry, overwhelm, nervousness before an event',
  Relaxed: 'calm, unwinding, tiredness or exhaustion, wanting soft or slow music',
  Motivated: 'determination, workouts, focus, hustle, wanting high-energy push',
  Romantic: 'love, crushes, dates, partners, affection',
  Nostalgic: 'memories, childhood, old days, missing places or times past',
};

const FEW_SHOT_EXAMPLES = [
  {
    lang: 'hinglish',
    input: 'aaj bahut thak gaya hu, kuch relax wala sunna hai',
    output: { emotion: 'exhaustion', energy: 'low', intensity: 'high', context: 'general', targetMoods: ['Relaxed', 'Stressed'] },
  },
  {
    lang: 'en',
    input: 'work has been insane this week and I just want to switch off',
    output: { emotion: 'exhaustion', energy: 'low', intensity: 'high', context: 'work', targetMoods: ['Relaxed', 'Stressed'] },
  },
  {
    lang: 'hi',
    input: 'आज दोस्तों ने सरप्राइज़ पार्टी दी, बहुत खुश हूँ',
    output: { emotion: 'joy', energy: 'high', intensity: 'high', context: 'celebration', targetMoods: ['Happy'] },
  },
  {
    lang: 'hinglish',
    input: 'uski bahut yaad aa rahi hai, sab khaali khaali sa lag raha hai',
    output: { emotion: 'longing', energy: 'low', intensity: 'high', context: 'relationship', targetMoods: ['Sad', 'Romantic', 'Nostalgic'] },
  },
  {
    lang: 'en',
    input: 'my code broke right before the demo and nobody is helping',
    output: { emotion: 'frustration', energy: 'high', intensity: 'high', context: 'work', targetMoods: ['Angry', 'Stressed'] },
  },
  {
    lang: 'hi',
    input: 'सेमेस्टर की परीक्षा सिर पर है, नींद भी नहीं आ रही',
    output: { emotion: 'anxiety', energy: 'medium', intensity: 'high', context: 'studies', targetMoods: ['Stressed'] },
  },
  {
    lang: 'hinglish',
    input: 'chalo aaj se roz gym, koi bahana nahi chalega',
    output: { emotion: 'determination', energy: 'high', intensity: 'medium', context: 'fitness', targetMoods: ['Motivated'] },
  },
  {
    lang: 'en',
    input: 'rain outside and I keep thinking about summers at my grandparents house',
    output: { emotion: 'nostalgia', energy: 'low', intensity: 'medium', context: 'family', targetMoods: ['Nostalgic', 'Relaxed'] },
  },
  {
    lang: 'hinglish',
    input: 'aaj uske saath coffee date hai, butterflies ho rahi hain',
    output: { emotion: 'love', energy: 'medium', intensity: 'high', context: 'relationship', targetMoods: ['Romantic', 'Happy'] },
  },
  {
    lang: 'en',
    input: 'not really sad, just bored, play something upbeat',
    output: { emotion: 'boredom', energy: 'high', intensity: 'low', context: 'general', targetMoods: ['Happy'] },
  },
  {
    lang: 'hi',
    input: 'उसने मेरी बात सुने बिना फ़ैसला कर लिया, बहुत बुरा लगा और गुस्सा भी आया',
    output: { emotion: 'hurt', energy: 'medium', intensity: 'high', context: 'general', targetMoods: ['Sad', 'Angry'] },
  },
  {
    lang: 'en',
    input: 'just play something',
    output: { emotion: 'neutral', energy: 'medium', intensity: 'low', context: 'general', targetMoods: ['Relaxed'] },
  },
];

/** Render the examples as prompt text: one Input line and one JSON Output line each. */
function formatFewShot(examples = FEW_SHOT_EXAMPLES) {
  return examples
    .map((example) => `Input: ${JSON.stringify(example.input)}\nOutput: ${JSON.stringify(example.output)}`)
    .join('\n\n');
}

/** Render the mood definitions as a bulleted list for the system prompt. */
function formatMoodDefinitions() {
  return Object.entries(MOOD_DEFINITIONS)
    .map(([mood, meaning]) => `- ${mood}: ${meaning}`)
    .join('\n');
}

module.exports = { FEW_SHOT_EXAMPLES, MOOD_DEFINITIONS, formatFewShot, formatMoodDefinitions };
