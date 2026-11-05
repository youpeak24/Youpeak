// A fake R2 for the local upload tests: HTTPS on 127.0.0.1:5099 with a
// throwaway self-signed certificate. Understands what the app uses: CORS
// preflight, presigned-style PUT (path-style /bucket/key), HEAD, GET, DELETE.
// Control endpoint (no auth, loopback only):
//   POST /__mode  {"cors":true|false,"failNext":"403"|"500"|"drop"|null,"failCount":n,"stall":true|false}
//                 (stall: take the upload but never answer, so a cancel can be tested)
//   GET  /__objects  -> [{key,size,type}]
//   POST /__reset
// argv: certDir
"use strict";
const https = require('https');
const fs = require('fs');
const path = require('path');

const certDir = process.argv[2];
const objects = new Map(); // key -> {size, type}
const mode = { cors: true, failNext: null, failCount: 0, puts: 0, delays: 0 };
const BUCKET = 'youpeak-videos';

const server = https.createServer({ key: fs.readFileSync(path.join(certDir, 'key.pem')), cert: fs.readFileSync(path.join(certDir, 'cert.pem')) }, (req, res) => {
  const url = new URL(req.url, 'https://127.0.0.1:5099');
  const origin = req.headers.origin;
  const cors = () => {
    if (!mode.cors || !origin) return;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Expose-Headers', 'ETag');
  };
  if (url.pathname.startsWith('/__')) {
    res.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/__mode' && req.method === 'POST') {
      let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { Object.assign(mode, JSON.parse(b || '{}')); res.end(JSON.stringify(mode)); });
      return;
    }
    if (url.pathname === '/__objects') return res.end(JSON.stringify([...objects].map(([key, v]) => ({ key, ...v }))));
    if (url.pathname === '/__reset') { objects.clear(); Object.assign(mode, { cors: true, failNext: null, failCount: 0, puts: 0, stall: false }); return res.end('{}'); }
    res.statusCode = 404; return res.end('{}');
  }
  const key = decodeURIComponent(url.pathname.replace(/^\/+/, '')).replace(new RegExp(`^${BUCKET}/`), '');
  if (req.method === 'OPTIONS') {
    if (!mode.cors) { res.statusCode = 403; return res.end(); }
    cors(); res.statusCode = 204; return res.end();
  }
  if (req.method === 'PUT') {
    mode.puts++;
    if (mode.failNext && mode.failCount > 0) {
      mode.failCount--;
      const f = mode.failNext;
      if (mode.failCount === 0) mode.failNext = null;
      if (f === 'drop') { req.socket.destroy(); return; }
      req.resume();
      res.statusCode = Number(f);
      cors();
      res.setHeader('Content-Type', 'application/xml');
      return res.end(f === '403' ? '<Error><Code>AccessDenied</Code></Error>' : '<Error><Code>InternalError</Code></Error>');
    }
    if (mode.stall) { req.resume(); return; }
    let size = 0;
    req.on('data', (c) => { size += c.length; });
    req.on('end', () => {
      objects.set(key, { size, type: req.headers['content-type'] || '' });
      cors(); res.setHeader('ETag', '"fake"'); res.statusCode = 200; res.end();
    });
    return;
  }
  const o = objects.get(key);
  if (req.method === 'HEAD') {
    if (!o) { res.statusCode = 404; return res.end(); }
    cors(); res.setHeader('Content-Length', String(o.size)); res.setHeader('Content-Type', o.type); return res.end();
  }
  if (req.method === 'DELETE') { objects.delete(key); res.statusCode = 204; return res.end(); }
  if (req.method === 'GET') {
    if (!o) { res.statusCode = 404; return res.end(); }
    cors(); res.setHeader('Content-Type', o.type); return res.end(Buffer.alloc(Math.min(o.size, 1024)));
  }
  res.statusCode = 405; res.end();
});
server.listen(5099, '127.0.0.1', () => console.log('fake R2 on https://127.0.0.1:5099'));
