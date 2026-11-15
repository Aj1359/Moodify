const test = require('node:test');
const assert = require('node:assert/strict');
const recommendationController = require('../src/controllers/recommendationController');
const feedbackController = require('../src/controllers/feedbackController');

test('recommendationController.getRecommendations: returns songs in standard { data } envelope', async () => {
  const req = {
    user: { id: 'test-user-123' },
    valid: {
      query: { mood: 'Relaxed', language: 'Both', limit: 5 },
    },
  };

  let responseStatus = null;
  let responseData = null;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(payload) {
      responseData = payload;
      return this;
    },
  };

  await recommendationController.getRecommendations(req, res, (err) => {
    if (err) throw err;
  });

  assert.equal(responseStatus, 200);
  assert.ok(responseData.data);
  assert.ok(Array.isArray(responseData.data.songs));
  assert.ok(responseData.data.source === 'db' || responseData.data.source === 'fallback');
  assert.ok(responseData.data.songs.length <= 5);
});

test('feedbackController: functions are defined and exported correctly', () => {
  assert.equal(typeof feedbackController.postFeedback, 'function');
  assert.equal(typeof feedbackController.getLikedSongs, 'function');
});
