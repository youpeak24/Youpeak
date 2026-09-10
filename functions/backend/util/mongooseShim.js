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

// Best-effort in-memory aggregation pipeline. Supports the stages the YouPeak
// feed/report controllers actually use: $match (equality + $ne/$gte/$lte/$in),
// $sort, $skip, $limit, $count, $facet, $group (basic), $project (basic),
// $addFields; $lookup / $unwind are skipped (populate is done in the controller).
function matchStage(rows, cond) {
  return rows.filter((item) => {
    for (const [k, v] of Object.entries(cond || {})) {
      if (k === "$or") { if (!v.some((c) => matchStage([item], c).length)) return false; continue; }
      if (k === "$and") { if (!v.every((c) => matchStage([item], c).length)) return false; continue; }
      const val = item[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        for (const [op, t] of Object.entries(v)) {
          if (op === "$ne" && !(val !== t)) return false;
          if (op === "$eq" && !(val === t)) return false;
          if (op === "$gte" && !(val >= t)) return false;
          if (op === "$gt" && !(val > t)) return false;
          if (op === "$lte" && !(val <= t)) return false;
          if (op === "$lt" && !(val < t)) return false;
          if (op === "$in" && !(Array.isArray(t) && t.includes(val))) return false;
          if (op === "$nin" && Array.isArray(t) && t.includes(val)) return false;
          if (op === "$exists" && (t ? val === undefined : val !== undefined)) return false;
        }
      } else if (val !== v) {
        return false;
      }
    }
    return true;
  });
}

function runPipeline(rows, pipeline) {
  let results = Array.isArray(rows) ? rows.slice() : [];
  for (const stage of pipeline || []) {
    if (stage.$match) results = matchStage(results, stage.$match);
    else if (stage.$sort) {
      const keys = Object.keys(stage.$sort);
      results.sort((a, b) => {
        for (const k of keys) {
          const dir = stage.$sort[k] === -1 ? -1 : 1;
          if (a[k] === b[k]) continue;
          return (a[k] > b[k] ? 1 : -1) * dir;
        }
        return 0;
      });
    } else if (stage.$skip) results = results.slice(stage.$skip);
    else if (stage.$limit) results = results.slice(0, stage.$limit);
    else if (stage.$count) results = [{ [stage.$count]: results.length }];
    else if (stage.$facet) {
      const out = {};
      for (const [name, sub] of Object.entries(stage.$facet)) out[name] = runPipeline(results, sub);
      results = [out];
    } else if (stage.$addFields || stage.$set) {
      const add = stage.$addFields || stage.$set;
      results = results.map((r) => ({ ...r, ...resolveComputed(add, r) }));
    } else if (stage.$project) {
      const p = stage.$project;
      const incl = Object.entries(p).filter(([, v]) => v === 1 || v === true).map(([k]) => k);
      const excl = Object.entries(p).filter(([, v]) => v === 0 || v === false).map(([k]) => k);
      results = results.map((r) => {
        if (incl.length) {
          const o = {};
          for (const k of incl) if (r[k] !== undefined) o[k] = r[k];
          if (p._id !== 0) o._id = r._id;
          return { ...o, ...resolveComputed(p, r) };
        }
        const o = { ...r };
        for (const k of excl) delete o[k];
        return o;
      });
    } else if (stage.$group) {
      results = groupStage(results, stage.$group);
    }
    // $lookup / $unwind: skipped — controllers populate manually
  }
  return results;
}

function resolveComputed(spec, doc) {
  const out = {};
  for (const [k, v] of Object.entries(spec)) {
    if (v && typeof v === "object" && v.$ifNull) {
      const [expr, fallback] = v.$ifNull;
      const val = typeof expr === "string" && expr.startsWith("$") ? doc[expr.slice(1)] : expr;
      out[k] = val === undefined || val === null ? fallback : val;
    } else if (typeof v === "string" && v.startsWith("$")) {
      out[k] = doc[v.slice(1)];
    } else if (v === 1 || v === 0 || v === true || v === false) {
      /* projection flag, not a computed field */
    } else {
      out[k] = v;
    }
  }
  return out;
}

function groupStage(rows, spec) {
  const idExpr = spec._id;
  const keyOf = (r) => {
    if (idExpr === null) return "__all__";
    if (typeof idExpr === "string" && idExpr.startsWith("$")) return r[idExpr.slice(1)];
    return JSON.stringify(idExpr);
  };
  const groups = new Map();
  for (const r of rows) {
    const k = keyOf(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const out = [];
  for (const [k, items] of groups) {
    const doc = { _id: k === "__all__" ? null : k };
    for (const [field, acc] of Object.entries(spec)) {
      if (field === "_id") continue;
      const [op, arg] = Object.entries(acc)[0];
      const pick = (r) => (typeof arg === "string" && arg.startsWith("$") ? r[arg.slice(1)] : arg);
      if (op === "$sum") doc[field] = items.reduce((s, r) => s + (Number(pick(r)) || (arg === 1 ? 1 : 0)), 0);
      else if (op === "$count") doc[field] = items.length;
      else if (op === "$avg") doc[field] = items.reduce((s, r) => s + (Number(pick(r)) || 0), 0) / (items.length || 1);
      else if (op === "$max") doc[field] = Math.max(...items.map((r) => Number(pick(r)) || 0));
      else if (op === "$min") doc[field] = Math.min(...items.map((r) => Number(pick(r)) || 0));
      else if (op === "$first") doc[field] = pick(items[0]);
      else if (op === "$last") doc[field] = pick(items[items.length - 1]);
      else if (op === "$push") doc[field] = items.map(pick);
      else if (op === "$addToSet") doc[field] = Array.from(new Set(items.map(pick)));
    }
    out.push(doc);
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

  // Query.distinct(field) → resolves to a de-duplicated array of that field.
  async distinct(field) {
    const rows = await firestoreDb.find(this.collectionName, this.query, this.options);
    const set = new Set();
    for (const r of rows) {
      const v = r && r[field];
      if (v !== undefined && v !== null) set.add(typeof v === "object" ? JSON.stringify(v) : v);
    }
    return Array.from(set);
  }

  // Query.countDocuments() chained after a find()
  async countDocuments() {
    const rows = await firestoreDb.find(this.collectionName, this.query, this.options);
    return rows.length;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
  catch(reject) {
    return this.execute().catch(reject);
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
    const seed = await firestoreDb.find(collectionName, {});
    return runPipeline(seed, pipeline);
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
