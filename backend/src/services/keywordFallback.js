/**
 * Rule-based multilingual mood classifier: the fallback for analyzeMood()
 * when the LLM times out, errors or returns invalid JSON.
 *
 * Pipeline
 *   1. Normalise: Unicode NFC, drop Devanagari nukta, lowercase, strip
 *      apostrophes, turn sentence punctuation into clause boundaries.
 *   2. Match lexicon phrases (longest first), then single words. Elongated
 *      words ("sooo", "happyyy") and prefix terms ("frustrat*") are handled.
 *   3. Negation: English negators before a cue, Hindi/Hinglish negators on
 *      either side, never across a clause boundary. Negated cues are dropped
 *      or flipped to an opposite mood (not happy -> Sad).
 *   4. Emoji cues add to the same scores.
 *   5. Rank moods; derive emotion, energy, intensity and context.
 *
 * Contract (README section 6.4): returns a MoodAnalysisResult with
 * source 'keyword', runs synchronously in well under 50 ms, never throws.
 */
const { MOODS, MOOD_ENERGY, DEFAULT_ANALYSIS, LIMITS } = require('../config/constants');
const lexicon = require('../data/moodLexicon');

const BOUNDARY = '|';
const PHRASE_WEIGHT = 1.5;
const WORD_WEIGHT = 1;
const EMOJI_WEIGHT = 1;
const FLIP_WEIGHT = 0.75;
/** A mood joins targetMoods if it scores at least this share of the top mood. */
const SECONDARY_RATIO = 0.5;
/** Total cue weight at which intensity counts as high even without intensifiers. */
const HIGH_INTENSITY_SCORE = 3;

const EMOTION_BY_MOOD = {
  Happy: 'joy',
  Sad: 'sadness',
  Angry: 'anger',
  Stressed: 'stress',
  Relaxed: 'calm',
  Motivated: 'determination',
  Romantic: 'love',
  Nostalgic: 'nostalgia',
};

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[़̀-ͯ]/g, '') // Devanagari nukta (ज़ -> ज) and Latin accents
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’'`]/g, '') // don't -> dont
    .replace(/[.!?,;:\n\r।॥]+/g, ` ${BOUNDARY} `) // sentence punctuation and danda
    .replace(/[^a-z0-9ऀ-ॿ|\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean);
}

/** "sooo" -> ["sooo", "so", "soo"] so elongated words still match. */
function variants(token) {
  if (!/(.)\1\1/u.test(token)) return [token];
  return [token, token.replace(/(.)\1{2,}/gu, '$1'), token.replace(/(.)\1{2,}/gu, '$1$1')];
}

function wordMatches(token, pattern) {
  if (token === BOUNDARY) return false;
  const forms = variants(token);
  if (pattern.endsWith('*')) {
    const stem = pattern.slice(0, -1);
    return forms.some((form) => form.startsWith(stem));
  }
  return forms.includes(pattern);
}

// ---------------------------------------------------------------------------
// Compiled lexicon (built once at load time)
// ---------------------------------------------------------------------------

/** Normalise a lexicon term word by word, keeping a trailing "*" prefix marker. */
function compileTerm(term) {
  return String(term)
    .split(/\s+/)
    .flatMap((raw) => {
      const isPrefix = raw.endsWith('*');
      const words = normalize(isPrefix ? raw.slice(0, -1) : raw)
        .split(' ')
        .filter((word) => word && word !== BOUNDARY);
      if (isPrefix && words.length) words[words.length - 1] += '*';
      return words;
    });
}

/** The mood a cue group points to most strongly. */
function primaryMood(group) {
  return Object.entries(group.moods).sort((a, b) => b[1] - a[1])[0][0];
}

function byLengthDesc(a, b) {
  return b.words.length - a.words.length;
}

/**
 * Index terms by their first word so matching only tries plausible terms.
 * Prefix terms ("frustrat*") cannot be looked up exactly and are kept apart.
 */
function buildIndex(entries) {
  const exact = new Map();
  const prefix = [];
  for (const entry of entries) {
    const first = entry.words[0];
    if (first.endsWith('*')) {
      prefix.push(entry);
    } else {
      if (!exact.has(first)) exact.set(first, []);
      exact.get(first).push(entry);
    }
  }
  const maxLength = Math.max(1, ...entries.map((entry) => entry.words.length));
  return { exact, prefix, maxLength };
}

