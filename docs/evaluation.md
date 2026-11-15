# Mood Detection Evaluation

Status: keyword fallback evaluated on 2026-11-12; full LLM pipeline evaluated on 2026-11-16 with `gemini-3.5-flash-lite`. **The 80% target is met.**

## Summary

| Engine | Top-1 accuracy | Top-3 hit rate | Macro-F1 | Latency (p95) | Target |
| --- | --- | --- | --- | --- | --- |
| Keyword fallback (rule-based) | 71.5% | 72.9% | 0.754 | < 3 ms | < 50 ms, never fails |
| **LLM pipeline (Gemini + fallback)** | **97.2%** | **100%** | **0.972** | 1.5 s | **≥ 80%** accuracy, < 3 s |

The LLM fixes 39 of the keyword fallback's 41 errors, including every sentence that has no mood word. All four of its own mistakes still list the gold mood second. When the keyword fallback finds at least one mood cue, it is right **95.1%** of the time (98 of 103 sentences), so it remains a reliable safety net when Gemini is slow or down.

## Benchmark

`backend/tests/hinglish_eval.json`: 144 labelled sentences, written the way people text (typos, emojis, code-mixing, indirect phrasing).

| Language | Items | Per mood |
| --- | --- | --- |
| English | 48 | 6 |
| Hindi (Devanagari) | 48 | 6 |
| Hinglish (Romanised) | 48 | 6 |

- Each sentence has one gold mood. A prediction is correct when `targetMoods[0]` equals it; the top-3 hit rate also counts the gold mood anywhere in `targetMoods`.
- The benchmark was frozen on 2026-11-12. Labels are never changed to raise accuracy.
- The LLM prompt's few-shot examples (`promptExamples.js`) are disjoint from the benchmark; `emotion_detection.test.js` enforces this.

## How to run

```bash
cd backend
npm test                                   # unit tests + keyword accuracy floor (65%)
npm run eval                               # keyword fallback report
npm run eval -- --errors                   # ... plus every misclassified sentence
npm run eval:llm                           # full LLM pipeline report (needs LLM_API_KEY)
RUN_LLM_EVAL=1 npm test                    # enforce the 80% target in the test suite
```

`npm run eval:llm` waits 4 s between calls (about 12 minutes for 144 items) to stay under free-tier rate limits; change it with `--delay <ms>`. Answers that fell back to keywords are counted and reported separately. Pick the model with `LLM_MODEL=<id> npm run eval:llm`; the free tier's daily limit is per model (see [Model choice](#model-choice)).

## Keyword fallback results

| Metric | Value |
| --- | --- |
| Top-1 accuracy | 71.5% |
| Top-3 hit rate | 72.9% |
| Macro-F1 | 0.754 |
| Coverage (sentences with at least one cue) | 71.5% (103 / 144) |
| Accuracy when a cue is found | 95.1% (98 / 103) |

### By language

| Language | Top-1 accuracy | Top-3 hit rate | Accuracy when a cue is found |
| --- | --- | --- | --- |
| English | 64.6% | 64.6% | 100% (29 / 29) |
| Hindi (Devanagari) | 75.0% | 75.0% | 94.6% (35 / 37) |
| Hinglish (Romanised) | 75.0% | 79.2% | 91.9% (34 / 37) |

### By mood

| Mood | Precision | Recall | F1 |
| --- | --- | --- | --- |
| Happy | 80.0% | 66.7% | 0.727 |
| Sad | 100.0% | 77.8% | 0.875 |
| Angry | 100.0% | 72.2% | 0.839 |
| Stressed | 100.0% | 66.7% | 0.800 |
| Relaxed | 31.5% | 94.4% | 0.472 |
| Motivated | 100.0% | 50.0% | 0.667 |
| Romantic | 100.0% | 66.7% | 0.800 |
| Nostalgic | 93.3% | 77.8% | 0.848 |

### Confusion matrix

Rows are the gold mood, columns the predicted mood.

| Gold \ Pred | Hap | Sad | Ang | Str | Rel | Mot | Rom | Nos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Happy | 12 | · | · | · | 6 | · | · | · |
| Sad | · | 14 | · | · | 3 | · | · | 1 |
| Angry | · | · | 13 | · | 5 | · | · | · |
| Stressed | · | · | · | 12 | 6 | · | · | · |
| Relaxed | 1 | · | · | · | 17 | · | · | · |
| Motivated | · | · | · | · | 9 | 9 | · | · |
| Romantic | 2 | · | · | · | 4 | · | 12 | · |
| Nostalgic | · | · | · | · | 4 | · | · | 14 |

The Relaxed column is the default: a sentence with no cue returns `Relaxed` by contract ([docs/api.md](api.md)). That gives Relaxed high recall and low precision, and every other mood near-perfect precision.

## Error analysis

The 41 misclassified sentences fall into four groups.

| Cause | Count | Examples | What fixes it |
| --- | --- | --- | --- |
| No mood word: the feeling is implied by the situation | 36 | "nobody even remembered my birthday" (Sad), "rent is due and my salary hasn't come yet" (Stressed), "leg day today, need something to push through" (Motivated) | World knowledge: the LLM |
| Competing cues | 2 | "kal pehli date hai, thoda nervous thoda excited" (Romantic, predicted Happy) | Context weighting: the LLM |
| A cue that means something else here | 2 | "छत पर बैठकर ठंडी हवा का मज़ा ले रहा हूँ" (Relaxed; "मज़ा" read as Happy), "usse baat karke dil khush ho jata hai" (Romantic; "dil khush" read as Happy) | The LLM |
| Gold label debatable | 1 | "ghar ki bahut yaad aa rahi hai hostel mein" (gold Sad, predicted Nostalgic) | Accept: homesickness is both |

