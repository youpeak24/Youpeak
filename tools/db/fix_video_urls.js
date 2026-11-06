const path = require('path');
const fs = require('fs');
const dbService = require('../../functions/backend/util/firestoreDb.service');
const settings = require('../../functions/backend/setting');

async function fixVideoUrls() {
  console.log("Fixing video URLs and pushing to Firebase...");
  const dbDir = __dirname;
  const filePath = path.join(dbDir, 'videos.json');
  let videos = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const video of videos) {
    const videoId = String(video._id?.$oid || video._id || video.id);
    
    // Assign new R2 URLs
    const newVideoUrl = `${settings.r2PublicDomain}/videos/${videoId}.mp4`;
    const newVideoImage = `${settings.r2PublicDomain}/thumbnails/${videoId}.jpg`;

    // Apply data fixes (from our previous execution script)
    const totalViews = video.views || video.totalViews || 0;
    
    let videoTime = video.videoTime;
    if (typeof videoTime === 'string' && videoTime.includes(':')) {
       const [mm, ss] = videoTime.split(':');
       videoTime = (parseInt(mm) * 60) + parseInt(ss);
    }

    try {
      // Update directly in the Firestore Database
      await dbService.update("videos", videoId, {
         videoUrl: newVideoUrl,
         videoImage: newVideoImage,
         totalViews: totalViews,
         videoTime: videoTime
      });
      
      // Update the local object for saving back to videos.json
      video.videoUrl = newVideoUrl;
      video.videoImage = newVideoImage;
      video.totalViews = totalViews;
      video.videoTime = videoTime;
      delete video.views;

      console.log(`✅ Updated ${videoId} in Firebase with R2 URLs.`);
    } catch(err) {
      console.error(`❌ Failed ${videoId}:`, err.message);
    }
  }
  
  // Save it back to videos.json as well so it's consistent locally
  fs.writeFileSync(filePath, JSON.stringify(videos, null, 2));
  console.log("\nAll video links successfully updated to point to Cloudflare R2 in Firestore!");
  process.exit(0);
}

fixVideoUrls().catch(console.error);
