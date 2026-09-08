const path = require('path');
const fs = require('fs');
const dbService = require('../functions/backend/util/firestoreDb.service');

async function importVideoData() {
  console.log("Starting online Cloud Firestore upload for VIDEO data ONLY...");
  const dbDir = __dirname;
  
  const file = "videos.json";
  const collectionName = "videos";
  
  console.log(`\nAnalyzing ${file} for collection: ${collectionName}...`);
  
  const filePath = path.join(dbDir, file);
  const fileContent = fs.readFileSync(filePath, "utf8");
  
  let jsonData;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (err) {
    console.error(`Skipping ${file}: Invalid JSON`);
    process.exit(1);
  }
  
  const items = Array.isArray(jsonData) ? jsonData : [jsonData];
  console.log(`Found ${items.length} video/short items to execute/import to online Cloud Firestore.`);
  
  for (const item of items) {
    // Pre-process specific fields based on analysis
    if (typeof item.videoTime === 'string') {
        const parts = item.videoTime.split(':');
        if (parts.length === 2) {
        item.videoTime = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
        }
    }
    if (item.views !== undefined) {
        item.totalViews = item.views;
    }
    
    const docId = String(item._id?.$oid || item._id || item.id || Date.now());
    delete item._id; // Firestore handles ID via docRef
    
    try {
        await dbService.create(collectionName, item, docId);
        console.log(`✅ Successfully executed online Cloud Firestore import for video: ${docId}`);
    } catch (error) {
        console.error(`❌ Failed to import ${docId} into ${collectionName}:`, error.message);
    }
  }
  
  console.log("\nVideo Data Analysis and Online Cloud Firestore Execution Complete!");
  process.exit(0);
}

importVideoData().catch(console.error);
