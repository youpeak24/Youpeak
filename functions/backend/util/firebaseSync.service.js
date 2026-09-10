const firebaseAdmin = require("./firebaseAdmin");

/**
 * Firebase Firestore Text & Metadata Service
 */
class FirebaseSyncService {
  constructor() {
    this.db = null;
  }

  getFirestore() {
    if (!this.db) {
      try {
        this.db = firebaseAdmin.getFirestore();
      } catch (err) {
        console.error("Error connecting to Firestore instance:", err.message);
      }
    }
    return this.db;
  }

  /**
   * Sync document/record text metadata into Firebase Firestore collection
   */
  async syncMetadata(collectionName, documentId, data) {
    try {
      const firestore = this.getFirestore();
      if (!firestore) {
        console.log(`ℹ️ Firebase Firestore not initialized, metadata update queued locally for [${collectionName}/${documentId}]`);
        return false;
      }

      const cleanData = JSON.parse(JSON.stringify(data));
      cleanData.updatedAt = new Date().toISOString();

      await firestore.collection(collectionName).doc(String(documentId)).set(cleanData, { merge: true });
      console.log(`✅ Text Metadata synced to Firebase Firestore [${collectionName}/${documentId}]`);
      return true;
    } catch (error) {
      console.error(`❌ Error syncing metadata to Firebase Firestore [${collectionName}]:`, error.message);
      return false;
    }
  }

  /**
   * Delete record metadata from Firebase Firestore
   */
  async deleteMetadata(collectionName, documentId) {
    try {
      const firestore = this.getFirestore();
      if (!firestore) return false;

      await firestore.collection(collectionName).doc(String(documentId)).delete();
      console.log(`✅ Record deleted from Firebase Firestore [${collectionName}/${documentId}]`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting record from Firebase Firestore:`, error.message);
      return false;
    }
  }
}

module.exports = new FirebaseSyncService();