Motivated has the lowest recall (50%) because motivation is usually expressed as a plan ("5am run before class") rather than a feeling word. English has the lowest accuracy (64.6%) for the same reason, yet every English sentence where a cue was found was classified correctly.

### Fixes made during the analysis

The error list exposed four generic bugs. They were fixed without adding any benchmark wording to the lexicon:

| Bug | Example | Fix |
| --- | --- | --- |
| Prefix terms never matched (`frustrat*` lost its `*` during normalisation) | "kitna frustrating hai ye" | Keep the prefix marker when compiling terms |
| Idioms read as negation | "can't stop smiling" read as not happy | `stop`, `help`, `wait` after a negator open an idiom |
| An intensifier inside a phrase broke the match | "mann **bilkul** nahi lag raha" | Allow one intensifier between phrase words |
| Negating a minor mood flipped polarity | "याद नहीं हो रहा" (can't remember) read as Sad | Flip only a cue group's main mood |

Accuracy went from 69.4% to 71.5%. Each fix has a regression test in `keywordFallback.test.js`.

## LLM pipeline results

Run on 2026-11-16: `gemini-3.5-flash-lite`, JSON mode, temperature 0.1, the few-shot prompt from `promptExamples.js`, 3 s timeout with keyword fallback. 143 of 144 answers came from the LLM; one Gemini 503 fell back to keywords, which got it right. The generated report is [llm-eval.md](llm-eval.md).

| Metric | Value |
| --- | --- |
| Top-1 accuracy | **97.2%** (140 / 144) |
| Top-3 hit rate | 100% |
| Macro-F1 | 0.972 |
| Latency p50 / p95 / max | 1.14 s / 1.55 s / 1.81 s (no call reached the 3 s timeout) |

### Against the keyword fallback

| Language | Keyword fallback | LLM pipeline | Change |
| --- | --- | --- | --- |
| English | 64.6% | 97.9% | +33.3 pts |
| Hindi (Devanagari) | 75.0% | **100%** | +25.0 pts |
| Hinglish (Romanised) | 75.0% | 93.8% | +18.8 pts |
| **All** | 71.5% | **97.2%** | **+25.7 pts** |

- **Fixed by the LLM:** 39 of the 41 keyword errors, including all 37 sentences where the fallback found no usable cue (for example "rent is due and my salary hasn't come yet", Stressed). These need world knowledge, which is what the LLM adds.
- **Broken by the LLM:** 2 sentences the keyword fallback had right (en-37, hg-07, below).
- **Wrong in both:** 2 (hg-11, hg-39).
- Motivated recall goes from 50% to 100%: plans like "5am run before class" are understood without a feeling word.
- English gains the most, because English speakers in the benchmark state situations rather than feelings.

### LLM error analysis

| Id | Text | Gold | LLM answer | Why |
| --- | --- | --- | --- | --- |
| en-37 | she said yes!! first date this saturday | Romantic | Happy, Romantic | Joy dominates the surface; the romantic context is second |
| hg-39 | usse baat karke dil khush ho jata hai | Romantic | Happy, Romantic | "dil khush" is literally "heart happy"; the keyword fallback made the same mistake |
| hg-11 | ghar ki bahut yaad aa rahi hai hostel mein | Sad | Nostalgic, Sad | Homesickness is both; the label is debatable (also flagged in the keyword analysis) |
| hg-07 | aaj mann bilkul nahi lag raha kisi cheez mein | Sad | Relaxed, Sad | Read as apathy (low energy) rather than sadness |

Three of the four are Happy-vs-Romantic or Sad-vs-Nostalgic, pairs that overlap in meaning, and the gold mood is second every time. The app shows `targetMoods[0]` and lets the user change it, so these cost the user one tap. Hinglish is the weakest language (93.8%) because three of the four errors are Hinglish idioms.

**Prompt tuning.** At 97.2% no tuning is needed for the target. One rule would address two errors: "a happy feeling about a specific person or date is Romantic". It must be phrased in general terms; benchmark sentences are never copied into the prompt.

### Model choice

| Model | Result | Notes |
| --- | --- | --- |
| `gemini-2.5-flash` | 19 / 19 correct, then rate-limited | The free tier allows **20 requests per day** per model, so the full run could not finish; a live demo would exhaust it within minutes. Thinking is on by default and pushed some replies past 3 s; `emotionService.js` now sends `thinkingBudget: 0` for this model. |
| **`gemini-3.5-flash-lite`** | **140 / 144 correct** | No rate limiting across 144 calls; no thinking overhead; p95 1.5 s. **Now the default.** |
| `gemini-3.8-flash` | Not usable | One test call took 172 s |
| `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash-lite` | Unavailable | The API answers 404 (retired, or closed to new keys) |

### Limitations

- One run at temperature 0.1. Expect a point or two of variation between runs.
- The benchmark was written and labelled by the team, one gold label per sentence. Several sentences carry two moods (homesickness is Sad and Nostalgic), which top-1 accuracy counts as wrong.
- 144 sentences: one sentence is 0.7 points of accuracy, so per-mood figures (18 sentences each) are coarse.
- The free tier's quotas change over time; for the deployed app, check the limits on the AI Studio rate-limit page before a demo.
