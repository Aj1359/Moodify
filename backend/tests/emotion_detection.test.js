/**
 * Emotion detection accuracy on the trilingual benchmark.
 *
 * - Always runs the keyword fallback (offline) as a regression guard.
 * - Runs the full LLM pipeline only when RUN_LLM_EVAL=1 and
 *   services/emotionService.js exists, and then enforces the PRD target of
 *   at least 80% accuracy. Use `npm run eval:llm` for the full report.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { MOODS, LEVELS } = require('../src/config/constants');
const { keywordFallback } = require('../src/services/keywordFallback');
const { loadBenchmark, runEngine, computeMetrics, LANGUAGES } = require('./lib/evaluation');

/** PRD success metric for the full pipeline. */
const LLM_TARGET_ACCURACY = 0.8;
/**
 * Regression floor for the rule-based fallback alone. The baseline measured
 * on 2026-11-12 is 71.5% (see docs/evaluation.md); a drop below this floor
 * means a lexicon or matching change broke something.
 */
const KEYWORD_ACCURACY_FLOOR = 0.65;

const benchmark = loadBenchmark();

function assertContractShape(output, id) {
  assert.ok(output, `${id}: no output`);
  assert.ok(LEVELS.includes(output.energy), `${id}: energy`);
  assert.ok(LEVELS.includes(output.intensity), `${id}: intensity`);
  assert.equal(typeof output.emotion, 'string', `${id}: emotion`);
  assert.equal(typeof output.context, 'string', `${id}: context`);
  assert.ok(output.targetMoods.length >= 1 && output.targetMoods.length <= 3, `${id}: targetMoods length`);
  for (const mood of output.targetMoods) assert.ok(MOODS.includes(mood), `${id}: mood ${mood}`);
  assert.ok(['llm', 'keyword'].includes(output.source), `${id}: source`);
}

test('benchmark is well formed and balanced', () => {
  const { items } = benchmark;
  assert.equal(new Set(items.map((i) => i.id)).size, items.length, 'duplicate ids');
  assert.equal(new Set(items.map((i) => i.text)).size, items.length, 'duplicate texts');
  for (const lang of LANGUAGES) {
    for (const mood of MOODS) {
      const count = items.filter((i) => i.lang === lang && i.mood === mood).length;
      assert.equal(count, 6, `${lang}/${mood} has ${count} items`);
    }
  }
});

test('prompt few-shot examples never overlap the benchmark', () => {
  const examplesPath = path.join(__dirname, '..', 'src', 'services', 'promptExamples.js');
  if (!fs.existsSync(examplesPath)) return;
  const { FEW_SHOT_EXAMPLES } = require(examplesPath);
  const benchmarkTexts = new Set(benchmark.items.map((i) => i.text.toLowerCase()));
  for (const example of FEW_SHOT_EXAMPLES) {
    assert.ok(!benchmarkTexts.has(example.input.toLowerCase()), `example leaks into benchmark: ${example.input}`);
  }
});

test(`keyword fallback: valid output for every item and accuracy >= ${KEYWORD_ACCURACY_FLOOR * 100}%`, async () => {
  const results = await runEngine(benchmark.items, keywordFallback);
  for (const r of results) assertContractShape(r.output, r.id);

  const metrics = computeMetrics(results);
  assert.ok(metrics.latency.p95 < 50, `p95 latency ${metrics.latency.p95.toFixed(2)} ms`);
  assert.ok(
    metrics.accuracy >= KEYWORD_ACCURACY_FLOOR,
    `accuracy ${(metrics.accuracy * 100).toFixed(1)}% is below the ${KEYWORD_ACCURACY_FLOOR * 100}% floor`
  );
});

const emotionServicePath = path.join(__dirname, '..', 'src', 'services', 'emotionService.js');
const llmSkipReason = !fs.existsSync(emotionServicePath)
  ? 'services/emotionService.js not implemented yet'
  : process.env.RUN_LLM_EVAL !== '1'
    ? 'set RUN_LLM_EVAL=1 to call the LLM'
    : false;

test(
  `LLM pipeline: accuracy >= ${LLM_TARGET_ACCURACY * 100}% (PRD target)`,
  { skip: llmSkipReason, timeout: 30 * 60 * 1000 },
  async () => {
    try {
      require('dotenv').config();
    } catch {
      // rely on the shell environment
    }
    const { analyzeMood } = require(emotionServicePath);
    const delayMs = Number(process.env.EVAL_DELAY_MS || 4000);
    const results = await runEngine(benchmark.items, analyzeMood, { delayMs });
    for (const r of results) assertContractShape(r.output, r.id);

    const metrics = computeMetrics(results);
    assert.ok(
      metrics.accuracy >= LLM_TARGET_ACCURACY,
      `accuracy ${(metrics.accuracy * 100).toFixed(1)}% is below the ${LLM_TARGET_ACCURACY * 100}% target`
    );
  }
);
