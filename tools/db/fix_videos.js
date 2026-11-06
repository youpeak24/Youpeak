const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'videos.json');
let videos = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

videos = videos.map(video => {
  // Convert videoTime string (MM:SS) to seconds
  if (typeof video.videoTime === 'string') {
    const parts = video.videoTime.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      video.videoTime = (minutes * 60) + seconds;
    }
  }

  // Rename views to totalViews
  if (video.views !== undefined) {
    video.totalViews = video.views;
    delete video.views;
  }

  // Ensure _id and id are strings
  video.id = video._id;

  return video;
});

fs.writeFileSync(dbPath, JSON.stringify(videos, null, 2), 'utf8');
console.log('Fixed videos.json');
