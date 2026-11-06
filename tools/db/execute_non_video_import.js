const path = require('path');
const fs = require('fs');
const dbService = require('../../functions/backend/util/firestoreDb.service');

async function importNonVideoData() {
  console.log("Starting online Cloud Firestore upload for ALL NON-VIDEO data...");
  const dbDir = __dirname;
  
  const files = fs.readdirSync(dbDir);
  for (const file of files) {
    // Skip videos.json and translation files
    if (file.endsWith(".json") && 
        file !== "videos.json" && 
        file !== "translations.json" && 
        file !== "languagefortranslations.json" && 
        file !== "package.json") {
            
      const collectionName = file.replace(".json", "").toLowerCase().trim();
      const normalizedName = dbService.normalizeCollectionName(collectionName);
      
      console.log(`\nAnalyzing ${file} for collection: ${normalizedName}...`);
      
      const filePath = path.join(dbDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      
      let jsonData;
      try {
        jsonData = JSON.parse(fileContent);
      } catch (err) {
        console.error(`Skipping ${file}: Invalid JSON`);
        continue;
      }
      
      const items = Array.isArray(jsonData) ? jsonData : [jsonData];
      console.log(`Found ${items.length} items to execute/import to online Firebase.`);
      
      for (const item of items) {
        const docId = String(item._id?.$oid || item._id || item.id || Date.now());
        delete item._id; // Firestore handles ID via docRef
        
        try {
           await dbService.create(normalizedName, item, docId);
           console.log(`✅ Successfully executed import for ${normalizedName}: ${docId}`);
        } catch (error) {
           console.error(`❌ Failed to import ${docId} into ${normalizedName}:`, error.message);
        }
      }
    }
  }
  
  console.log("\nAll Other Data Analysis and Firebase Execution Complete!");
  process.exit(0);
}

importNonVideoData().catch(console.error);
