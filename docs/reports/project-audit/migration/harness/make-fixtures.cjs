// Generates labelled local test-fixture videos + posters with headless Chrome
// (canvas + MediaRecorder). Output: argv[2] directory.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const specs = [
  { name: 'fixture-bite-portrait-a', w: 360, h: 640, bg: ['#0F3B20', '#129B57'], label: 'Bite A' },
  { name: 'fixture-bite-portrait-b', w: 360, h: 640, bg: ['#3B0F2E', '#9B1257'], label: 'Bite B' },
  { name: 'fixture-bite-landscape', w: 640, h: 360, bg: ['#0F233B', '#1257 9B'.replace(' ', '')], label: 'Bite C 16:9' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.goto('about:blank');
  for (const s of specs) {
    const { video, poster } = await page.evaluate(async (s) => {
      const c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
      const g = c.getContext('2d');
      const draw = (t) => {
        const grd = g.createLinearGradient(0, 0, s.w, s.h); grd.addColorStop(0, s.bg[0]); grd.addColorStop(1, s.bg[1]);
        g.fillStyle = grd; g.fillRect(0, 0, s.w, s.h);
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 6; g.strokeRect(3, 3, s.w - 6, s.h - 6);
        // moving marker proves playback is advancing
        const x = (s.w - 40) * ((t % 3000) / 3000);
        g.fillStyle = '#FFD54F'; g.fillRect(x, s.h - 60, 40, 40);
        g.fillStyle = '#fff'; g.textAlign = 'center';
        g.font = 'bold 34px sans-serif'; g.fillText(s.label, s.w / 2, s.h / 2 - 30);
        g.font = '18px sans-serif'; g.fillText('LOCAL TEST FIXTURE', s.w / 2, s.h / 2 + 4);
        g.fillText(`${s.w}×${s.h}  t=${(t / 1000).toFixed(1)}s`, s.w / 2, s.h / 2 + 32);
      };
      draw(0);
      const poster = c.toDataURL('image/jpeg', 0.85);
      const stream = c.captureStream(24);
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 350000 });
      const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
      const start = performance.now();
      rec.start();
      await new Promise((resolve) => {
        const tick = () => { const t = performance.now() - start; draw(t); if (t < 6000) requestAnimationFrame(tick); else resolve(); };
        tick();
      });
      rec.stop(); await new Promise((r) => (rec.onstop = r));
      const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer();
      let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
      return { video: btoa(bin), poster: poster.split(',')[1] };
    }, s);
    fs.writeFileSync(path.join(OUT, s.name + '.webm'), Buffer.from(video, 'base64'));
    fs.writeFileSync(path.join(OUT, s.name + '.jpg'), Buffer.from(poster, 'base64'));
    console.log(s.name, Buffer.from(video, 'base64').length, 'bytes');
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
