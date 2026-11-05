// Browser Back / Forward / refresh behaviour of the Flutter web app, against
// the isolated local stack. Each scenario runs in a fresh browser profile with
// an "external" page in front of the app in the tab's history, so "Back at the
// entry point" can really leave to an earlier page.
// argv: buildDir port outDir label [--mobile]
const E = require('./e2e-lib.cjs');
const { L } = E;
const fs = require('fs');

const [dir, portArg, out, label] = process.argv.slice(2);
const mobile = process.argv.includes('--mobile');
const port = Number(portArg);
fs.mkdirSync(out, { recursive: true });
const results = [];
const W = mobile ? 390 : 1366, H = mobile ? 844 : 768;

function screenOf(l) {
  const has = (re) => l.some((x) => re.test(x));
  if (has(/^Exit$/) && has(/^Cancel$/)) return 'exit-dialog';
  if (has(/^Let.s you in$/)) return 'lets-you-in';
  if (has(/^Login to Your Account$/)) return 'login';
  if (has(/Create your account|^Sign up$/i) && has(/Confirm|Create/i) && !has(/Don.t have an account/)) return 'signup';
  if (has(/Phone/i) && has(/Continue|Send/i) && !has(/Let.s you in/)) return 'phone';
  if (has(/Watch interesting videos/)) return 'onboarding';
  if (has(/^(Home|Tasker|Library|Subscriptions)$/)) return 'app-home';
  if (l.length === 0) return 'blank';
  return 'other';
}

