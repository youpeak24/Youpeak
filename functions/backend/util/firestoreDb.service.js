const firebaseAdmin = require("./firebaseAdmin"); // initialises firebase-admin once
const fs = require("fs");
const path = require("path");
const os = require("os");

class FirestoreDbService {
  constructor() {
    this.db = null;
    this.localDbFile = path.join(os.tmpdir(), "youpeak_local_db.json");
    // Firestore op timeout. Cold connections can take >1.4s; serverless cold
    // starts more. Keep it well under the platform function limit.
    this.opTimeoutMs = Number(process.env.FIRESTORE_TIMEOUT_MS) || 8000;
    // Local JSON mirror is a DEV-ONLY convenience. In production it hides real
    // Firestore failures and (on serverless) writes to an ephemeral tmp dir,
    // so it is OFF unless explicitly enabled.
    this.allowLocalFallback = String(process.env.ALLOW_LOCAL_DB_FALLBACK || "").toLowerCase() === "true";
    if (this.allowLocalFallback) this.ensureLocalDbFile();
  }

  ensureLocalDbFile() {
    try {
      if (!fs.existsSync(this.localDbFile)) {
        fs.writeFileSync(this.localDbFile, JSON.stringify({}), "utf8");
      }
    } catch (e) {}
  }

  readLocalDb() {
    try {
      this.ensureLocalDbFile();
      let localData = {};
      try {
        const content = fs.readFileSync(this.localDbFile, "utf8");
        localData = JSON.parse(content || "{}");
      } catch (e) {}

      try {
        const candidates = [
          path.resolve(__dirname, "../DB"),
          path.resolve(__dirname, "../../DB"),
          path.resolve(__dirname, "../../../DB"),
          path.resolve(process.cwd(), "DB"),
          path.resolve(process.cwd(), "admin/frontend/DB"),
        ];
        const dbDir = candidates.find((dir) => {
          try {
            return fs.existsSync(dir);
          } catch (e) {
            return false;
          }
        });
        if (dbDir) {
          const files = fs.readdirSync(dbDir);
          for (const file of files) {
            if (file.endsWith(".json") && file !== "translations.json" && file !== "languagefortranslations.json") {
              const collectionName = file.replace(".json", "").toLowerCase().trim();
              const normalizedName = this.normalizeCollectionName(collectionName);

              if (!localData[normalizedName]) {
                localData[normalizedName] = {};
              }

              try {
                const filePath = path.join(dbDir, file);
                const fileContent = fs.readFileSync(filePath, "utf8");
                const jsonData = JSON.parse(fileContent);

                const items = Array.isArray(jsonData) ? jsonData : [jsonData];
                for (const item of items) {
                  const docId = String(item._id?.$oid || item._id || item.id || Date.now());
                  if (!localData[normalizedName][docId]) {
                    const cleanDoc = JSON.parse(JSON.stringify(item));
                    cleanDoc._id = docId;
                    cleanDoc.id = docId;
                    if (cleanDoc.createdAt?.$date) cleanDoc.createdAt = cleanDoc.createdAt.$date;
                    if (cleanDoc.updatedAt?.$date) cleanDoc.updatedAt = cleanDoc.updatedAt.$date;
                    localData[normalizedName][docId] = cleanDoc;
                  }
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      return localData;
    } catch (e) {
      return {};
    }
  }

  writeLocalDb(data) {
    try {
      this.ensureLocalDbFile();
      fs.writeFileSync(this.localDbFile, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {}
  }

  getDb() {
    if (!this.db) {
      this.db = firebaseAdmin.getFirestore();
    }
    return this.db;
  }

  normalizeCollectionName(name) {
    if (!name) return name;
    const lower = name.toString().toLowerCase().trim();
    if (lower === "user") return "users";
    if (lower === "video") return "videos";
    if (lower === "short") return "shorts";
    if (lower === "channel") return "channels";
    return name;
  }

  async withTimeout(promiseMs, ms = this.opTimeoutMs) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("GCP_TIMEOUT")), ms);
    });
    try {
      const result = await Promise.race([promiseMs, timeoutPromise]);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // Normalise a Mongo-style query into flat { field: scalar } equality pairs.
  // Unwraps ObjectId-like wrappers; drops operator objects ($gt/$in/…) and
  // $or/$and (not supported by this shim — do those in the controller).
  _flattenQuery(query) {
    const out = {};
    if (!query || typeof query !== "object" || Array.isArray(query)) return out;
    for (const key of Object.keys(query)) {
      if (key.startsWith("$")) continue;
      let v = query[key];
      if (v === undefined || v === null) continue;
      if (typeof v === "object") {
        if (typeof v.toJSON === "function") v = v.toJSON();
        else if (v._id != null) v = String(v._id);
        else continue; // operator / nested object — unsupported here
      }
      if (typeof v !== "object") out[key] = v;
    }
    return out;
  }

  // In-memory sort so we never need Firestore composite indexes.
  // options.sort is a Mongo-style map, e.g. { createdAt: -1, name: 1 }.
  _applySort(rows, sort) {
    if (!sort || typeof sort !== "object" || Array.isArray(sort)) return rows;
    const keys = Object.keys(sort);
    if (!keys.length) return rows;
    return rows.slice().sort((a, b) => {
      for (const k of keys) {
        const dir = sort[k] === -1 || sort[k] === "desc" ? -1 : 1;
        let av = a[k], bv = b[k];
        if (av === bv) continue;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
      }
      return 0;
    });
  }

  async find(collectionName, query = {}, options = {}) {
    const normalizedName = this.normalizeCollectionName(collectionName);
    const hasSort = options.sort && typeof options.sort === "object" &&
      !Array.isArray(options.sort) && Object.keys(options.sort).length > 0;
    const flatQuery = this._flattenQuery(query);

    try {
      const db = this.getDb();
      if (db) {
        let ref = db.collection(normalizedName);

        // Equality filters only. Firestore serves multi-equality queries with
        // no composite index; anything fancier ($gt/$in/$regex/…) is not
        // supported by this shim and must be done in the controller.
        for (const [key, v] of Object.entries(flatQuery)) {
          ref = ref.where(key, "==", v);
        }

        // Only push a DB-side limit when we are NOT sorting in memory
        // (sorting after a truncated fetch would drop rows).
        if (!hasSort && options.limit && typeof options.limit === "number") {
          ref = ref.limit(options.limit);
        }

        const snapshot = await this.withTimeout(ref.get());
        let results = [];
        snapshot.forEach((doc) => {
          results.push({ _id: doc.id, id: doc.id, ...doc.data() });
        });

        if (hasSort) {
          results = this._applySort(results, options.sort);
          if (options.limit && typeof options.limit === "number") {
            results = results.slice(options.skip || 0, (options.skip || 0) + options.limit);
          }
        }

        return results;
      }
    } catch (err) {
      console.error(`Firestore find() failed for "${normalizedName}":`, err.message);
      if (!this.allowLocalFallback) throw err;
    }

    // Local JSON fallback (dev only — see constructor)
    const localData = this.readLocalDb();
    const collection = localData[normalizedName] || {};
    let results = Object.values(collection);

    for (const [key, v] of Object.entries(flatQuery)) {
      results = results.filter((item) => item[key] === v);
    }

    if (hasSort) results = this._applySort(results, options.sort);

    if (options.limit && typeof options.limit === "number") {
      const skip = options.skip || 0;
      results = results.slice(skip, skip + options.limit);
    }

    return results;
  }

  async count(collectionName, query = {}) {
    const results = await this.find(collectionName, query);
    return results.length;
  }

  async countDocuments(collectionName, query = {}) {
    return await this.count(collectionName, query);
  }

  async findOne(collectionName, query = {}) {
    const results = await this.find(collectionName, query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async findById(collectionName, id) {
    if (!id) return null;
    const normalizedName = this.normalizeCollectionName(collectionName);
    try {
      const db = this.getDb();
      if (db) {
        const doc = await this.withTimeout(db.collection(normalizedName).doc(String(id)).get());
        return doc.exists ? { _id: doc.id, id: doc.id, ...doc.data() } : null;
      }
    } catch (err) {
      console.error(`Firestore findById() failed for "${normalizedName}/${id}":`, err.message);
      if (!this.allowLocalFallback) throw err;
    }

    const localData = this.readLocalDb();
    const collection = localData[normalizedName] || {};
    return collection[String(id)] || null;
  }

  async create(collectionName, data, customId = null) {
    const normalizedName = this.normalizeCollectionName(collectionName);
    const cleanData = JSON.parse(JSON.stringify(data));
    cleanData.createdAt = cleanData.createdAt || new Date().toISOString();
    cleanData.updatedAt = new Date().toISOString();
    const docId = String(customId || cleanData._id || cleanData.id || Date.now());
    cleanData._id = docId;
    cleanData.id = docId;

    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    try {
      await this.withTimeout(db.collection(normalizedName).doc(docId).set(cleanData, { merge: true }));
    } catch (err) {
      console.error(`Firestore create() failed for "${normalizedName}/${docId}":`, err.message);
      throw err;
    }

    if (this.allowLocalFallback) {
      const localData = this.readLocalDb();
      if (!localData[normalizedName]) localData[normalizedName] = {};
      localData[normalizedName][docId] = cleanData;
      this.writeLocalDb(localData);
    }

    return cleanData;
  }

  async update(collectionName, id, updateData) {
    if (!id) return null;
    const normalizedName = this.normalizeCollectionName(collectionName);
    const cleanData = JSON.parse(JSON.stringify(updateData));
    cleanData.updatedAt = new Date().toISOString();

    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    const docRef = db.collection(normalizedName).doc(String(id));
    let merged;
    try {
      await this.withTimeout(docRef.set(cleanData, { merge: true }));
      const fresh = await this.withTimeout(docRef.get());
      merged = fresh.exists
        ? { _id: fresh.id, id: fresh.id, ...fresh.data() }
        : { ...cleanData, _id: String(id), id: String(id) };
    } catch (err) {
      console.error(`Firestore update() failed for "${normalizedName}/${id}":`, err.message);
      throw err;
    }

    if (this.allowLocalFallback) {
      const localData = this.readLocalDb();
      if (!localData[normalizedName]) localData[normalizedName] = {};
      localData[normalizedName][String(id)] = merged;
      this.writeLocalDb(localData);
    }

    return merged;
  }

  async delete(collectionName, id) {
    if (!id) return false;
    const normalizedName = this.normalizeCollectionName(collectionName);
    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    try {
      await this.withTimeout(db.collection(normalizedName).doc(String(id)).delete());
    } catch (err) {
      console.error(`Firestore delete() failed for "${normalizedName}/${id}":`, err.message);
      throw err;
    }

    if (this.allowLocalFallback) {
      const localData = this.readLocalDb();
      if (localData[normalizedName] && localData[normalizedName][String(id)]) {
        delete localData[normalizedName][String(id)];
        this.writeLocalDb(localData);
      }
    }
    return true;
  }

  async seedDefaultData() {
    try {
      const defaultLanguage = await this.findOne("languages", { isDefault: true });
      if (!defaultLanguage) {
        await this.create(
          "languages",
          {
            _id: "lang_default_en",
            name: "English",
            code: "en",
            isDefault: true,
          },
          "lang_default_en"
        );
      }

      const defaultCurrency = await this.findOne("currencies", { isDefault: true });
      if (!defaultCurrency) {
        await this.create(
          "currencies",
          {
            _id: "currency_default",
            name: "Indian Rupee",
            symbol: "₹",
            currencyCode: "INR",
            isDefault: true,
          },
          "currency_default"
        );
      }
    } catch (err) {}
  }
}

module.exports = new FirestoreDbService();
