const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');
const load = require('./helpers/loadModule.cjs');
const policy = require('../backend/util/mediaPolicy');

function response() {
  return { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader(k, v) { this.headers[k] = v; }, redirect(code, url) { this.statusCode = code; this.location = url; return this; } };
}
function controller({ failFirebase = false, failR2 = false, failMetadata = false } = {}) {
  const calls = [];
  const files = load('backend/controllers/client/file.controller.js', {
    fs: { promises: { unlink: async p => calls.push(['cleanup', p]) } },
    '../../util/cloudflareStorage.service': {
      isConfigured: () => true, r2PublicDomain: 'https://media.example.test',
      uploadToCloudflareR2: async () => { calls.push(['r2']); if (failR2) return null; return 'https://media.example.test/videos/test.mp4'; },
      getPresignedPutUrl: async () => { calls.push(['sign']); return { uploadURL: 'https://account.r2.cloudflarestorage.com/signed', publicUrl: 'https://media.example.test/videos/test.mp4' }; },
    },
    '../../util/videoPipeline.service': { isConfigured: () => false },
    '../../util/imageStorage.service': { isConfigured: () => true, uploadImage: async () => { calls.push(['firebase']); if (failFirebase) throw new Error('provider down'); return 'https://firebasestorage.googleapis.com/asset'; } },
    '../../util/firebaseSync.service': { syncMetadata: async (...args) => { calls.push(['metadata', ...args]); return !failMetadata; } },
    '../../util/uploadGrants': { recordGrant: async (g) => { calls.push(['grant', g.provider, g.ref]); return 'grant'; } },
  });
  return { files, calls };
}
const request = (video = false) => ({ body: { folderStructure: 'Videos' }, appUserId: 'u1', file: { path: '/test/staging', filename: video ? 'clip.mp4' : 'image.jpg', originalname: video ? 'clip.mp4' : 'image.jpg', mimetype: video ? 'video/mp4' : 'image/jpeg', size: 100 } });

