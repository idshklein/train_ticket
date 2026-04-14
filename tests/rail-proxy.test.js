const test = require('node:test');
const assert = require('node:assert/strict');

const { buildUpstreamHeaders, extractTailFromPath, buildUpstreamUrl } = require('../netlify/functions/rail-proxy.js');

test('extractTailFromPath preserves the endpoint name in redirected Netlify routes', () => {
  assert.equal(extractTailFromPath('/rail-api/VerifyOtp'), 'VerifyOtp');
  assert.equal(extractTailFromPath('/.netlify/functions/rail-proxy/VerifyOtp'), 'VerifyOtp');
  assert.equal(extractTailFromPath('/.netlify/functions/rail-proxy/OrderSeatForTrip'), 'OrderSeatForTrip');
});

test('buildUpstreamUrl appends the extracted tail to the rail API base URL', () => {
  assert.equal(
    buildUpstreamUrl('/.netlify/functions/rail-proxy/VerifyOtp'),
    'https://rail-api.rail.co.il/common/api/v1/TripReservation/VerifyOtp'
  );
});

test('buildUpstreamHeaders sends browser-like headers required by the rail API', () => {
  const headers = buildUpstreamHeaders('foo=bar');

  assert.equal(headers['Cookie'], 'foo=bar');
  assert.match(headers['User-Agent'], /Chrome/);
  assert.equal(headers['Accept'], 'application/json, text/plain, */*');
  assert.equal(headers['Sec-Fetch-Mode'], 'cors');
  assert.equal(headers['Origin'], 'https://www.rail.co.il');
});
