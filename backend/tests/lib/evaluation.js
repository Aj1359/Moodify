/**
 * Evaluation toolkit for mood detection: runs an engine over the trilingual
 * benchmark and computes accuracy, top-3 hit rate, per-mood precision /
 * recall / F1, macro-F1, a confusion matrix and latency percentiles.
 *
 * Used by scripts/evaluate.js (full report) and tests/emotion_detection.test.js
 * (pass/fail thresholds).
 */
const fs = require('fs');
const path = require('path');
const { MOODS } = require('../../src/config/constants');

const BENCHMARK_PATH = path.join(__dirname, '..', 'hinglish_eval.json');
const LANGUAGES = ['en', 'hi', 'hinglish'];
const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi (Devanagari)', hinglish: 'Hinglish (Romanised)' };

function loadBenchmark() {
  return JSON.parse(fs.readFileSync(BENCHMARK_PATH, 'utf8'));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `predict(text)` (sync or async, returns a MoodAnalysisResult) on every item.
 * Errors are recorded per item instead of stopping the run.
 */
async function runEngine(items, predict, { delayMs = 0, onProgress } = {}) {
  const results = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const start = process.hrtime.bigint();
    let output = null;
    let error = null;
    try {
      output = await predict(item.text);
    } catch (err) {
      error = err && err.message ? err.message : String(err);
    }
    const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
    const targetMoods = (output && Array.isArray(output.targetMoods) && output.targetMoods) || [];
    results.push({
      id: item.id,
      lang: item.lang,
      text: item.text,
      gold: item.mood,
      predicted: targetMoods[0] ?? null,
      targetMoods,
      source: output ? output.source ?? null : null,
      correct: targetMoods[0] === item.mood,
      top3: targetMoods.includes(item.mood),
      latencyMs,
      error,
      output,
    });
    if (onProgress) onProgress(i + 1, items.length);
    if (delayMs && i < items.length - 1) await sleep(delayMs);
  }
  return results;
}

/** Nearest-rank percentile. */
function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}

const ratio = (num, den) => (den === 0 ? 0 : num / den);

function computeMetrics(results) {
  const accuracyOf = (rows) => ratio(rows.filter((r) => r.correct).length, rows.length);
  const top3Of = (rows) => ratio(rows.filter((r) => r.top3).length, rows.length);

  const byLanguage = {};
  for (const lang of LANGUAGES) {
    const rows = results.filter((r) => r.lang === lang);
    byLanguage[lang] = { n: rows.length, accuracy: accuracyOf(rows), top3: top3Of(rows) };
  }

  const confusion = Object.fromEntries(MOODS.map((gold) => [gold, Object.fromEntries(MOODS.map((p) => [p, 0]))]));
  for (const r of results) {
    if (MOODS.includes(r.predicted)) confusion[r.gold][r.predicted] += 1;
  }

  const perMood = {};
  for (const mood of MOODS) {
    const tp = confusion[mood][mood];
    const predictedAs = MOODS.reduce((sum, gold) => sum + confusion[gold][mood], 0);
    const actual = results.filter((r) => r.gold === mood).length;
    const precision = ratio(tp, predictedAs);
    const recall = ratio(tp, actual);
    const f1 = ratio(2 * precision * recall, precision + recall);
    perMood[mood] = { support: actual, precision, recall, f1 };
  }
  const macroF1 = MOODS.reduce((sum, mood) => sum + perMood[mood].f1, 0) / MOODS.length;

  const latencies = results.map((r) => r.latencyMs);
  const sources = {};
  for (const r of results) sources[r.source ?? 'none'] = (sources[r.source ?? 'none'] || 0) + 1;

  return {
    n: results.length,
    accuracy: accuracyOf(results),
    top3: top3Of(results),
    macroF1,
    byLanguage,
    perMood,
    confusion,
    latency: {
      mean: ratio(latencies.reduce((a, b) => a + b, 0), latencies.length),
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      max: latencies.length ? Math.max(...latencies) : 0,
    },
    sources,
    errors: results.filter((r) => r.error).length,
  };
}

function misclassified(results) {
  return results
    .filter((r) => !r.correct)
    .map(({ id, lang, text, gold, predicted, targetMoods, source }) => ({ id, lang, text, gold, predicted, targetMoods, source }));
}

// ---------------------------------------------------------------------------
// Markdown report
// ---------------------------------------------------------------------------

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const ms = (x) => (x < 10 ? `${x.toFixed(2)} ms` : `${Math.round(x)} ms`);
const ABBR = { Happy: 'Hap', Sad: 'Sad', Angry: 'Ang', Stressed: 'Str', Relaxed: 'Rel', Motivated: 'Mot', Romantic: 'Rom', Nostalgic: 'Nos' };

function formatReport(metrics, { title = 'Mood detection evaluation', engine = '' } = {}) {
  const lines = [];
  lines.push(`## ${title}`, '');
  if (engine) lines.push(`Engine: ${engine}. Benchmark: ${metrics.n} items.`, '');

  lines.push('| Metric | Value |', '| --- | --- |');
  lines.push(`| Top-1 accuracy | ${pct(metrics.accuracy)} |`);
  lines.push(`| Top-3 hit rate | ${pct(metrics.top3)} |`);
  lines.push(`| Macro-F1 | ${metrics.macroF1.toFixed(3)} |`);
  lines.push(`| Latency p50 / p95 / max | ${ms(metrics.latency.p50)} / ${ms(metrics.latency.p95)} / ${ms(metrics.latency.max)} |`);
  lines.push(`| Answer source | ${Object.entries(metrics.sources).map(([k, v]) => `${k}: ${v}`).join(', ')} |`);
  if (metrics.errors) lines.push(`| Errors | ${metrics.errors} |`);
  lines.push('');

  lines.push('### By language', '', '| Language | Items | Top-1 accuracy | Top-3 hit rate |', '| --- | --- | --- | --- |');
  for (const lang of LANGUAGES) {
    const row = metrics.byLanguage[lang];
    lines.push(`| ${LANGUAGE_NAMES[lang]} | ${row.n} | ${pct(row.accuracy)} | ${pct(row.top3)} |`);
  }
  lines.push('');

  lines.push('### By mood', '', '| Mood | Support | Precision | Recall | F1 |', '| --- | --- | --- | --- | --- |');
  for (const mood of MOODS) {
    const row = metrics.perMood[mood];
    lines.push(`| ${mood} | ${row.support} | ${pct(row.precision)} | ${pct(row.recall)} | ${row.f1.toFixed(3)} |`);
  }
  lines.push('');

  lines.push('### Confusion matrix', '', 'Rows are the gold mood, columns the predicted mood.', '');
  lines.push(`| Gold \\ Pred | ${MOODS.map((m) => ABBR[m]).join(' | ')} |`);
  lines.push(`| --- | ${MOODS.map(() => '---').join(' | ')} |`);
  for (const gold of MOODS) {
    lines.push(`| ${gold} | ${MOODS.map((p) => (metrics.confusion[gold][p] || '·')).join(' | ')} |`);
  }
  lines.push('');
  return lines.join('\n');
}

module.exports = {
  BENCHMARK_PATH,
  LANGUAGES,
  LANGUAGE_NAMES,
  loadBenchmark,
  runEngine,
  computeMetrics,
  misclassified,
  formatReport,
  percentile,
};
