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
      localbusinessad: "localBusinessAds", localbusinessads: "localBusinessAds",
      // Admin coinplan.controller.js used the raw db wrapper with the
      // literal string "coinplans" while every client/payment path uses
      // the CoinPlan Mongoose-shim model (-> collection "CoinPlan") — two
      // different Firestore collections, so an admin-created coin plan was
      // invisible to the app and unpurchasable. Both spellings now resolve
      // to the one collection the client/payment side already depends on.
      coinplan: "CoinPlan", coinplans: "CoinPlan",
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

  /**
   * Atomically add (or subtract, for a negative delta) to one or more
   * numeric fields using Firestore's own FieldValue.increment — a
   * field-level mutation Firestore applies without a client-side
   * read-modify-write, so two concurrent credits to the same field (e.g.
   * two payments landing for the same user at once) can never lose one the
   * way `update(id, {coin: current + delta})` can — that pattern reads the
   * same starting value in both requests and the second write simply
   * overwrites the first with its own (identically stale) computed result.
   *
   * Deliberately NOT built on update(): update() JSON-clones its payload
   * (`JSON.parse(JSON.stringify(...))`), which strips a FieldValue sentinel
   * down to `{}` — it has to be handed to Firestore untouched.
   *
   * No guard/floor here (unlike spendBalance) — increments are always
   * allowed, in either direction. Use spendBalance() instead when the
   * write must refuse below a threshold (e.g. spending down to negative).
   *
   * @param {string} collectionName
   * @param {string} id
   * @param {Object<string, number>} deltas   field -> signed amount to add; zero/NaN entries are skipped
   * @param {Object} [extraSet]               plain fields to set alongside, not incremented
   * @returns {Promise<Object|null>} the document after the write, or null if id is missing
   */
  async incrementFields(collectionName, id, deltas, extraSet = {}) {
    if (!id) return null;
    const normalizedName = this.normalizeCollectionName(collectionName);
    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    const docRef = db.collection(normalizedName).doc(String(id));

    const payload = { ...extraSet, updatedAt: new Date().toISOString() };
    for (const [field, amount] of Object.entries(deltas || {})) {
      const n = Number(amount);
      if (!n) continue;
      payload[field] = firebaseAdmin.firestore.FieldValue.increment(n);
    }

    let merged;
    try {
      await this.withTimeout(docRef.set(payload, { merge: true }));
      const fresh = await this.withTimeout(docRef.get());
      merged = fresh.exists ? { _id: fresh.id, id: fresh.id, ...fresh.data() } : null;
    } catch (err) {
      console.error(`Firestore incrementFields() failed for "${normalizedName}/${id}":`, err.message);
      throw err;
    }

    if (merged && this.allowLocalFallback) {
      const localData = this.readLocalDb();
      if (!localData[normalizedName]) localData[normalizedName] = {};
      localData[normalizedName][String(id)] = merged;
      this.writeLocalDb(localData);
    }
    return merged;
  }

  /**
   * Atomically test-and-set a boolean "already done" flag on one document —
   * a real Firestore transaction, same reasoning as spendBalance(). A plain
   * `if (doc.flag) return; else update(id, {flag:true})` has a window where
   * two concurrent callers (e.g. a Razorpay webhook and the client's own
   * /verify call landing milliseconds apart for the same payment) both read
   * the flag as false before either write lands, and both proceed to do
   * whatever the flag was supposed to allow only once.
   *
   * Only the ONE caller that actually flips false -> true gets
   * {claimed: true}; every other concurrent (or later) caller gets
   * {claimed: false} and must not repeat the guarded action.
   *
   * @param {string} collectionName
   * @param {string} id
   * @param {string} field   the boolean flag field to claim
   * @returns {Promise<{claimed:boolean, reason?:string, doc:Object|null}>}
   */
  async claimOnce(collectionName, id, field) {
    const normalizedName = this.normalizeCollectionName(collectionName);
    if (!id) return { claimed: false, reason: "NO_ID", doc: null };
    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    const ref = db.collection(normalizedName).doc(String(id));

    try {
      return await this.withTimeout(
        db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists) return { claimed: false, reason: "NOT_FOUND", doc: null };
          const data = { _id: snap.id, id: snap.id, ...snap.data() };
          if (data[field]) return { claimed: false, reason: "ALREADY_CLAIMED", doc: data };
          tx.update(ref, { [field]: true, updatedAt: new Date().toISOString() });
          return { claimed: true, doc: { ...data, [field]: true } };
        })
      );
    } catch (err) {
      console.error(`Firestore claimOnce() failed for "${normalizedName}/${id}.${field}":`, err.message);
      throw err;
    }
  }

  /**
   * Atomically move up to `amount` out of one numeric field into one or
   * more others, in a single Firestore transaction. The amount actually
   * moved is clamped to whatever the source field holds AT TRANSACTION
   * TIME, so a concurrent invocation (e.g. the same held-referral-release
   * cron firing twice, from two schedulers or a retried request) can never
   * move more out of the source than it has, or move the same held amount
   * twice — the second transaction simply sees an already-drained source.
   *
   * @param {string} collectionName
   * @param {string} id
   * @param {string} fromField            numeric field to decrement (floored at 0)
   * @param {Object<string, number>} toFieldMultipliers  destination field -> amount credited per unit moved (usually 1; use e.g. 0.01 for an INR-per-coin field)
   * @param {number} amount               the most that should move, before clamping
   * @returns {Promise<{ok:boolean, moved:number, before:number, after:number}>}
   */
  async moveBalance(collectionName, id, fromField, toFieldMultipliers, amount) {
    const normalizedName = this.normalizeCollectionName(collectionName);
    const amt = Number(amount);
    if (!id) return { ok: false, moved: 0, before: 0, after: 0 };
    if (!(amt > 0)) return { ok: false, moved: 0, before: 0, after: 0 };

    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    const ref = db.collection(normalizedName).doc(String(id));

    try {
      return await this.withTimeout(
        db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists) return { ok: false, moved: 0, before: 0, after: 0 };
          const before = Number(snap.data()[fromField]) || 0;
          const moved = Math.min(amt, before);
          if (moved <= 0) return { ok: true, moved: 0, before, after: before };
          const after = before - moved;
          const update = { [fromField]: after, updatedAt: new Date().toISOString() };
          for (const [field, perUnit] of Object.entries(toFieldMultipliers || {})) {
            const delta = Number(perUnit) * moved;
            if (!delta) continue;
            update[field] = firebaseAdmin.firestore.FieldValue.increment(delta);
          }
          tx.update(ref, update);
          return { ok: true, moved, before, after };
        })
      );
    } catch (err) {
      console.error(`Firestore moveBalance() failed for "${normalizedName}/${id}":`, err.message);
      throw err;
    }
  }

  /**
   * Atomically create a document ONLY if one doesn't already exist at this
   * id — Firestore's native create() precondition (a single server-side
   * write with an existence check), not a client-side findOne-then-create
   * that two concurrent requests can both pass. Give it a deterministic id
   * derived from whatever must be unique (e.g.
   * `${userId}_${videoId}_${historyType}`) to turn "reward this at most
   * once" into a database-enforced guarantee instead of a race a
   * double-tap or a retried request can slip through.
   *
   * @returns {Promise<{created:boolean, doc:Object|null}>} created:false
   *   means a document already existed at this id — the caller must not
   *   repeat whatever that document's existence is guarding.
   */
  async createOnce(collectionName, id, data) {
    const normalizedName = this.normalizeCollectionName(collectionName);
    const docId = String(id);
    const cleanData = JSON.parse(JSON.stringify(data || {}));
    cleanData.createdAt = cleanData.createdAt || new Date().toISOString();
    cleanData.updatedAt = new Date().toISOString();
    cleanData._id = docId;
    cleanData.id = docId;

    const db = this.getDb();
    if (!db) throw new Error("Firestore is not initialised");
    const ref = db.collection(normalizedName).doc(docId);
    try {
      await this.withTimeout(ref.create(cleanData));
    } catch (err) {
      const alreadyExists = err.code === 6 || /ALREADY_EXISTS/i.test(err.message || "");
      if (alreadyExists) return { created: false, doc: null };
      console.error(`Firestore createOnce() failed for "${normalizedName}/${docId}":`, err.message);
      throw err;
    }

    if (this.allowLocalFallback) {
      const localData = this.readLocalDb();
      if (!localData[normalizedName]) localData[normalizedName] = {};
      localData[normalizedName][docId] = cleanData;
      this.writeLocalDb(localData);
    }
    return { created: true, doc: cleanData };
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
