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
    const key = name.toString().toLowerCase().trim();
    // Mongoose model names -> actual Firestore collection ids (see listCollections()).
    // Anything not listed keeps its given name.
    const MAP = {
      user: "users", users: "users",
      video: "videos", videos: "videos",
      short: "shorts", shorts: "shorts",
      channel: "channels", channels: "channels",
      admin: "admins", admins: "admins",
      membershiptier: "membershipTiers", membershiptiers: "membershipTiers",
      history: "histories", histories: "histories",
      dailyreward: "dailyrewards", dailyrewards: "dailyrewards", dailyrewardcoin: "dailyrewards",
      adrewardcoin: "adrewards", adrewards: "adrewards",
      advertise: "advertises", advertises: "advertises",
      agency: "agencies", agencies: "agencies",
      currency: "currencies", currencies: "currencies",
      language: "languages", languages: "languages",
      login: "logins", logins: "logins",
      setting: "settings", settings: "settings",
      referralhistory: "referralHistories", referralhistories: "referralHistories",
      checkin: "checkIns", checkins: "checkIns",
      wallethistory: "walletHistories", wallethistories: "walletHistories",
      withdrawrequest: "withDrawRequests", withdrawrequests: "withDrawRequests",
      videounlock: "videoUnlocks", videounlocks: "videoUnlocks",
      agencycommission: "agencyCommissions", agencycommissions: "agencyCommissions",
      revenueledger: "revenueLedger",
      paymenttransaction: "paymentTransactions", paymenttransactions: "paymentTransactions",
      report: "reports", reports: "reports",
      keywordblacklist: "KeywordBlacklist",
      contentfingerprint: "contentFingerprints", contentfingerprints: "contentFingerprints",
      fingerprintqueue: "fingerprintQueue",
      grievance: "grievances", grievances: "grievances",
      fraudalert: "fraudAlerts", fraudalerts: "fraudAlerts",
      partnerprofile: "partnerProfiles", partnerprofiles: "partnerProfiles",
      creatorfundingcampaign: "creatorFundingCampaigns", creatorfundingcampaigns: "creatorFundingCampaigns",
      campaignbacking: "campaignBackings", campaignbackings: "campaignBackings",
    };
    return MAP[key] || name;
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

    // Lookup by document id → doc path (a where("_id","==") clause misses docs
    // that don't store an _id field).
    const idVal = flatQuery._id != null ? flatQuery._id : flatQuery.id;
    if (idVal != null) {
      const doc = await this.findById(collectionName, idVal);
      if (!doc) return [];
      for (const [k, v] of Object.entries(flatQuery)) {
        if (k !== "_id" && k !== "id" && doc[k] !== v) return [];
      }
      return [doc];
    }

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
    const flat = this._flattenQuery(query);
    // A lookup by document id must go through the doc path — many docs don't
    // store an `_id`/`id` field, so a where("_id","==",…) clause would miss.
    const idKey = flat._id != null ? "_id" : (flat.id != null ? "id" : null);
    if (idKey) {
      const doc = await this.findById(collectionName, flat[idKey]);
      if (!doc) return null;
      // still honour any other equality fields in the query
      const others = Object.entries(flat).filter(([k]) => k !== "_id" && k !== "id");
      for (const [k, v] of others) {
        if (doc[k] !== v) return null;
      }
      return doc;
    }
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

  /**
   * Atomically decrement a numeric field on one document, refusing (no write
   * at all) if the balance is below `amount`.
   *
   * update()'s $inc (via mongooseShim's buildUpdatePayload) reads the field
   * in JS, adds to it, and writes the plain result back — there is no
   * database-level atomicity to that read-then-write. Two concurrent spends
   * (e.g. a user double-tapping "unlock", or a script firing parallel
   * requests) can both read the same starting balance before either write
   * lands, both pass their own "balance >= cost" guard, and both write —
   * the second write simply overwrites the first with the same computed
   * value, so the user is charged once but received the goods twice. That's
   * a real, practically exploitable double-spend on every coin-spending
   * endpoint (video unlocks, coin-to-cash conversion, ...), not just a
   * theoretical one.
   *
   * This uses a real Firestore transaction: the read and the write happen
   * as one atomic unit, and Firestore itself detects and retries the
   * transaction if another write touched the document in between — so two
   * concurrent spends can never both succeed against a balance that only
   * covers one of them.
   *
   * Intentionally narrow (one field, one document, no companion writes) so
   * it's easy to reason about and test; callers do their own create/update
   * of related records AFTER a successful spend, same as before.
   *
   * @returns {Promise<{ok:boolean, reason?:string, before:number, after:number}>}
   */
  async spendBalance(collectionName, id, field, amount) {
    const normalizedName = this.normalizeCollectionName(collectionName);
    const amt = Number(amount);
    if (!id) return { ok: false, reason: "NO_ID", before: 0, after: 0 };
    if (!(amt > 0)) return { ok: false, reason: "INVALID_AMOUNT", before: 0, after: 0 };

    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    const ref = db.collection(normalizedName).doc(String(id));

    try {
      const result = await this.withTimeout(
        db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists) return { ok: false, reason: "NOT_FOUND", before: 0, after: 0 };
          const before = Number(snap.data()[field]) || 0;
          if (before < amt) return { ok: false, reason: "INSUFFICIENT", before, after: before };
          const after = before - amt;
          tx.update(ref, { [field]: after, updatedAt: new Date().toISOString() });
          return { ok: true, before, after };
        })
      );

      if (result.ok && this.allowLocalFallback) {
        const localData = this.readLocalDb();
        if (localData[normalizedName]?.[String(id)]) {
          localData[normalizedName][String(id)][field] = result.after;
          this.writeLocalDb(localData);
        }
      }
      return result;
    } catch (err) {
      console.error(`Firestore spendBalance() failed for "${normalizedName}/${id}.${field}":`, err.message);
      throw err;
    }
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

      // Membership tiers (tasker + creator) — seed once if the collection is empty.
      const existingTiers = await this.find("membershipTiers", {}, { limit: 1 });
      if (!existingTiers || existingTiers.length === 0) {
        const { ALL_TIERS } = require("../types/tiers");
        for (const tier of ALL_TIERS) {
          await this.create("membershipTiers", tier, tier._id);
        }
        console.log(`🌱 Seeded ${ALL_TIERS.length} membership tiers`);
      }

      // Daily check-in reward ladder (Mon..Sun) — seed once if empty.
      const existingDaily = await this.find("dailyrewards", {}, { limit: 1 });
      if (!existingDaily || existingDaily.length === 0) {
        const ladder = [300, 330, 350, 400, 450, 550, 600];
        for (let i = 0; i < 7; i++) {
          await this.create("dailyrewards", { _id: `dailyreward_day_${i + 1}`, day: i + 1, dailyRewardCoin: ladder[i] }, `dailyreward_day_${i + 1}`);
        }
        console.log("🌱 Seeded 7-day check-in reward ladder");
      }
    } catch (err) {
      console.warn("seedDefaultData note:", err.message);
    }
  }
}

module.exports = new FirestoreDbService();
