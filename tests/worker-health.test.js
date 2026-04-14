const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldServeStatusPage, buildStatusPayload } = require('../cloudflare-worker/worker-helpers.cjs');

test('GET requests should show a worker status page instead of returning 404', () => {
  assert.equal(shouldServeStatusPage('GET'), true);
  assert.equal(shouldServeStatusPage('POST'), false);
});

test('status payload explains that the worker is alive and waiting for POST API calls', () => {
  const payload = buildStatusPayload('/VerifyOtp');

  assert.equal(payload.ok, true);
  assert.equal(payload.path, '/VerifyOtp');
  assert.match(payload.message, /Worker is running/i);
  assert.match(payload.usage, /POST/i);
});