test('public delivery rejects unsigned S3 endpoints, credentials and non-HTTPS URLs', () => {
  for (const value of ['', 'http://media.test', 'https://bucket.account.r2.cloudflarestorage.com', 'https://u:p@media.test', 'https://media.test/path', 'https://media.test?token=x']) assert.equal(policy.publicR2Origin(value), null);
  assert.equal(policy.r2PublicUrl('https://media.test/', 'videos/a b.mp4'), 'https://media.test/videos/a%20b.mp4');
  assert.throws(() => policy.r2PublicUrl('https://media.test', '../test'), /Invalid/);
});
test('external demo media cannot masquerade as Cloudflare by provider label', () => {
  const config = { r2PublicDomain: 'https://media.test', streamCustomerCode: 'abc' };
  assert.equal(policy.videoLocation('https://media.w3.org/video.mp4', config), null);
  assert.equal(policy.videoLocation('https://media.test.evil.test/video.mp4', config), null);
  assert.equal(policy.videoLocation('https://media.test/videos/one.mp4', config).storageProvider, 'r2');
  assert.equal(policy.videoLocation(`https://customer-abc.cloudflarestream.com/${'a'.repeat(32)}/manifest/video.m3u8`, config).streamStatus, 'inprogress');
});
test('video uploads persist in Cloudflare, metadata in Firebase, and clean staging', async () => {
  const { files, calls } = controller(); const res = response();
  await files.uploadContent(request(true), res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.storageProvider, 'r2');
  // The upload is recorded as owned by the uploader (util/uploadGrants.js) before its metadata.
  assert.deepEqual(calls.map(c => c[0]), ['r2', 'grant', 'metadata', 'cleanup']);
  assert.deepEqual(calls[1].slice(1), ['r2', 'videos/' + calls[2][2]]);
  assert.equal(calls[2][1], 'videos_metadata');
});
test('images persist in Firebase, including metadata, and never go to R2', async () => {
  const { files, calls } = controller(); const res = response(); await files.uploadContent(request(), res);
  assert.equal(res.body.storageProvider, 'firebase');
  assert.deepEqual(calls.map(c => c[0]), ['firebase', 'metadata', 'cleanup']);
});
test('Firebase outage fails honestly instead of returning local or R2 fallback', async () => {
  const { files, calls } = controller({ failFirebase: true }); const res = response(); await files.uploadContent(request(), res);
  assert.equal(res.statusCode, 502); assert.equal(res.body.status, false); assert.equal(res.body.url, undefined);
  assert.deepEqual(calls.map(c => c[0]), ['firebase', 'cleanup']);
});
test('R2 outage cannot return a successful local video URL', async () => {
  const { files, calls } = controller({ failR2: true }); const res = response(); await files.uploadContent(request(true), res);
  assert.equal(res.statusCode, 502); assert.equal(res.body.url, undefined);
  assert.deepEqual(calls.map(c => c[0]), ['r2', 'cleanup']);
});
test('metadata persistence failure is not reported as upload success', async () => {
  const { files, calls } = controller({ failMetadata: true }); const res = response(); await files.uploadContent(request(), res);
  assert.equal(res.body.status, false); assert.equal(calls.at(-1)[0], 'cleanup');
});
test('invalid multipart form still cleans its temporary file', async () => {
  const { files, calls } = controller(); const req = request(); req.body = {}; const res = response();
  await files.uploadContent(req, res); assert.equal(res.statusCode, 400); assert.deepEqual(calls, [['cleanup', '/test/staging']]);
});
test('R2 presigning refuses images and unsupported content types', async () => {
  const { files, calls } = controller(); const res = response();
  await files.getDirectUploadUrl({ body: { contentType: 'image/jpeg' } }, res);
  assert.equal(res.statusCode, 400); assert.equal(calls.length, 0);
});
test('unconfigured Stream returns an error rather than a mock upload', async () => {
  const { files } = controller(); const res = response(); await files.getStreamUploadUrl({ body: {} }, res);
  assert.equal(res.statusCode, 503); assert.equal(res.body.uploadURL, undefined);
});
test('Firebase URL uses a download token without relying on public object ACLs', async () => {
  let options; let aclCalls = 0;
  const asset = { makePublic: async () => { aclCalls++; throw new Error('uniform bucket'); } };
  const service = load('backend/util/imageStorage.service.js', {
    fs: { existsSync: () => true },
    './firebaseAdmin': { apps: [{}], storage: () => ({ bucket: () => ({ upload: async (_file, opts) => { options = opts; }, file: () => asset }) }) },
    'firebase-admin/storage': { getDownloadURL: async file => { assert.equal(file, asset); return 'https://firebasestorage.googleapis.com/token-url'; } },
  });
  assert.match(await service.uploadImage('/file', 'images', 'test.jpg', 'image/jpeg'), /firebasestorage/);
  assert.ok(options.metadata.metadata.firebaseStorageDownloadTokens); assert.equal(aclCalls, 0);
});
test('legacy playback redirects to Cloudflare rather than proxying bytes', async () => {
  const delivery = load('backend/controllers/client/mediaDelivery.controller.js', {
    '../../util/cloudflareStorage.service': { r2PublicDomain: 'https://media.test', getPresignedUrl: () => { throw new Error('not needed'); } },
  });
  const res = response(); await delivery.redirect({ path: '/uploads/bites/one.mp4', params: { filename: 'one.mp4' } }, res);
  assert.equal(res.statusCode, 307); assert.equal(res.location, 'https://media.test/bites/one.mp4');
});
test('legacy private R2 playback uses a fresh short-lived Cloudflare URL', async () => {
  let requested;
  const delivery = load('backend/controllers/client/mediaDelivery.controller.js', { '../../util/cloudflareStorage.service': { r2PublicDomain: '', getPresignedUrl: async (...args) => { requested = args; return 'https://account.r2.cloudflarestorage.com/signed'; } } });
  const res = response(); await delivery.redirect({ path: '/videos/one.mp4', params: { filename: 'one.mp4' } }, res);
  assert.deepEqual(requested, ['videos/one.mp4', 3600]); assert.equal(res.statusCode, 307);
});
test('signed Stream webhook rejects stale/replayed and malformed events', () => {
  const secret = 'local-test-only';
  const service = load('backend/util/videoPipeline.service.js', { './cloudflareStorage.service': { _cfg: () => ({}) } }, { process: { env: { CLOUDFLARE_STREAM_WEBHOOK_SECRET: secret } } });
  const rawBody = JSON.stringify({ uid: 'a'.repeat(32), readyToStream: true, status: { state: 'ready' } });
  function event(time, body = rawBody) { return { rawBody: body, headers: { 'webhook-signature': `time=${time},sig1=${crypto.createHmac('sha256', secret).update(`${time}.${body}`).digest('hex')}` } }; }
  const now = Math.floor(Date.now() / 1000);
  assert.equal(service.verifyWebhook(event(now)).valid, true);
  assert.equal(service.verifyWebhook(event(now - 3600)).valid, false);
  assert.equal(service.verifyWebhook(event(now, JSON.stringify({ uid: '../bad' }))).valid, false);
  assert.equal(service.verifyWebhook({ rawBody, headers: {} }).valid, false);
});
test('client upload authorization runs before multipart or signing handlers', async () => {
  let touched = false;
  const router = load('backend/routes/client/file.route.js', {
    '../../middleware/appUser.middleware': () => (_req, res) => res.status(401).json({ status: false }),
    '../../util/uploadMiddleware': () => { touched = true; },
    '../../controllers/client/file.controller': { uploadContent() { touched = true; }, getDirectUploadUrl() { touched = true; }, getStreamUploadUrl() { touched = true; }, abandonUpload() { touched = true; } },
  });
  const app = express(); app.use('/file', router); const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/file/upload-file`, { method: 'PUT', body: 'invalid bytes' });
    assert.equal(res.status, 401); assert.equal(touched, false);
    const abandon = await fetch(`http://127.0.0.1:${server.address().port}/file/abandon-upload`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });
    assert.equal(abandon.status, 401); assert.equal(touched, false);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
test('oversized multipart upload returns 413 instead of hanging', async () => {
  const app = express(); app.put('/upload', require('../backend/util/uploadMiddleware'), (_req, res) => res.json({ status: true }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try {
    const form = new FormData(); form.append('content', new Blob([new Uint8Array(4 * 1024 * 1024 + 1)]), 'large.jpg');
    const res = await fetch(`http://127.0.0.1:${server.address().port}/upload`, { method: 'PUT', body: form });
    assert.equal(res.status, 413); assert.equal((await res.json()).status, false);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
