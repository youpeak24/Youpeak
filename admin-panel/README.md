# YouPeak Admin Panel

React web panel for YouPeak operators. Deployed as the Vercel project `admin` (Root Directory `admin-panel`) at `https://admin.youpeak.app`.

## Scripts

```bash
npm ci       # install dependencies
npm start    # development server
npm test     # unit tests
npm run build  # production build into build/
```

## API calls

The panel calls the API on its own origin (`/admin/...`, `/client/...`, and so on). `vercel.json` forwards those paths to `https://api.youpeak.app`, which is served by the `functions/` project. Add any new API prefix to `vercel.json` as well.
