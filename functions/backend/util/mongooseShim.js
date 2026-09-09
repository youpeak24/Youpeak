const firestoreDb = require("./firestoreDb.service");

// ── Mongo-style update operators, applied in JS (Firestore shim has no atomic ops) ──
// Supports $set, $inc, $mul, $push, $addToSet, $pull, $unset, and bare fields.
function buildUpdatePayload(existing, updateData) {
  existing = existing || {};
  const out = {};

  // bare top-level fields (no leading $)
  for (const k of Object.keys(updateData || {})) {
    if (!k.startsWith("$")) out[k] = updateData[k];
  }
  if (updateData && updateData.$set) Object.assign(out, updateData.$set);

  if (updateData && updateData.$inc) {
    for (const [k, v] of Object.entries(updateData.$inc)) {
      out[k] = (Number(existing[k]) || 0) + Number(v || 0);
    }
  }
  if (updateData && updateData.$mul) {
    for (const [k, v] of Object.entries(updateData.$mul)) {
      out[k] = (Number(existing[k]) || 0) * Number(v || 0);
    }
  }
  if (updateData && updateData.$push) {
    for (const [k, v] of Object.entries(updateData.$push)) {
      const arr = Array.isArray(existing[k]) ? existing[k].slice() : [];
      if (v && typeof v === "object" && Array.isArray(v.$each)) arr.push(...v.$each);
      else arr.push(v);
      out[k] = arr;
    }
  }
  if (updateData && updateData.$addToSet) {
    for (const [k, v] of Object.entries(updateData.$addToSet)) {
      const arr = Array.isArray(existing[k]) ? existing[k].slice() : [];
      const items = v && typeof v === "object" && Array.isArray(v.$each) ? v.$each : [v];
      for (const it of items) {
        if (!arr.some((x) => JSON.stringify(x) === JSON.stringify(it))) arr.push(it);
      }
      out[k] = arr;
    }
  }
  if (updateData && updateData.$pull) {
    for (const [k, v] of Object.entries(updateData.$pull)) {
      const arr = Array.isArray(existing[k]) ? existing[k] : [];
      out[k] = arr.filter((x) => JSON.stringify(x) !== JSON.stringify(v));
    }
  }
  if (updateData && updateData.$unset) {
    for (const k of Object.keys(updateData.$unset)) out[k] = null;
  }
  return out;
}

// Evaluate operator conditions in a query against a doc (e.g. { coin: { $gte: 100 } }).
// Returns false if any guard fails — used so updateOne won't run when the doc
// no longer satisfies a precondition (e.g. insufficient balance).
function matchesQueryGuards(doc, query) {
  if (!doc || !query || typeof query !== "object") return true;
  for (const [key, cond] of Object.entries(query)) {
    if (key.startsWith("$")) continue;
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      const v = doc[key];
      for (const [op, target] of Object.entries(cond)) {
        if (op === "$gte" && !(Number(v) >= Number(target))) return false;
        if (op === "$gt" && !(Number(v) > Number(target))) return false;
        if (op === "$lte" && !(Number(v) <= Number(target))) return false;
        if (op === "$lt" && !(Number(v) < Number(target))) return false;
        if (op === "$ne" && !(v !== target)) return false;
        if (op === "$in" && !(Array.isArray(target) && target.includes(v))) return false;
        if (op === "$nin" && Array.isArray(target) && target.includes(v)) return false;
      }
    }
  }
  return true;
}

class FirestoreQuery {
  constructor(collectionName, opType, query = {}, extraData = null) {
    this.collectionName = collectionName;
    this.opType = opType;
    this.query = query;
    this.extraData = extraData;
    this.options = { sort: null, limit: null, skip: 0 };
  }

  sort(sortObj) {
    if (typeof sortObj === "string") {
      const parts = sortObj.trim().split(/\s+/);
      const sortMap = {};
      parts.forEach(p => {
        if (p.startsWith("-")) sortMap[p.substring(1)] = -1;
        else if (p.startsWith("+")) sortMap[p.substring(1)] = 1;
        else if (p) sortMap[p] = 1;
      });
      this.options.sort = sortMap;
    } else {
      this.options.sort = sortObj;
    }
    return this;
  }