const COMPILED_CUES = lexicon.CUE_GROUPS.flatMap((group, groupIndex) => {
  const seen = new Set();
  return Object.values(group.terms)
    .flat()
    .map(compileTerm)
    .filter((words) => {
      const key = words.join(' ');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((words) => ({ words, groupIndex }));
}).sort(byLengthDesc);

const COMPILED_CONTEXTS = lexicon.CONTEXT_CUES.flatMap(({ context, terms }) =>
  terms.map((term) => ({ words: compileTerm(term), context }))
).sort(byLengthDesc);

const CUE_INDEX = buildIndex(COMPILED_CUES);
const CONTEXT_INDEX = buildIndex(COMPILED_CONTEXTS);

const NEG_BEFORE = new Set(lexicon.NEGATORS.before.map(normalize));
const NEG_AROUND = new Set(lexicon.NEGATORS.around.map(normalize));
const CLAUSE_BREAKS = new Set(lexicon.CLAUSE_BREAKS.map(normalize));
const INTENSIFIERS = new Set(lexicon.INTENSIFIERS.map(normalize));
const DIMINISHERS = new Set(lexicon.DIMINISHERS.map(normalize));
const NEGATION_EXCEPTIONS = new Set(lexicon.NEGATION_EXCEPTIONS.map(normalize));

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Match `words` starting at `start`. One intensifier may sit between two
 * phrase words ("mann bilkul nahi lag raha" still matches "mann nahi lag").
 * Returns the end index (exclusive), or -1.
 */
function matchAt(tokens, start, words) {
  let i = start;
  for (let w = 0; w < words.length; w += 1) {
    if (w > 0 && i < tokens.length && INTENSIFIERS.has(tokens[i]) && !wordMatches(tokens[i], words[w])) i += 1;
    if (i >= tokens.length || !wordMatches(tokens[i], words[w])) return -1;
    i += 1;
  }
  return i;
}

function candidatesAt(tokens, start, index) {
  const token = tokens[start];
  if (token === BOUNDARY) return [];
  const exact = new Set(variants(token).flatMap((form) => index.exact.get(form) || []));
  return [...exact, ...index.prefix];
}

/** Non-overlapping matches, longest terms first. */
function findMatches(tokens, index) {
  const used = new Array(tokens.length).fill(false);
  const matches = [];
  for (let length = index.maxLength; length >= 1; length -= 1) {
    for (let start = 0; start < tokens.length; start += 1) {
      if (used[start]) continue;
      for (const entry of candidatesAt(tokens, start, index)) {
        if (entry.words.length !== length) continue;
        const end = matchAt(tokens, start, entry.words);
        if (end < 0 || used.slice(start, end).some(Boolean)) continue;
        for (let i = start; i < end; i += 1) used[i] = true;
        matches.push({ ...entry, start, end });
        break;
      }
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

function isClauseEdge(token) {
  return token === BOUNDARY || CLAUSE_BREAKS.has(token);
}

/**
 * Tokens within `count` steps of [start, end) on one side, stopping at a
 * clause edge. Tokens that belong to another matched phrase are skipped, so
 * the "nahi" inside "mann nahi lag raha" never negates a neighbouring cue.
 */
function windowIndices(tokens, start, end, side, count, inPhrase = []) {
  const out = [];
  const step = side === 'before' ? -1 : 1;
  for (let i = side === 'before' ? start - 1 : end; i >= 0 && i < tokens.length && out.length < count; i += step) {
    if (isClauseEdge(tokens[i])) break;
    if (!inPhrase[i]) out.push(i);
  }
  return out;
}

function windowTokens(tokens, start, end, side, count, inPhrase) {
  return windowIndices(tokens, start, end, side, count, inPhrase).map((i) => tokens[i]);
}

/** A negator, unless it opens an idiom like "can't stop / can't help (smiling)". */
function negatorAt(tokens, i, negators) {
  return negators.has(tokens[i]) && !NEGATION_EXCEPTIONS.has(tokens[i + 1]);
}

function isNegated(tokens, match, inPhrase) {
  const before = windowIndices(tokens, match.start, match.end, 'before', 3, inPhrase);
  const after = windowIndices(tokens, match.start, match.end, 'after', 3, inPhrase);
  return (
    before.some((i) => negatorAt(tokens, i, NEG_BEFORE) || negatorAt(tokens, i, NEG_AROUND)) ||
    after.some((i) => negatorAt(tokens, i, NEG_AROUND))
  );
}

function modifierOf(tokens, match) {
  const before = windowTokens(tokens, match.start, match.end, 'before', 2);
  if (before.some((t) => INTENSIFIERS.has(t))) return 'intense';
  if (before.some((t) => DIMINISHERS.has(t))) return 'mild';
  return null;
}

function findEmojis(rawText) {
  const text = String(rawText).replace(/\uFE0F/g, '');
  const found = [];
  for (const cue of lexicon.EMOJI_CUES) {
    for (const emoji of cue.emojis) {
      const count = text.split(emoji).length - 1;
      if (count > 0) found.push({ cue, emoji, count });
    }
  }
  return found;
}

function detectContext(tokens) {
  const counts = new Map();
  for (const match of findMatches(tokens, CONTEXT_INDEX)) {
    const current = counts.get(match.context) || { count: 0, first: match.start };
    current.count += 1;
    counts.set(match.context, current);
  }
  let best = null;
  for (const [context, { count, first }] of counts) {
    if (!best || count > best.count || (count === best.count && first < best.first)) {
      best = { context, count, first };
    }
  }
  return best ? best.context : DEFAULT_ANALYSIS.context;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function analyse(text) {
  const raw = String(text ?? '');
  const tokens = tokenize(raw);
  const scores = Object.fromEntries(MOODS.map((mood) => [mood, 0]));
  const groupScores = new Map(); // groupIndex -> weight from non-negated cues
  const details = [];
  let intense = false;
  let mild = false;
  let totalWeight = 0;

  const matches = findMatches(tokens, CUE_INDEX);
  const inPhrase = new Array(tokens.length).fill(false);
  for (const m of matches) {
    if (m.words.length > 1) for (let i = m.start; i < m.end; i += 1) inPhrase[i] = true;
  }

  for (const match of matches) {
    const group = lexicon.CUE_GROUPS[match.groupIndex];
    const weight = match.words.length > 1 ? PHRASE_WEIGHT : WORD_WEIGHT;
    const negated = isNegated(tokens, match, inPhrase);
    const modifier = modifierOf(tokens, match);
    const elongated = tokens.slice(match.start, match.end).some((t) => /(.)\1\1/u.test(t));

    if (!negated) {
      for (const [mood, moodWeight] of Object.entries(group.moods)) scores[mood] += weight * moodWeight;
      groupScores.set(match.groupIndex, (groupScores.get(match.groupIndex) || 0) + weight);
      totalWeight += weight;
      if (modifier === 'intense' || elongated) intense = true;
      if (modifier === 'mild') mild = true;
    } else {
      // Only the group's main mood flips: "yaad nahi" (can't remember) is not Sad.
      const mood = primaryMood(group);
      const flipped = lexicon.NEGATION_FLIP[mood];
      if (flipped) scores[flipped] += weight * group.moods[mood] * FLIP_WEIGHT;
    }

    details.push({
      text: tokens.slice(match.start, match.end).join(' '),
      emotion: group.emotion,
      moods: group.moods,
      negated,
      modifier: elongated && !negated ? 'intense' : modifier,
    });
  }

  for (const { cue, emoji, count } of findEmojis(raw)) {
    const groupIndex = lexicon.CUE_GROUPS.findIndex((g) => g.emotion === cue.emotion);
    for (const [mood, moodWeight] of Object.entries(cue.moods)) scores[mood] += EMOJI_WEIGHT * moodWeight;
    if (groupIndex >= 0) groupScores.set(groupIndex, (groupScores.get(groupIndex) || 0) + EMOJI_WEIGHT);
    totalWeight += EMOJI_WEIGHT;
    if (count >= 2) intense = true;
    details.push({ text: emoji, emotion: cue.emotion, moods: cue.moods, negated: false, modifier: null });
  }

  const exclamations = (raw.match(/!/g) || []).length;
  if (exclamations >= 2) intense = true;

  return { tokens, scores, groupScores, details, intense, mild, totalWeight };
}

function rankMoods(scores) {
  const ranked = MOODS.map((mood, order) => ({ mood, score: scores[mood], order }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);
  if (ranked.length === 0) return [];
  const top = ranked[0].score;
  return ranked
    .filter(({ score }) => score >= top * SECONDARY_RATIO)
    .slice(0, LIMITS.TARGET_MOODS_MAX)
    .map(({ mood }) => mood);
}

/** The strongest cue group whose main mood is the detected mood. */
function dominantGroup(groupScores, topMood) {
  let best = null;
  for (const [groupIndex, score] of groupScores) {
    const group = lexicon.CUE_GROUPS[groupIndex];
    if (primaryMood(group) !== topMood) continue;
    if (!best || score > best.score) best = { group, score };
  }
  return best ? best.group : null;
}

function intensityOf({ intense, mild, totalWeight }) {
  if (intense) return 'high';
  if (mild) return 'low';
  if (totalWeight >= HIGH_INTENSITY_SCORE) return 'high';
  return 'medium';
}

function defaultAnalysis() {
  return { ...DEFAULT_ANALYSIS, targetMoods: [...DEFAULT_ANALYSIS.targetMoods] };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @param {string} text  Free-text mood in English, Hindi (Devanagari) or Hinglish.
 * @returns {{emotion: string, energy: string, intensity: string, context: string,
 *            targetMoods: string[], source: 'keyword'}}
 */
function keywordFallback(text) {
  try {
    const result = analyse(text);
    const targetMoods = rankMoods(result.scores);
    if (targetMoods.length === 0) return defaultAnalysis();

    const topMood = targetMoods[0];
    const group = dominantGroup(result.groupScores, topMood);
    return {
      emotion: group ? group.emotion : EMOTION_BY_MOOD[topMood],
      energy: (group && group.energy) || MOOD_ENERGY[topMood],
      intensity: intensityOf(result),
      context: detectContext(result.tokens),
      targetMoods,
      source: 'keyword',
    };
  } catch (err) {
    console.warn('[keywordFallback] unexpected error, returning default analysis:', err.message);
    return defaultAnalysis();
  }
}

/** Debug view for error analysis: what matched, what was negated, the raw scores. */
function explainKeywords(text) {
  const result = analyse(text);
  return {
    normalized: result.tokens.join(' '),
    matches: result.details,
    scores: result.scores,
    context: detectContext(result.tokens),
    analysis: keywordFallback(text),
  };
}

module.exports = { keywordFallback, explainKeywords, normalize, tokenize };
