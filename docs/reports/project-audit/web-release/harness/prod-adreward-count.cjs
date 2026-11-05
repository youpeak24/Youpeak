// Read-only: how many documents each candidate ad-task collection holds in
// production, and which fields the documents use (no values). Run under
// `vercel env run -e production --`.
"use strict";
const path = require('path');
const admin = require(path.resolve(__dirname, '../../../../functions/backend/util/firebaseAdmin'));
(async () => {
  const db = admin.firestore();
  const out = {};
  for (const name of ['AdReward', 'adrewards', 'adReward', 'adRewards', 'adrewardcoins']) {
    const agg = await db.collection(name).count().get();
    const sample = await db.collection(name).limit(1).get();
    out[name] = { documents: agg.data().count, fields: sample.empty ? [] : Object.keys(sample.docs[0].data()).sort() };
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
})().catch((e) => { console.log('ERROR', e.code || e.name); process.exit(1); });
