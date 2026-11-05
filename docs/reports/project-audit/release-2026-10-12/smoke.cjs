const fs = require('node:fs');
const base = process.argv[2] || 'https://api.youpeak.app';
const key = process.env.secretKey;
if (!key) throw new Error('Production client key unavailable');
(async () => {
  const checks = [];
  async function check(name, path, expected, predicate = () => true, sendKey = true) {
    const r = await fetch(base + path, {headers: sendKey ? {key} : {}, signal: AbortSignal.timeout(45000)});
    let body; try {body = await r.json();} catch {body = {};}
    const result = {name, httpStatus:r.status, code:body.code || null, pass:r.status === expected && predicate(body)};
    checks.push(result);
    console.log(JSON.stringify(result));
  }
  await check('API liveness', '/api/ping', 200, b => b.status === true, false);
  await check('Settings accepted client key', '/client/setting', 200, b => b.status === true);
  await check('Promotion catalogue', '/client/videoPromotion/plans', 200, b => b.status === true);
  await check('Channel validation', '/client/user/detailsOfChannel', 200, b => b.code === 'CHANNEL_ID_REQUIRED');
  await check('Profile requires session', '/client/user/profile', 401, b => b.code === 'AUTH_REQUIRED');
  await check('Bad client key is refused', '/client/setting', 401, () => true, false);
  fs.writeFileSync('reports/project-audit/release-2026-10-12/live-smoke.json', JSON.stringify({base, checkedAt:new Date().toISOString(),checks},null,2));
  if (checks.some(c => !c.pass)) process.exitCode = 1;
})().catch(e => {console.error(e.name);process.exitCode=1;});
