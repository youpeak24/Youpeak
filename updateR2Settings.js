"use strict";
const firestoreDb = require("./functions/backend/util/firestoreDb.service");

async function updateSettings() {
  try {
    const db = firestoreDb.getDb();
    if (!db) {
      console.log("No DB connection");
      return;
    }
    const r2Data = {
      storage: {
        local: false,
        awsS3: false,
        digitalOcean: false,
        cloudflareR2: true,
      },
      r2AccountId: "da97865a5caa8f2b10c795c92912615e",
      r2AccessKeyId: "cdb9bca482d4459a3d9a99533d71939b",
      r2SecretAccessKey: "9d2946e08c57db8ed33ef5d29044d066c73274b103d26d3ae43e7ba2a12582df",
      r2BucketName: "youpeak-videos",
      r2Endpoint: "https://da97865a5caa8f2b10c795c92912615e.r2.cloudflarestorage.com",
      r2PublicDomain: "https://youpeak-videos.da97865a5caa8f2b10c795c92912615e.r2.cloudflarestorage.com",
      r2CdnUrl: "https://youpeak-videos.da97865a5caa8f2b10c795c92912615e.r2.cloudflarestorage.com",
      updatedAt: new Date().toISOString(),
    };

    const snapshot = await db.collection("settings").get();
    if (!snapshot.empty) {
      snapshot.forEach(async (doc) => {
        await db.collection("settings").doc(doc.id).set(r2Data, { merge: true });
        console.log("Updated settings doc:", doc.id);
      });
    } else {
      await db.collection("settings").doc("default_settings").set(r2Data, { merge: true });
      console.log("Created default_settings document");
    }
    console.log("✅ Cloudflare R2 Credentials updated in Firestore successfully!");
  } catch (err) {
    console.error("Error updating settings:", err);
  }
}

updateSettings();
