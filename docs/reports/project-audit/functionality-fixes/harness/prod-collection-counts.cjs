// READ-ONLY. For the owner to run before deploying the CF-01 fix:
//   npx vercel env run -e production -- node reports/project-audit/functionality-fixes/harness/prod-collection-counts.cjs
// Prints document COUNTS (never contents) for each engagement collection under
// the model name the API now uses and under the old spellings the feeds used
// to read. If an old spelling has documents, tell the developer before
// deploying: those records would stop being counted.
"use strict";
const admin = require("firebase-admin");
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.error("FIREBASE_SERVICE_ACCOUNT is not set in this environment."); process.exit(2); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore();

const GROUPS = {
  WatchHistory: ["watchhistories", "watchHistories"],
  VideoComment: ["videocomments", "videoComments"],
  UserWiseSubscription: ["userwisesubscriptions", "userWiseSubscriptions"],
  LikeHistoryOfVideo: ["likehistoryofvideos", "likeHistoryOfVideos"],
  LikeHistoryOfVideoComment: ["likehistoryofvideocomments"],
  SaveToWatchLater: ["savetowatchlaters", "saveToWatchLaters"],
  PlayList: ["playlists", "playLists"],
  Notification: ["notifications"],
  LiveUser: ["liveusers"],
  SoundCategory: ["soundcategories"],
  UserWiseDownload: ["userwisedownloads"],
  PlaybackSession: ["playbacksessions"],
  SearchHistory: ["searchhistories"],
};

(async () => {
  const rows = [];
  for (const [model, old] of Object.entries(GROUPS)) {
    const count = async (name) => (await db.collection(name).count().get()).data().count;
    const row = { model, modelCount: await count(model) };
    for (const o of old) row[o] = await count(o);
    rows.push(row);
  }
  console.table(rows);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
