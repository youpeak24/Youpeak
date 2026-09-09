// Single source of truth for Firebase Admin initialisation.
// Every module that needs `firebase-admin` must require THIS file, never call
// admin.initializeApp() itself — otherwise the first (possibly credential-less)
// call wins and Firestore auth silently breaks on serverless hosts.
const admin = require("firebase-admin");

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON:", e.message);
    }
  }
  for (const rel of ["../serviceAccountKey.json", "../../serviceAccountKey.json", "../../../serviceAccountKey.json"]) {
    try {
      return require(rel);
    } catch (e) {
      /* not found — try next */
    }
  }
  return null;
}

if (admin.apps.length === 0) {
  const serviceAccount = loadServiceAccount();
  const projectId =
    (serviceAccount && serviceAccount.project_id) ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCP_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    "youpeak-9ff65";
  // youpeak-9ff65's real bucket is <project>.firebasestorage.app (newer default),
  // not the legacy <project>.appspot.com.
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

  if (serviceAccount && serviceAccount.private_key) {
    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccount,
        private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
      projectId,
      storageBucket,
    });
    console.log("🔥 Firebase Admin initialised (service account:", serviceAccount.client_email + ")");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || process.env.K_SERVICE) {
    admin.initializeApp({ projectId, storageBucket });
    console.log("🔥 Firebase Admin initialised (application default credentials)");
  } else {
    throw new Error(
      "No Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT (JSON string) or " +
      "GOOGLE_APPLICATION_CREDENTIALS (file path), or add serviceAccountKey.json for local dev."
    );
  }
}

let _db = null;
function getFirestore() {
  if (!_db) {
    _db = admin.firestore();
    try {
      _db.settings({ ignoreUndefinedProperties: true });
    } catch (e) {
      /* settings can only be applied once */
    }
  }
  return _db;
}

module.exports = admin;               // the initialised firebase-admin module
module.exports.getFirestore = getFirestore;
module.exports.loadServiceAccount = loadServiceAccount;
