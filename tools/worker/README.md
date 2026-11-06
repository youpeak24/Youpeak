# YouPeak fingerprint worker

Runs the FFmpeg / Chromaprint / pHash work that Vercel can't. Deploy anywhere
that gives you a long-running process + FFmpeg (Railway, Render background
worker, a ₹300–800/mo VPS, or a container).

## Install (host)

```bash
apt-get install -y ffmpeg libchromaprint-tools   # provides `ffmpeg` and `fpcalc`
cd worker
npm init -y && npm i sharp
```

## Run

```bash
API_BASE_URL=https://<your-vercel-domain> \
FINGERPRINT_WORKER_SECRET=<same as backend env> \
node fingerprintWorker.js
```

## How it connects

| Step | Call |
|---|---|
| pull work | `GET  /api/internal/fingerprint/queue`  (header `X-Worker-Secret`) |
| return hashes | `POST /api/internal/fingerprint/ingest` `{ videoId, audioHash, frameHashes }` |

The backend stores the fingerprint, runs the match (audio similarity ≥
`copyrightAudioMatchThreshold`, or ≥ `copyrightMinFrameMatches` frame pHashes
within `copyrightFrameHammingThreshold` bits), and flags + demonetises on a hit.

Set `copyrightEngineEnabled: true` in admin settings once the worker is live —
until then `createVideo` skips the queue entirely.
