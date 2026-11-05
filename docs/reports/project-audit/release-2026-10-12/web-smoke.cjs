const fs = require('node:fs');
const crypto = require('node:crypto');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
  const results = [];
  for (const url of ['https://youpeak.app/', 'https://www.youpeak.app/', 'https://youpeak-web.vercel.app/', 'https://admin.youpeak.app/']) {
    const r = await fetch(url, {signal:AbortSignal.timeout(45000)});
    const t = await r.text();
    const ok = r.status === 200 && (url.includes('admin.') ? /<html/i.test(t) : t.includes('flutter_bootstrap.js'));
    results.push({url,status:r.status,ok});
  }
  const r = await fetch('https://youpeak.app/main.dart.js', {signal:AbortSignal.timeout(45000)});
  const bytes = Buffer.from(await r.arrayBuffer());
  const local = fs.readFileSync('youpeak/build/web/main.dart.js');
  results.push({url:'https://youpeak.app/main.dart.js',status:r.status,sha256:hash(bytes),ok:r.status===200 && hash(bytes)===hash(local)});
  console.log(JSON.stringify(results,null,2));
  fs.writeFileSync('reports/project-audit/release-2026-10-12/web-smoke.json',JSON.stringify(results,null,2));
  if(results.some(x=>!x.ok)) process.exitCode=1;
})().catch(e=>{console.error(e.name);process.exitCode=1;});