  limit(limitNum) {
    this.options.limit = Number(limitNum);
    return this;
  }

  skip(skipNum) {
    this.options.skip = Number(skipNum);
    return this;
  }

  select() { return this; }
  populate() { return this; }
  lean() { return this; }
  exec() { return this.execute(); }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    if (this.opType === "find") {
      return await firestoreDb.find(this.collectionName, this.query, this.options);
    } else if (this.opType === "findOne") {
      return await firestoreDb.findOne(this.collectionName, this.query);
    } else if (this.opType === "findById") {
      return await firestoreDb.findById(this.collectionName, this.query);
    } else if (this.opType === "count" || this.opType === "countDocuments") {
      return await firestoreDb.countDocuments(this.collectionName, this.query);
    } else if (this.opType === "create") {
      return await firestoreDb.create(this.collectionName, this.extraData);
    } else if (this.opType === "update") {
      return await firestoreDb.update(this.collectionName, this.query, this.extraData);
    } else if (this.opType === "delete") {
      return await firestoreDb.delete(this.collectionName, this.query);
    }
    return null;
  }
}

// Firestore uses string document ids. This coerces anything Mongoose code
// throws at `new mongoose.Types.ObjectId(x)` / `mongoose.Types.ObjectId(x)`
// into that string. When called with `new`, JS ignores a primitive return, so
// the instance carries toString/valueOf/toJSON that all yield the id string.
function ObjectId(val) {
  let s;
  if (val && typeof val === "object") s = String(val._id || val.id || val.toString?.() || "");
  else s = val != null && val !== "" ? String(val) : "";
  if (this instanceof ObjectId) {
    this._id = s;
    return this;
  }
  return s;
}
ObjectId.prototype.toString = function () { return this._id; };
ObjectId.prototype.valueOf = function () { return this._id; };
ObjectId.prototype.toJSON = function () { return this._id; };
ObjectId.isValid = (id) => Boolean(id);

