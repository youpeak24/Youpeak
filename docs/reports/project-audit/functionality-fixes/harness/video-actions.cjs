// Issue 2: video page actions persist on the server and survive a reload.
// Local isolated stack, signed in as the local test viewer.
"use strict";
const fs = require("fs");
const path = require("path");
const { L, E, session, shot, openVideo, labels } = require("./lib.cjs");

const FS = "http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents";
const H = { Authorization: "Bearer owner" };
const ME = "local_app_user";
const VIDEO = "video_102";

async function doc(col, id) {
  const r = await fetch(`${FS}/${col}/${id}`, { headers: H });
  if (!r.ok) return null;
  const f = (await r.json()).fields || {};
  return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.doubleValue ?? null]));
}
async function count(col, field, value) {
  const r = await fetch(`${FS}:runQuery`, { method: "POST", headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: col }], where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } } } }) });
  return (await r.json()).filter((x) => x.document).length;
}
const find = async (page, re) => (await L.nodes(page)).find((n) => re.test(n.label));

(async () => {
  const res = { steps: {} };
  const app = await session({ width: 1366, height: 900, tag: "actions" });
  const { page } = app;
  try {
    const before = await doc("videos", VIDEO);
    res.before = { like: before && before.like };
    await openVideo(app, VIDEO);

    // Like
    const like = await find(page, /^Like\n/);
    await page.mouse.click(like.x, like.y); await L.sleep(2500);
    const afterLike = await doc("videos", VIDEO);
    res.steps.like = { uiAfter: (await find(page, /^Remove like\n/))?.label, serverLike: afterLike.like, record: await doc("LikeHistoryOfVideo", `${ME}_${VIDEO}`) };

    // Save to Watch Later
    const save = await find(page, /^Save to Watch Later\n/);
    if (save) { await page.mouse.click(save.x, save.y); await L.sleep(2500); }
    res.steps.save = { record: !!(await doc("SaveToWatchLater", `${ME}_${VIDEO}`)) };

    // Subscribe (free channel)
    const sub = (await L.nodes(page)).find((n) => n.label === "Subscribe");
    if (sub) { await page.mouse.click(sub.x, sub.y); await L.sleep(3000); }
    res.steps.subscribe = { subscriptions: await count("UserWiseSubscription", "userId", ME) };

    // Comment (typed into the inline box, sent with Enter)
    await L.typeField(page, /Add a Comments/, "Nice one from the browser test");
    await page.keyboard.press("Enter"); await L.sleep(3500);
    res.steps.comment = { serverComments: await count("VideoComment", "videoId", VIDEO), uiCount: (await find(page, /^Comments · /))?.label };
    await shot(page, "actions/after-actions-1366");

    // Reload: the state comes back from the server.
    await openVideo(app, VIDEO);
    res.afterReload = {
      liked: !!(await find(page, /^Remove like\n/)),
      saved: !!(await find(page, /^Remove from Watch Later\n/)),
      subscribed: (await labels(page)).includes("Subscribed"),
      comments: (await find(page, /^Comments · /))?.label,
    };
    await shot(page, "actions/after-reload-1366");

    // Unlike: count back down, record gone.
    const unlike = await find(page, /^Remove like\n/);
    if (unlike) { await page.mouse.click(unlike.x, unlike.y); await L.sleep(2500); }
    const afterUnlike = await doc("videos", VIDEO);
    res.steps.unlike = { serverLike: afterUnlike.like, record: await doc("LikeHistoryOfVideo", `${ME}_${VIDEO}`) };
    res.consoleErrors = app.prepared.consoleErrors.filter((e) => !/ERR_BLOCKED_BY_CLIENT/.test(e)).slice(0, 10);
  } catch (e) {
    res.error = e.message;
    await shot(page, "actions/error").catch(() => {});
  }
  const out = path.join(__dirname, "..", "evidence");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "video-actions.json"), JSON.stringify(res, null, 2));
  console.log(JSON.stringify(res, null, 2));
  await app.close();
  process.exit(0);
})();
