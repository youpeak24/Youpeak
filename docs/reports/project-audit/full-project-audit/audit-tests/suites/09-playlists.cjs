// AUDIT: channel playlists as the shipped Flutter app calls them
// (features/channel/api/channel_playlist_api.dart: channelId = the channel uuid, `start` = 1-based page number).
"use strict";

module.exports = async (h, check, assert) => {
  const { call, set, seedUser, idToken } = h;
  await seedUser("pl_owner", { isChannel: true, channelId: "pl-channel-uuid-1", channelType: 1, fullName: "Playlist Owner" });
  for (const i of [1, 2, 3]) {
    await set("videos", `pl_v${i}`, { userId: "pl_owner", channelId: "pl-channel-uuid-1", title: `v${i}`, isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, createdAt: new Date().toISOString() });
  }
  const tok = await idToken("pl_owner");
  const created = [];
  for (const i of [1, 2, 3]) {
    const r = await call("POST", "/client/playlist/newPlayList", { token: tok, body: { channelId: "pl-channel-uuid-1", userId: "pl_owner", videoId: `pl_v${i}`, playListName: `List ${i}`, playListType: 2 } });
    created.push(r.json.status === true ? true : `${r.status} ${r.json.message || r.json.error}`);
    await new Promise((r2) => setTimeout(r2, 15));
  }

  await check("PL-01", "a user can create a playlist from one existing video (client/playlist/newPlayList; 3 active videos exist on the platform)", async () => {
    assert.deepEqual(created, [true, true, true], JSON.stringify(created));
  });

  // Seed the playlists directly so PL-02 / PL-03 test the listing endpoint independently of PL-01.
  for (const i of [1, 2, 3]) {
    await set("playLists", `pl_seed_${i}`, { userId: "pl_owner", channelId: "pl-channel-uuid-1", playListName: `Seed ${i}`, playListType: 2, videoId: [`pl_v${i}`], createdAt: new Date(Date.now() - i * 1000).toISOString() });
  }

  await check("PL-02", "GET playListsOfChannel with the CHANNEL id (what the app sends) returns the channel's public playlists", async () => {
    const r = await call("GET", "/client/user/playListsOfChannel?userId=pl_owner&channelId=pl-channel-uuid-1&start=1&limit=20", { token: tok });
    assert.ok(r.json.status === true && r.json.total === 3, `total=${r.json.total} playList=${(r.json.playList || []).length} (expected 3; handler filters playLists by userId == channelId)`);
  });

  await check("PL-03", "page 1 (start=1, limit=2) returns the first two playlists, not a slice that skips the first item", async () => {
    // Handler is called with the USER id here so that it returns data at all.
    const all = await call("GET", "/client/user/playListsOfChannel?channelId=pl_owner&start=0&limit=20", { token: tok });
    const page1 = await call("GET", "/client/user/playListsOfChannel?channelId=pl_owner&start=1&limit=2", { token: tok });
    const firstOfAll = ((all.json.playList || [])[0] || {})._id;
    const ids1 = (page1.json.playList || []).map((p) => p._id);
    assert.ok(firstOfAll && ids1.includes(firstOfAll) && ids1.length === 2, `all[0]=${firstOfAll}; page1=${ids1.length} items, includes first=${ids1.includes(firstOfAll)} (start is used as an array offset, the app sends a page number)`);
  });
};

// ---- channel identity: update path sets channelId = userId, createVideo's first-upload path sets a uuid
module.exports = ((prev) => async (h, check, assert) => {
  await prev(h, check, assert);
  const { call, set, seedUser, idToken } = h;
  await seedUser("id_uuid_owner", { isChannel: true, channelId: "id-chan-uuid-77", channelType: 1, fullName: "Uuid Channel" });
  await seedUser("id_self_owner", { isChannel: true, channelId: "id_self_owner", channelType: 1, fullName: "Self Channel" });
  for (const [vid, user, chan] of [["id_v1", "id_uuid_owner", "id-chan-uuid-77"], ["id_v2", "id_self_owner", "id_self_owner"]]) {
    await set("videos", vid, { userId: user, channelId: chan, title: vid, isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, createdAt: new Date().toISOString() });
  }
  await seedUser("id_viewer", {});
  const tok = await idToken("id_viewer");
  await check("ID-01", "channel page (detailsOfChannel) opens for a channel whose channelId is a uuid (set by createVideo's first-upload path)", async () => {
    const r = await call("GET", "/client/user/detailsOfChannel?channelId=id-chan-uuid-77&userId=id_viewer&start=1&limit=10", { token: tok });
    assert.ok(r.json.status === true && r.json.totalVideosOfChannel === 1, `status=${r.json.status} message=${r.json.message} totalVideosOfChannel=${r.json.totalVideosOfChannel}`);
  });
  await check("ID-02", "channel page opens for a channel whose channelId equals the owner's user id (set by client/user/update) — control", async () => {
    const r = await call("GET", "/client/user/detailsOfChannel?channelId=id_self_owner&userId=id_viewer&start=1&limit=10", { token: tok });
    assert.ok(r.json.status === true && r.json.totalVideosOfChannel === 1, `status=${r.json.status} totalVideosOfChannel=${r.json.totalVideosOfChannel}`);
  });
  await check("ID-03", "videosOfChannel lists the videos of a uuid channel", async () => {
    const r = await call("GET", "/client/user/videosOfChannel?channelId=id-chan-uuid-77&userId=id_viewer&start=1&limit=10", { token: tok });
    assert.ok(r.json.status === true && r.json.total === 1, `total=${r.json.total}`);
  });
  await check("ID-04", "subscribing to a uuid channel works and is counted on the channel page", async () => {
    const s = await call("POST", "/client/userWiseSubscription/subscribedUnSubscibed?channelId=id-chan-uuid-77", { token: tok });
    assert.ok(s.json.status === true, `subscribe: ${JSON.stringify(s.json).slice(0, 160)}`);
  });
})(module.exports);