let coords = null;
async function scenario(name, fn, { signedIn = false } = {}) {
  const steps = [];
  const app = await E.openApp({ dir, port, width: W, height: H, profile: `${out}/p-${name.split(' ')[0]}` });
  if (mobile) {
    await app.page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36');
    await app.page.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  }
  const ctx = {
    app, page: app.page, steps,
    async snap(action, shot) {
      await L.sleep(1800);
      const url = app.page.url();
      const inApp = url.startsWith(app.origin);
      let screen = 'external-page', labels = [];
      if (inApp) {
        try { await E.ensureSemantics(app.page); } catch (_) {}
        labels = await E.labels(app.page, 16);
        screen = screenOf(labels);
        // A page that is still painting has no semantics yet: look again.
        for (let i = 0; i < 3 && screen === 'blank'; i++) {
          await L.sleep(3000);
          await E.ensureSemantics(app.page);
          labels = await E.labels(app.page, 16);
          screen = screenOf(labels);
        }
      }
      const rec = { action, where: inApp ? 'app' : 'external', screen, hist: inApp ? await E.hist(app.page) : null, labels: labels.slice(0, 8) };
      if (shot && inApp) await app.page.screenshot({ path: `${out}/${shot}.png` });
      steps.push(rec);
      console.log(`  - ${action}: ${rec.where}/${rec.screen}${rec.hist ? ` len=${rec.hist.len}` : ''}`);
      return rec;
    },
    async back(action, shot) {
      await app.page.goBack({ waitUntil: 'domcontentloaded', timeout: 6000 }).catch(() => {});
      if (!app.page.url().startsWith(app.origin)) return ctx.snap(action, shot);
      return ctx.snap(action, shot);
    },
    async forward(action, shot) {
      await app.page.goForward({ waitUntil: 'domcontentloaded', timeout: 6000 }).catch(() => {});
      if (app.page.url().startsWith(app.origin)) { await L.sleep(7000); }
      return ctx.snap(action, shot);
    },
  };
  let ok = true, notes = [];
  const expect = (cond, text) => { if (!cond) { ok = false; notes.push('EXPECTED: ' + text); } };
  try {
    await app.goExternalThenApp({ semantics: !signedIn });
    if (signedIn) await E.signInByCoords(app.page, coords);
    await fn(ctx, expect);
  } catch (e) {
    ok = false; notes.push('ERROR: ' + e.message.slice(0, 200));
  }
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${notes.length ? '\n     ' + notes.join('\n     ') : ''}`);
  results.push({ name, ok, notes, steps, consoleErrors: app.prepared.consoleErrors.slice(0, 5) });
  await app.close();
}

async function toLetsYouIn(c) {
  for (let i = 0; i < 3; i++) { const n = await L.findNode(c.page, 'Next', { timeout: 4000 }); await c.page.mouse.click(n.x, n.y); await L.sleep(900); }
}

(async () => {
  console.log(`# ${label} ${mobile ? '(mobile viewport, touch)' : '(desktop viewport)'}`);

  await scenario('N1 entry: Back from the first screen returns to the earlier page', async (c, expect) => {
    const a = await c.snap('entry', 'n1-entry');
    expect(a.screen === 'onboarding', 'entry shows onboarding');
    const b = await c.back('Back');
    expect(b.where === 'external', 'Back leaves the app for the earlier page');
  });

  await scenario('N2 sign-in screen: Back is not trapped by an exit dialog', async (c, expect) => {
    await toLetsYouIn(c);
    const a = await c.snap('sign-in screen', 'n2-sign-in');
    expect(a.screen === 'lets-you-in', 'sign-in screen reached');
    const b = await c.back('Back', 'n2-after-back');
    expect(b.screen !== 'exit-dialog', 'no exit dialog');
    expect(b.where === 'external', 'Back returns to the earlier page');
  });

  await scenario('N3 sign-in screen -> password page: Back returns to the sign-in screen, then to the earlier page', async (c, expect) => {
    await toLetsYouIn(c);
    await L.tap(c.page, 'Sign in with password', { timeout: 8000, after: 1500 });
    const a = await c.snap('password page', 'n3-login');
    expect(a.screen === 'login', 'password page opened');
    const b = await c.back('Back');
    expect(b.screen === 'lets-you-in', 'Back returns to the sign-in options (not out of the app)');
    const f = await c.forward('Forward');
    expect(f.where === 'app', 'Forward does not break the app');
    const c2 = await c.back('Back again');
    expect(c2.where === 'external' || c2.screen === 'lets-you-in', 'still navigable');
  });

  await scenario('N4 sign-in screen -> sign up -> sign in link: Back always returns to the sign-in options', async (c, expect) => {
    await toLetsYouIn(c);
    await L.tap(c.page, /^Sign up$/, { timeout: 8000, after: 1500 }).catch(async () => L.tap(c.page, /Sign up/, { timeout: 8000, after: 1500 }));
    const a = await c.snap('sign up page', 'n4-signup');
    expect(a.screen === 'signup' || a.screen === 'other', 'sign-up page opened');
    expect(a.screen !== 'lets-you-in', 'left the sign-in options');
    const b = await c.back('Back', 'n4-after-back');
    expect(b.screen === 'lets-you-in', 'Back returns to the sign-in options (no exit dialog)');
  });

  await scenario('N5 sign-in screen -> phone: Back returns to the sign-in options', async (c, expect) => {
    await toLetsYouIn(c);
    await L.tap(c.page, 'Continue with phone', { timeout: 8000, after: 1500 });
    const a = await c.snap('phone page', 'n5-phone');
    expect(a.screen !== 'lets-you-in', 'phone page opened');
    const b = await c.back('Back');
    expect(b.screen === 'lets-you-in', 'Back returns to the sign-in options');
  });

  coords = await E.probeSignInCoords({ dir, port: port + 20, width: W, height: H, mobile, cacheFile: `${out}/coords.json` });
  console.log('  coords', JSON.stringify(coords));

  await scenario('N6 signed in: Back keeps the session; Forward and refresh return to Home, not sign-in', async (c, expect) => {
    const home = await c.snap('signed in', 'n6-home');
    expect(home.screen === 'app-home', 'signed in -> Home');
    const b = await c.back('Back at Home', 'n6-back');
    expect(b.screen !== 'exit-dialog', 'no exit dialog');
    expect(b.where === 'external', 'Back at Home returns to the earlier page');
    const f = await c.forward('Forward into the app', 'n6-forward');
    expect(f.screen === 'app-home', 'session survived: back in the app at Home, not at sign-in');
    await c.page.reload({ waitUntil: 'domcontentloaded' });
    await L.sleep(9000);
    const r = await c.snap('refresh', 'n6-refresh');
    expect(r.screen === 'app-home', 'refresh keeps the valid session');
  }, { signedIn: true });

  await scenario('N7 signed in: Back from an inner page returns to Home without logging out', async (c, expect) => {
    const home = await c.snap('Home', 'n7-home');
    expect(home.screen === 'app-home', 'signed in');
    // Open an inner page: Tasker.
    await L.tap(c.page, 'Tasker', { role: 'button', timeout: 20000, after: 4000 }).catch(() => {});
    const inner = await c.snap('Tasker tab/page', 'n7-inner');
    const b = await c.back('Back', 'n7-back');
    expect(b.screen !== 'lets-you-in' && b.screen !== 'login', 'not sent to sign-in');
    expect(b.screen !== 'exit-dialog', 'no exit dialog');
    await c.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    if (c.page.url().startsWith(c.app.origin)) { await L.sleep(9000); const r = await c.snap('refresh after Back', 'n7-refresh'); expect(r.screen === 'app-home', 'still signed in after Back + refresh'); }
    else { await c.forward('Forward', 'n7-forward'); }
  }, { signedIn: true });

  fs.writeFileSync(`${out}/nav-results.json`, JSON.stringify({ label, mobile, results }, null, 2));
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nRESULT ${results.length - failed}/${results.length} scenarios passed`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