function createFirestoreModel(modelName) {
  const collectionName = firestoreDb.normalizeCollectionName(modelName);

  function ModelConstructor(data = {}) {
    Object.assign(this, data);
  }

  ModelConstructor.prototype.save = async function () {
    const created = await firestoreDb.create(collectionName, this);
    Object.assign(this, created);
    return this;
  };

  ModelConstructor.modelName = modelName;
  ModelConstructor.collectionName = collectionName;

  ModelConstructor.find = function (query = {}) {
    return new FirestoreQuery(collectionName, "find", query);
  };

  ModelConstructor.findOne = function (query = {}) {
    return new FirestoreQuery(collectionName, "findOne", query);
  };

  ModelConstructor.findById = function (id) {
    return new FirestoreQuery(collectionName, "findById", id);
  };

  ModelConstructor.countDocuments = function (query = {}) {
    return new FirestoreQuery(collectionName, "countDocuments", query);
  };

  ModelConstructor.count = function (query = {}) {
    return new FirestoreQuery(collectionName, "count", query);
  };

  ModelConstructor.create = async function (data) {
    return await firestoreDb.create(collectionName, data);
  };

  ModelConstructor.insertMany = async function (dataArray) {
    if (!Array.isArray(dataArray)) return [];
    const results = [];
    for (const item of dataArray) {
      results.push(await firestoreDb.create(collectionName, item));
    }
    return results;
  };

  ModelConstructor.updateOne = async function (query = {}, updateData = {}) {
    const directId = query._id || query.id;
    const existing = directId
      ? await firestoreDb.findById(collectionName, directId)
      : await firestoreDb.findOne(collectionName, query);

    if (!existing) return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
    if (!matchesQueryGuards(existing, query)) {
      return { matchedCount: 1, modifiedCount: 0, acknowledged: true };
    }

    await firestoreDb.update(collectionName, existing._id || existing.id, buildUpdatePayload(existing, updateData));
    return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
  };

  ModelConstructor.updateMany = async function (query = {}, updateData = {}) {
    const items = await firestoreDb.find(collectionName, query);
    let modified = 0;
    for (const item of items) {
      if (!matchesQueryGuards(item, query)) continue;
      await firestoreDb.update(collectionName, item._id || item.id, buildUpdatePayload(item, updateData));
      modified++;
    }
    return { matchedCount: items.length, modifiedCount: modified, acknowledged: true };
  };

  ModelConstructor.findByIdAndUpdate = async function (id, updateData = {}, options = {}) {
    const existing = await firestoreDb.findById(collectionName, id);
    if (!existing) return null;
    const updated = await firestoreDb.update(collectionName, existing._id || existing.id, buildUpdatePayload(existing, updateData));
    return options && options.new === false ? existing : updated;
  };

  ModelConstructor.findOneAndUpdate = async function (query = {}, updateData = {}, options = {}) {
    const existing = await firestoreDb.findOne(collectionName, query);
    if (!existing) {
      if (options && options.upsert) {
        return await firestoreDb.create(collectionName, buildUpdatePayload({}, updateData));
      }
      return null;
    }
    if (!matchesQueryGuards(existing, query)) return existing;
    const updated = await firestoreDb.update(collectionName, existing._id || existing.id, buildUpdatePayload(existing, updateData));
    return options && options.new === false ? existing : updated;
  };

  ModelConstructor.findByIdAndDelete = async function (id) {
    const existing = await firestoreDb.findById(collectionName, id);
    await firestoreDb.delete(collectionName, id);
    return existing;
  };

  ModelConstructor.findOneAndDelete = async function (query) {
    const existing = await firestoreDb.findOne(collectionName, query);
    if (existing) {
      await firestoreDb.delete(collectionName, existing._id || existing.id);
    }
    return existing;
  };

  ModelConstructor.deleteOne = async function (query) {
    const existing = await firestoreDb.findOne(collectionName, query);
    if (existing) {
      await firestoreDb.delete(collectionName, existing._id || existing.id);
    }
    return { deletedCount: existing ? 1 : 0 };
  };

  ModelConstructor.deleteMany = async function (query) {
    const items = await firestoreDb.find(collectionName, query);
    for (const item of items) {
      await firestoreDb.delete(collectionName, item._id || item.id);
    }
    return { deletedCount: items.length };
  };

  ModelConstructor.aggregate = async function (pipeline = []) {
    let results = await firestoreDb.find(collectionName, {});
    for (const stage of pipeline) {
      if (stage.$match) {
        results = results.filter(item => {
          return Object.keys(stage.$match).every(k => item[k] === stage.$match[k]);
        });
      }
      if (stage.$sort) {
        const key = Object.keys(stage.$sort)[0];
        const dir = stage.$sort[key] === -1 ? -1 : 1;
        results.sort((a, b) => (a[key] > b[key] ? dir : -dir));
      }
      if (stage.$limit) {
        results = results.slice(0, stage.$limit);
      }
    }
    return results;
  };

  ModelConstructor.distinct = async function (field, query = {}) {
    const items = await firestoreDb.find(collectionName, query);
    const set = new Set(items.map(i => i[field]).filter(Boolean));
    return Array.from(set);
  };

  ModelConstructor.exists = async function (query = {}) {
    const count = await firestoreDb.countDocuments(collectionName, query);
    return count > 0;
  };

  return ModelConstructor;
}

class Schema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
  }
  index() { return this; }
  pre() { return this; }
  post() { return this; }
  virtual() { return { get() {}, set() {} }; }
}

Schema.Types = {
  ObjectId: ObjectId,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  Array: Array,
  Mixed: Object
};

const mongooseShim = {
  Schema,
  Types: { ObjectId },
  model: function (name, schema) {
    return createFirestoreModel(name);
  },
  connect: async () => {},
  connection: { readyState: 1, on() {} }
};

module.exports = mongooseShim;
