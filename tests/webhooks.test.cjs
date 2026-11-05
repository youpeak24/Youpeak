const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const loadModule = require('./helpers/loadModule.cjs');

// Stub controller dependencies without booting Firebase or the application.
function controller(name, overrides) {
  const file = `functions/backend/controllers/client/${name}.controller.js`;
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const mocks = Object.fromEntries([...source.matchAll(/require\(["']([^"']+)["']\)/g)].map(m => [m[1], {}]));
  return loadModule(file, { ...mocks, ...overrides });
}
function response(events) {
  return { code: 200, headersSent: false, status(code) { this.code = code; return this; }, json(body) { this.body = body; this.headersSent = true; events.push('response'); return this; } };
}

test('Stream acknowledges only after Firebase persistence and preserves Firebase thumbnail', async () => {
  const events = [];
  const api = controller('video', {
    '../../models/video.model': { findOne: async () => ({ id: 'v1', streamStatus: 'inprogress' }) },
    '../../util/videoPipeline.service': { verifyWebhook: () => ({ valid: true, uid: 'a'.repeat(32), ready: true, state: 'ready', hlsUrl: 'https://videodelivery.net/test', duration: 8 }) },
    '../../util/connection': { update: async (_collection, _id, data) => { assert.equal(data.videoImage, undefined); await Promise.resolve(); events.push('persisted'); } },
  });
  const res = response(events);
  await api.streamWebhook({ body: {}, headers: {} }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(events, ['persisted', 'response']);
});

test('Stream persistence failure returns retryable 500', async () => {
  const api = controller('video', {
    '../../models/video.model': { findOne: async () => ({ id: 'v1' }) },
    '../../util/videoPipeline.service': { verifyWebhook: () => ({ valid: true, uid: 'a'.repeat(32), ready: true }) },
    '../../util/connection': { update: async () => { throw new Error('offline'); } },
  });
  const res = response([]);
  await api.streamWebhook({ body: {}, headers: {} }, res);
  assert.equal(res.code, 500);
});

test('Captured payment with a missing order is retryable, not acknowledged as settled', async () => {
  const api = controller('payment', {
    '../../util/payment.service': { parseWebhook: () => ({ valid: true, paid: true, orderId: 'o1' }) },
    '../../util/connection': { findOne: async () => null },
  });
  const res = response([]);
  await api.webhook({ params: { gateway: 'razorpay' }, body: {}, headers: {} }, res);
  assert.equal(res.code, 503);
});

test('Payment response follows the persistent idempotency check', async () => {
  const events = [];
  // Fulfilment is claimed in a Firestore transaction (Phase 2 state machine);
  // an already-COMPLETED order must be acknowledged only after that check.
  const ref = { id: 'p1' };
  const fsMock = {
    collection: () => ({ doc: () => ref }),
    runTransaction: async (fn) => fn({
      get: async () => { await Promise.resolve(); events.push('checked'); return { exists: true, id: 'p1', data: () => ({ fulfilmentStatus: 'COMPLETED' }) }; },
      update: () => { throw new Error('a completed order must not be written'); },
    }),
  };
  const api = controller('payment', {
    '../../util/payment.service': { parseWebhook: () => ({ valid: true, paid: true, orderId: 'o1' }) },
    '../../util/connection': { findOne: async () => ({ id: 'p1' }), getDb: () => fsMock, withTimeout: (p) => p },
  });
  const res = response(events);
  await api.webhook({ params: { gateway: 'razorpay' }, body: {}, headers: {} }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(events, ['checked', 'response']);
});
