const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/loadModule.cjs');
const { stripCredentials } = require('../backend/util/safeUser');
const { MAX_VIDEO_BYTES } = require('../backend/util/mediaPolicy');

const channel = load('backend/util/channel.service.js', { './connection': {}, './safeUser': { stripCredentials }, crypto: require('node:crypto') });

test('channel input: names are trimmed, collapsed and bounded; description and type are required/validated', () => {
  const ok = channel.validateChannelInput({ fullName: '  Cool   Channel  ', descriptionOfChannel: ' about ', channelType: '2' });
  assert.deepEqual({ ...ok }, { ok: true, fullName: 'Cool Channel', descriptionOfChannel: 'about', channelType: 2 });
  assert.equal(channel.validateChannelInput({ fullName: 'ab', descriptionOfChannel: 'x' }).ok, true, 'two characters are enough');
  const codes = (body) => channel.validateChannelInput(body).code;
  assert.equal(codes({ fullName: '', descriptionOfChannel: 'x' }), 'CHANNEL_NAME_REQUIRED');
  assert.equal(codes({ fullName: 'a', descriptionOfChannel: 'x' }), 'CHANNEL_NAME_TOO_SHORT');
  assert.equal(codes({ fullName: 'a'.repeat(31), descriptionOfChannel: 'x' }), 'CHANNEL_NAME_TOO_LONG');
  assert.equal(codes({ fullName: 'bad\u0000name', descriptionOfChannel: 'x' }), 'CHANNEL_NAME_INVALID');
  assert.equal(codes({ fullName: 'Fine Name', descriptionOfChannel: '   ' }), 'CHANNEL_DESCRIPTION_REQUIRED');
  assert.equal(codes({ fullName: 'Fine Name', descriptionOfChannel: 'x'.repeat(501) }), 'CHANNEL_DESCRIPTION_TOO_LONG');
  assert.equal(codes({ fullName: 'Fine Name', descriptionOfChannel: 'x', channelType: 3 }), 'CHANNEL_TYPE_INVALID');
  assert.equal(channel.validateChannelInput({ fullName: 'Fine Name', descriptionOfChannel: 'x' }).channelType, 1, 'public by default');
});

test('channel names collide case- and whitespace-insensitively (one reservation per name)', () => {
  assert.equal(channel.nameKey('Cool Channel'), channel.nameKey('  cool   CHANNEL '));
  assert.notEqual(channel.nameKey('Cool Channel'), channel.nameKey('Cool Channels'));
  assert.match(channel.nameKey('x'), /^[0-9a-f]{40}$/);
});

function files({ abandoned = [] } = {}) {
  const grants = [];
  const controller = load('backend/controllers/client/file.controller.js', {
    fs: { promises: { unlink: async () => {} } },
    '../../util/cloudflareStorage.service': {
      isConfigured: () => true, r2PublicDomain: 'https://media.example.test',
      getPresignedPutUrl: async (key) => ({ uploadURL: `https://acct.r2.cloudflarestorage.com/${key}?X-Amz-Signature=secret`, publicUrl: `https://media.example.test/${key}` }),
    },
    '../../util/videoPipeline.service': { isConfigured: () => false },
    '../../util/imageStorage.service': { isConfigured: () => true },
    '../../util/firebaseSync.service': { syncMetadata: async () => true },
    '../../util/uploadGrants': { recordGrant: async (g) => { grants.push(g); return 'grant'; } },
    './video.controller': { _internal: { discardOwnUpload: async (req, url) => abandoned.push([req.appUserId, url]) } },
  });
  return { controller, grants, abandoned };
}
const res = () => ({ statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } });

test('direct upload URL: declared size must be positive and within the limit; older apps without a size still work', async () => {
  const { controller, grants } = files();
  const ask = async (body) => { const r = res(); await controller.getDirectUploadUrl({ body: { folderStructure: 'normalvideo', contentType: 'video/mp4', ...body }, query: {}, appUserId: 'u1' }, r); return r; };
  const ok = await ask({ fileSize: 5e6 });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.maxBytes, MAX_VIDEO_BYTES); assert.equal(ok.body.expiresInSeconds, 900);
  assert.equal(grants.length, 1); assert.equal(grants[0].ownerId, 'u1');
  assert.equal((await ask({})).statusCode, 200);
  for (const bad of [0, -1, 'abc']) { const r = await ask({ fileSize: bad }); assert.equal(r.statusCode, 400); assert.equal(r.body.code, 'INVALID_FILE_SIZE'); }
  const big = await ask({ fileSize: MAX_VIDEO_BYTES + 1 });
  assert.equal(big.statusCode, 413); assert.equal(big.body.code, 'FILE_TOO_LARGE');
  assert.equal((await ask({ contentType: 'text/html' })).body.code, 'INVALID_VIDEO_TYPE');
  assert.equal(grants.length, 2, 'refused requests record no upload grant');
});

test('abandon-upload only hands string URLs of sane length to the ownership-checked discard', async () => {
  const { controller, abandoned } = files();
  const r = res();
  await controller.abandonUpload({ body: { videoUrl: 'https://media.example.test/a.mp4', imageUrl: { $ne: 1 } }, appUserId: 'u1' }, r);
  assert.equal(r.body.status, true);
  assert.deepEqual(abandoned, [['u1', 'https://media.example.test/a.mp4']]);
  const long = res();
  await controller.abandonUpload({ body: { videoUrl: 'x'.repeat(5000) }, appUserId: 'u1' }, long);
  assert.equal(abandoned.length, 1);
});

test('the R2 endpoint override is honoured for loopback only', () => {
  // A fresh module instance per case, so process.env can differ.
  const endpoint = (override) => load('backend/util/cloudflareStorage.service.js', {
    axios: {}, '@aws-sdk/client-s3': {}, '@aws-sdk/s3-request-presigner': {}, fs: {}, './mediaPolicy': { r2PublicUrl: () => '' },
  }, { process: { env: { CLOUDFLARE_R2_ENDPOINT: override } } })._endpoint('acct123');
  assert.equal(endpoint('https://127.0.0.1:5099'), 'https://127.0.0.1:5099');
  assert.equal(endpoint('http://localhost:9000'), 'http://localhost:9000');
  assert.equal(endpoint('https://attacker.example'), 'https://acct123.r2.cloudflarestorage.com');
  assert.equal(endpoint('https://127.0.0.1.evil.example'), 'https://acct123.r2.cloudflarestorage.com');
  assert.equal(endpoint(''), 'https://acct123.r2.cloudflarestorage.com');
});
