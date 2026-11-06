const path = require('path');
const fs = require('fs');
const dbService = require('../../functions/backend/util/firestoreDb.service');

async function importDatabase() {
  console.log("Starting DB import to Firestore...");
  const dbDir = __dirname;
  
  const files = fs.readdirSync(dbDir);
  for (const file of files) {
    if (file.endsWith(".json") && file !== "translations.json" && file !== "languagefortranslations.json" && file !== "package.json") {
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
      console.log(`Found ${items.length} items to execute/import.`);
      
      for (const item of items) {
        // Pre-process specific fields based on analysis
        if (normalizedName === 'videos') {
           if (typeof item.videoTime === 'string') {
             const parts = item.videoTime.split(':');
             if (parts.length === 2) {
               item.videoTime = (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
             }
           }
           if (item.views !== undefined) {
             item.totalViews = item.views;
           }
        }
        
        const docId = String(item._id?.$oid || item._id || item.id || Date.now());
        delete item._id; // Firestore handles ID via docRef
        
        try {
           await dbService.create(normalizedName, item, docId);
           console.log(`Successfully executed import for ${normalizedName}: ${docId}`);
        } catch (error) {
           console.error(`Failed to import ${docId} into ${normalizedName}:`, error.message);
        }
      }
    }
  }
  
  console.log("\nDB Analysis and Execution Complete!");
  process.exit(0);
}

importDatabase().catch(console.error);
