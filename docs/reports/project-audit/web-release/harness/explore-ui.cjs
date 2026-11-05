// Dumps semantic labels of the signed-in app screens (to script flows).
const E = require('./e2e-lib.cjs'); const { L } = E;
const fs = require('fs');
(async () => {
  const [dir, port, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const coords = await E.probeSignInCoords({ dir, port: Number(port) + 5, width: 1366, height: 768, cacheFile: `${out}/coords.json` });
  const app = await E.openApp({ dir, port: Number(port), width: 1366, height: 768, profile: out + '/p' });
  const { page } = app;
  await app.goExternalThenApp({ semantics: false });
  await E.signInByCoords(page, coords);
  const show = async (tag) => { await L.sleep(1500); console.log(`## ${tag}`, JSON.stringify(await E.labels(page, 60))); await page.screenshot({ path: `${out}/${tag}.png` }); };
  await show('home');
  const nodes = await L.nodes(page);
  console.log('sidebar-ish', JSON.stringify(nodes.filter((n) => n.x < 260).map((n) => [n.label, n.role, Math.round(n.x), Math.round(n.y)])));
  await L.tap(page, /^Profile$/, { timeout: 10000, after: 3000 }).catch((e) => console.log('no Profile', e.message));
  await show('profile');
  await L.tap(page, /^Create Your Channel$/, { timeout: 10000, after: 3000 });
  await show('create-channel');
  console.log('form nodes', JSON.stringify((await L.nodes(page)).filter((n) => n.x > 240).map((n) => [n.label, n.role, n.tag, Math.round(n.x), Math.round(n.y), Math.round(n.w), Math.round(n.h)])));
  await L.tap(page, /^Create$/, { timeout: 10000, after: 1500 }).catch(() => {});
  await show('create-menu');
  console.log('menu nodes', JSON.stringify((await L.nodes(page)).map((n) => [n.label, n.role, Math.round(n.x), Math.round(n.y)])));
  await app.close();
})();
