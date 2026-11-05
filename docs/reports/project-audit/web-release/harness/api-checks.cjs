// Smoke checks for an API deployment. Run under `vercel env run -e <env> --`
// so the client key comes from the project's environment; nothing secret is
// printed (only statuses, codes and booleans).
// argv: baseUrl (https://api.youpeak.app or a preview URL)  [--via-vercel-curl]
const { execFileSync } = require('child_process');
const base = process.argv[2].replace(/\/$/, '');
const viaCli = process.argv.includes('--via-vercel-curl');
const key = process.env.secretKey || '';
if (!key) { console.log('no client key in environment'); process.exit(2); }

function call(method, path, { withKey = true, body, headers = {} } = {}) {
  if (!viaCli) {
    return fetch(base + path, { method, headers: { ...(withKey ? { key } : {}), 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined })
      .then(async (r) => ({ status: r.status, text: await r.text() }));
  }
  const args = ['vercel', 'curl', path, '--deployment', base, '--', '-s', '-w', '\n%{http_code}', '-X', method, '-H', 'content-type: application/json'];
  if (withKey) args.push('-H', `key: ${key}`);
  for (const [k, v] of Object.entries(headers)) args.push('-H', `${k}: ${v}`);
  if (body) args.push('--data', JSON.stringify(body));
  const out = execFileSync('npx', args, { encoding: 'utf8', shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'ignore'] });
  const lines = out.trimEnd().split('\n');
  return Promise.resolve({ status: Number(lines.pop()), text: lines.join('\n') });
}
const json = (t) => { try { return JSON.parse(t); } catch (_) { return {}; } };
const SECRET_FIELD = /private_key|privateKey|secretKey|client_secret|r2SecretAccessKey|r2AccessKeyId|cloudflareApiToken|razorpayKeySecret|JWT|password/i;

(async () => {
  const out = {};
  const ping = await call('GET', '/api/ping', { withKey: false });
  out.ping = { status: ping.status, ok: json(ping.text).status === true };
  const setting = await call('GET', '/client/setting');
  const s = json(setting.text);
  const flat = JSON.stringify(s);
  out.settings = { status: setting.status, ok: s.status === true, secretFieldNamesPresent: (flat.match(new RegExp(SECRET_FIELD.source, 'gi')) || []).filter((v, i, a) => a.indexOf(v) === i), allowWebTasking: s.setting ? s.setting.allowWebTasking : undefined };
  const free = await call('GET', '/client/video/verifyChannelname?fullName=zz%20release%20probe%20name%2097');
  const missing = await call('GET', '/client/video/verifyChannelname');
  out.channelNameCheck = { freeName: json(free.text).status, missingNameCode: json(missing.text).code || null, newCode: json(missing.text).code === 'CHANNEL_NAME_REQUIRED' };
  const abandon = await call('POST', '/client/file/abandon-upload', { body: {} });
  out.abandonUploadWithoutSession = abandon.status;
  const direct = await call('POST', '/client/file/direct-upload-url', { body: { contentType: 'video/mp4', fileSize: 1 } });
  out.directUploadWithoutSession = direct.status;
  const cron = await call('GET', '/api/cron/daily', { withKey: false });
  out.cronWithoutSecret = cron.status;
  const attest = await call('POST', '/client/security/attest', { body: { platform: 'web' } });
  out.attestWithoutSession = attest.status;
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.log('ERROR', e.message.slice(0, 200)); process.exit(1); });
