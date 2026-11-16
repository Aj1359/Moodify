/**
 * HTTP-level checks of the real Express app: every response, including
 * failures, must use the JSON envelope from docs/api.md.
 */
const test = require('node:test');
const { before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

const call = async (method, path, { body, raw, headers = {} } = {}) => {
  const init = { method, headers: { ...headers } };
  if (raw !== undefined) {
    init.body = raw;
    init.headers['Content-Type'] = 'application/json';
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(base + path, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave json null; the assertion below reports the raw text
  }
  return { status: res.status, headers: res.headers, json, text };
};

test('GET /health is public and returns JSON', async () => {
  const r = await call('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'ok');
  assert.ok(!Number.isNaN(Date.parse(r.json.timestamp)));
  assert.equal(typeof r.json.llm.configured, 'boolean');
  assert.equal(typeof r.json.llm.model, 'string');
});

test('unknown routes answer 404 NOT_FOUND in the error envelope, not HTML', async () => {
  for (const [method, path] of [
    ['GET', '/api/nope'],
    ['POST', '/api/unknown/thing'],
    ['GET', '/definitely/not/here'],
  ]) {
    const r = await call(method, path);
    assert.equal(r.status, 404, `${method} ${path}`);
    assert.ok(r.json, `${method} ${path} should be JSON, got: ${r.text.slice(0, 60)}`);
    assert.equal(r.json.error.code, 'NOT_FOUND');
  }
});

test('every contract endpoint rejects a missing token with 401 UNAUTHORIZED', async () => {
  const endpoints = [
    ['POST', '/api/mood/analyze'],
    ['POST', '/api/mood/confirm'],
    ['GET', '/api/mood/history'],
    ['DELETE', '/api/mood/all'],
    ['GET', '/api/preferences'],
    ['PUT', '/api/preferences'],
    ['GET', '/api/recommendations?mood=Happy'],
    ['POST', '/api/feedback'],
    ['GET', '/api/feedback/liked'],
  ];
  for (const [method, path] of endpoints) {
    const r = await call(method, path, method === 'GET' || method === 'DELETE' ? {} : { body: {} });
    assert.equal(r.status, 401, `${method} ${path}`);
    assert.deepEqual(Object.keys(r.json), ['error']);
    assert.equal(r.json.error.code, 'UNAUTHORIZED');
  }
});

test('malformed JSON is a 400 VALIDATION_ERROR, not a 500', async () => {
  const r = await call('POST', '/api/mood/analyze', { raw: '{"text": "happy' });
  assert.equal(r.status, 400);
  assert.equal(r.json.error.code, 'VALIDATION_ERROR');
});

test('an oversized body is refused with 413 VALIDATION_ERROR', async () => {
  const r = await call('POST', '/api/mood/analyze', { body: { text: 'x'.repeat(20000) } });
  assert.equal(r.status, 413);
  assert.equal(r.json.error.code, 'VALIDATION_ERROR');
});

test('the server does not advertise Express', async () => {
  const r = await call('GET', '/health');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('CORS allows every origin when CORS_ORIGINS is unset', async () => {
  const res = await fetch(`${base}/health`, { headers: { Origin: 'http://localhost:8081' } });
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});
