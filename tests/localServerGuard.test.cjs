const test = require('node:test');
const assert = require('node:assert/strict');
const { checkLocalServer, resolveProjectId } = require('../functions/backend/util/localServerGuard');

const noKeyFiles = () => null;
const liveKeyFile = () => 'youpeak-9ff65';
const demoAccount = JSON.stringify({ project_id: 'demo-youpeak-local' });

test('a plain local start with the live key file on disk is refused', () => {
  const r = checkLocalServer({}, liveKeyFile);
  assert.equal(r.ok, false);
  assert.equal(r.projectId, 'youpeak-9ff65');
});

test('with no credentials at all the default project is live, so it is refused', () => {
  assert.equal(checkLocalServer({}, noKeyFiles).ok, false);
});

test('the emulator alone is not enough: the project must be a demo-* project', () => {
  assert.equal(checkLocalServer({ FIRESTORE_EMULATOR_HOST: '127.0.0.1:8095' }, liveKeyFile).ok, false);
  assert.equal(checkLocalServer({ FIRESTORE_EMULATOR_HOST: '127.0.0.1:8095', FIREBASE_SERVICE_ACCOUNT: demoAccount }, liveKeyFile).ok, true);
});

test('a demo project without the emulator is refused (Firestore would go to Google)', () => {
  assert.equal(checkLocalServer({ FIREBASE_SERVICE_ACCOUNT: demoAccount }, liveKeyFile).ok, false);
});

test('explicit production or override starts are allowed', () => {
  assert.equal(checkLocalServer({ NODE_ENV: 'production' }, liveKeyFile).ok, true);
  assert.equal(checkLocalServer({ ALLOW_LIVE_FIREBASE: 'true' }, liveKeyFile).ok, true);
  assert.equal(checkLocalServer({ ALLOW_LIVE_FIREBASE: '1' }, liveKeyFile).ok, false);
});

test('project resolution follows firebaseAdmin order: env account, key files, env ids', () => {
  assert.equal(resolveProjectId({ FIREBASE_SERVICE_ACCOUNT: demoAccount }, liveKeyFile), 'demo-youpeak-local');
  assert.equal(resolveProjectId({ FIREBASE_SERVICE_ACCOUNT: '{bad json' }, liveKeyFile), 'youpeak-9ff65');
  assert.equal(resolveProjectId({ GCLOUD_PROJECT: 'demo-x' }, noKeyFiles), 'demo-x');
});
