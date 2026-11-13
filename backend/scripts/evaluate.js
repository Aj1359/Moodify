#!/usr/bin/env node
/**
 * Evaluate mood detection on the trilingual benchmark (tests/hinglish_eval.json).
 *
 *   npm run eval                    # keyword fallback (offline, instant)
 *   npm run eval:llm                # full pipeline: analyzeMood() with Gemini
 *
 * Options
 *   --engine keyword|llm   which engine to run (default keyword)
 *   --delay <ms>           pause between LLM calls, for free-tier rate limits (default 4000)
 *   --errors               also print every misclassified item
 *   --out <file.json>      save metrics + per-item results
 *   --markdown <file.md>   save the report as Markdown
 */
const fs = require('fs');
const path = require('path');
const { loadBenchmark, runEngine, computeMetrics, misclassified, formatReport } = require('../tests/lib/evaluation');

function parseArgs(argv) {
  const args = { engine: 'keyword', delay: 4000, errors: false, out: null, markdown: null };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--engine') args.engine = argv[++i];
    else if (flag === '--delay') args.delay = Number(argv[++i]);
    else if (flag === '--errors') args.errors = true;
    else if (flag === '--out') args.out = argv[++i];
    else if (flag === '--markdown') args.markdown = argv[++i];
    else if (flag === '--help' || flag === '-h') {
      console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]);
      process.exit(0);
    } else {
      console.error(`Unknown option ${flag}`);
      process.exit(1);
    }
  }
  return args;
}

function loadEngine(name) {
  if (name === 'keyword') {
    const { keywordFallback } = require('../src/services/keywordFallback');
    return { label: 'keyword fallback (rule-based)', predict: keywordFallback, delayMs: 0 };
  }
  if (name === 'llm') {
    try {
      require('dotenv').config();
    } catch {
      // dotenv not installed: rely on the shell environment
    }
    const servicePath = path.join(__dirname, '..', 'src', 'services', 'emotionService.js');
    if (!fs.existsSync(servicePath)) {
      console.error('services/emotionService.js does not exist yet; the LLM engine cannot run.');
      process.exit(1);
    }
    if (!process.env.LLM_API_KEY) {
      console.error('LLM_API_KEY is not set (backend/.env).');
      process.exit(1);
    }
    const { analyzeMood } = require(servicePath);
    return { label: `LLM pipeline (${process.env.LLM_MODEL || 'default model'}) with keyword fallback`, predict: analyzeMood };
  }
  console.error(`Unknown engine "${name}". Use keyword or llm.`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const engine = loadEngine(args.engine);
  const benchmark = loadBenchmark();
  const delayMs = args.engine === 'llm' ? args.delay : 0;

  const results = await runEngine(benchmark.items, engine.predict, {
    delayMs,
    onProgress: (done, total) => {
      if (args.engine === 'llm') process.stderr.write(`\r${done}/${total}`);
    },
  });
  if (args.engine === 'llm') process.stderr.write('\n');

  const metrics = computeMetrics(results);
  const report = formatReport(metrics, { title: `Evaluation: ${args.engine}`, engine: engine.label });
  console.log(report);

  const errors = misclassified(results);
  if (args.errors) {
    console.log(`### Misclassified (${errors.length})\n`);
    console.log('| ID | Text | Gold | Predicted (targetMoods) |\n| --- | --- | --- | --- |');
    for (const e of errors) {
      console.log(`| ${e.id} | ${e.text.replace(/\|/g, '/')} | ${e.gold} | ${e.targetMoods.join(', ') || 'none'} |`);
    }
  }
  if (args.engine === 'llm' && metrics.sources.keyword) {
    console.warn(`\nNote: ${metrics.sources.keyword} of ${metrics.n} answers came from the keyword fallback (LLM timeout or error).`);
  }

  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify({ engine: engine.label, ranAt: new Date().toISOString(), metrics, errors, results }, null, 2));
  }
  if (args.markdown) {
    fs.mkdirSync(path.dirname(args.markdown), { recursive: true });
    fs.writeFileSync(args.markdown, report);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
