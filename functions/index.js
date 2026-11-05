const functions = require("firebase-functions");

const express = require("express");
require("dotenv").config();
require("./backend/util/validateEnv")();
require("./backend/util/firebaseAdmin"); // single canonical Firebase Admin init
const cors = require("cors");

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, key, Key, secretkey, secretKey");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(cors({ origin: true, credentials: true }));
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Firestore seed data on startup
try {
  const firestoreDb = require("./backend/util/firestoreDb.service");
  firestoreDb.seedDefaultData().catch((err) => console.error("Seed error:", err));
} catch (e) {
  console.log("Firestore seed module init note:", e.message);
}

// Global settings initialization
try {
  const settingJson = require("./backend/setting");
  global.settingJSON = settingJson;
} catch (e) {
  global.settingJSON = {};
}

// Base API route ping
app.get("/ping", (req, res) => {
  return res.status(200).json({
    status: true,
    message: "🔥 YouPeak 100% Firebase Backend Cloud Function is Live!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/ping", (req, res) => {
  return res.status(200).json({
    status: true,
    message: "🔥 YouPeak 100% Firebase Backend Cloud Function API is Live!",
    timestamp: new Date().toISOString(),
  });
});

// Import backend client and admin routes
try {
  const routes = require("./backend/routes/index");
  app.use("/", routes);
  app.use("/api", routes);
} catch (err) {
  console.error("Error loading routes in Cloud Functions:", err);
}

// Local standalone server listener for localhost:5000 development
const PORT = process.env.PORT || 5000;
if (require.main === module || (!process.env.FUNCTION_NAME && !process.env.K_SERVICE)) {
  app.listen(PORT, () => {
    console.log(`🚀 YouPeak Local Backend Server running on http://localhost:${PORT}`);
  });
}

// Export Express App as 1st Gen v1 Firebase Cloud Function (public access)
exports.api = functions.region("us-central1").https.onRequest(app);
exports.appApi = functions.region("us-central1").https.onRequest(app);
