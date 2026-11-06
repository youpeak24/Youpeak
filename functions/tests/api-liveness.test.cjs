const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/loadModule.cjs');

function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('domain liveness never calls the backend or claims dependency readiness', () => {
  const api = load('api/index.js', { '../backend/index': () => { throw new Error('Backend must not be called'); } });
  for (const url of ['/api/ping', '/ping?check=domain']) {
    const res = response();
    api({ method: 'GET', url }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(JSON.stringify(res.body)), { status: true, service: 'youpeak-api', dependenciesChecked: false });
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
});

test('normal API traffic still reaches the backend', () => {
  let seen;
  const api = load('api/index.js', { '../backend/index': (req, res) => { seen = req.url; res.status(202).json({ handled: true }); } });
  const res = response();
  api({ method: 'POST', url: '/client/user/login' }, res);
  assert.equal(seen, '/client/user/login');
  assert.equal(res.statusCode, 202);
});
