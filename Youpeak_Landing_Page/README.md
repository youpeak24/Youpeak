# YouPeak Landing Page

Public marketing and policy site for YouPeak, served at `https://www.youpeak.org`. Built with Vite and React, prerendered for search engines, and deployed as its own Vercel project.

## Scripts

```bash
npm ci               # install dependencies
npm run dev          # local development server
npm run build        # client build, SSR build, and prerender into dist/
npm run verify:seo   # checks dist/ for SEO and crawler output
npm run lint         # oxlint
npm run images       # regenerate optimized and responsive images
```

Run `npm run build` before `npm run verify:seo`.

## Structure

- `index.html` - the homepage shell and structured data.
- `src/App.jsx` - page composition and auth/checkout modal wiring.
- `src/components/` - page sections.
- `src/config/` - site constants and the FAQ data (shared by the UI and FAQPage markup).
- `src/lib/` - portal session, plans, and checkout helpers.
- `src/chatbot/` - assistant knowledge base and client code.
- `scripts/` - prerender, SEO verification, and image tooling.
- `public/` - `robots.txt`, `sitemap.xml`, `llms.txt`, and the web manifest.
- `api/chat.js` - serverless chat endpoint.

## Deployment

Vercel project with Root Directory set to `Youpeak_Landing_Page`. Framework preset Vite, build `npm run build`, output `dist`.

Environment variables (set in Vercel, see `.env.example`):
- `VITE_API_BASE_URL`, `VITE_API_KEY`, `VITE_FIREBASE_API_KEY`, `VITE_ADMIN_PANEL_URL` are public values compiled into the browser bundle.
- Server-side chat keys are set only in Vercel and never use the `VITE_` prefix.

Never put secrets in `VITE_` variables.
