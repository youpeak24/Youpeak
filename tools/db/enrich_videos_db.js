const path = require('path');
const fs = require('fs');
const dbService = require('../../functions/backend/util/firestoreDb.service');
const settings = require('../../functions/backend/setting');

async function enrichVideosDb() {
  console.log("Enriching videos data in Firestore and local JSON...");
  const dbDir = __dirname;
  
  const videosPath = path.join(dbDir, 'videos.json');
  const usersPath = path.join(dbDir, 'users.json');
  
  let videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  
  const userMap = new Map(users.map(u => [u._id, u]));

  for (let video of videos) {
    const videoId = String(video._id?.$oid || video._id || video.id);
    const u = userMap.get(video.userId) || {};

    const enrichedFields = {
      uniqueVideoId: video.uniqueVideoId || `VID-${videoId.toUpperCase()}`,
      fullName: video.fullName || u.fullName || u.name || video.channelName || "YouPeak Creator",
      nickName: video.nickName || u.name || video.channelName || "Creator",
      uniqueId: video.uniqueId || u.referralCode || u._id || video.userId || "-",
      image: video.image || u.image || video.channelImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
      videoUrl: `${settings.r2PublicDomain}/videos/${videoId}.mp4`,
      videoImage: `${settings.r2PublicDomain}/thumbnails/${videoId}.jpg`,
      totalViews: video.totalViews || video.views || 0,
      videoTime: typeof video.videoTime === 'number' ? video.videoTime : 300
    };

    // Update in-memory object
    Object.assign(video, enrichedFields);

    try {
      // Update in live Cloud Firestore
      await dbService.update("videos", videoId, enrichedFields);
      console.log(`✅ Enriched ${videoId} in Cloud Firestore.`);
    } catch (err) {
      console.error(`❌ Failed ${videoId}:`, err.message);
    }
  }

  // Save back to videos.json
  fs.writeFileSync(videosPath, JSON.stringify(videos, null, 2));
  console.log("\nEnrichment complete for local videos.json and live Cloud Firestore!");
  process.exit(0);
}

enrichVideosDb().catch(console.error);
