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
// Loose equality: strict first, then compare stringified forms so an ObjectId
// instance / string / number match the way Mongo would.
function looseEq(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function matchStage(rows, cond) {
  return rows.filter((item) => {
    for (const [k, v] of Object.entries(cond || {})) {
      if (k === "$or") { if (!v.some((c) => matchStage([item], c).length)) return false; continue; }
      if (k === "$and") { if (!v.every((c) => matchStage([item], c).length)) return false; continue; }
      const val = item[k];
      if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).some((kk) => kk.startsWith("$"))) {
        for (const [op, t] of Object.entries(v)) {
          if (op === "$ne" && looseEq(val, t)) return false;
          if (op === "$eq" && !looseEq(val, t)) return false;
          if (op === "$gte" && !(val >= t)) return false;
          if (op === "$gt" && !(val > t)) return false;
          if (op === "$lte" && !(val <= t)) return false;
          if (op === "$lt" && !(val < t)) return false;
          if (op === "$in" && !(Array.isArray(t) && t.some((x) => looseEq(x, val)))) return false;
          if (op === "$nin" && Array.isArray(t) && t.some((x) => looseEq(x, val))) return false;
          if (op === "$exists" && (t ? val === undefined : val !== undefined)) return false;
          if (op === "$regex") {
            try {
              const re = t instanceof RegExp ? t : new RegExp(t, v.$options || "");
              if (!re.test(val == null ? "" : String(val))) return false;
            } catch (e) { /* bad regex -> no match */ return false; }
          }
        }
      } else if (!looseEq(val, v)) {
        return false;
      }
    }
    return true;
  });
}

function getPath(doc, path) {
  if (doc == null) return undefined;
  if (path.indexOf(".") === -1) return doc[path];
  return path.split(".").reduce((o, seg) => {
    if (o == null) return undefined;
    // Mongo: "arr.field" over an array of objects -> array of field values.
    if (Array.isArray(o)) return o.map((el) => (el == null ? undefined : el[seg]));
    return o[seg];
  }, doc);
}

// Evaluate a Mongo aggregation expression against a document (+ $$ vars scope).
// Unknown operators return null rather than leaking the literal {$op:...} object.
function evalExpr(expr, doc, vars) {
  if (expr == null) return expr;
  if (typeof expr === "string") {
    if (expr.startsWith("$$")) {
      const name = expr.slice(2);
      if (name === "ROOT") return doc;
      if (name === "NOW") return new Date();
      return vars ? getPath(vars, name) : undefined;
    }
    if (expr.startsWith("$")) return getPath(doc, expr.slice(1));
    return expr;
  }
  if (Array.isArray(expr)) return expr.map((e) => evalExpr(e, doc, vars));
  if (typeof expr !== "object") return expr;

  const keys = Object.keys(expr);
  const opKey = keys.find((k) => k.startsWith("$"));
  if (!opKey) {
    // plain object literal — evaluate each value
    const o = {};
    for (const [k, v] of Object.entries(expr)) o[k] = evalExpr(v, doc, vars);
    return o;
  }
  const a = expr[opKey];
  const E = (x) => evalExpr(x, doc, vars);
  const num = (x) => { const n = Number(E(x)); return Number.isFinite(n) ? n : 0; };
  const arr = (x) => { const v = E(x); return Array.isArray(v) ? v : []; };
  switch (opKey) {
    case "$literal": return a;
    case "$ifNull": { for (let i = 0; i < a.length - 1; i++) { const v = E(a[i]); if (v !== undefined && v !== null) return v; } return E(a[a.length - 1]); }
    case "$arrayElemAt": { const l = arr(a[0]); const i = num(a[1]); return i < 0 ? l[l.length + i] : l[i]; }
    case "$first": return arr(a)[0];
    case "$last": { const l = arr(a); return l[l.length - 1]; }
    case "$size": return arr(a).length;
    case "$isArray": return Array.isArray(E(a));
    case "$concat": return a.map((x) => { const v = E(x); return v == null ? "" : String(v); }).join("");
    case "$toString": { const v = E(a); return v == null ? "" : String(v); }
    case "$toInt": case "$toLong": return Math.trunc(num(a));
    case "$toDouble": case "$toDecimal": return num(a);
    case "$toBool": return Boolean(E(a));
    case "$toDate": { const v = E(a); const d = v instanceof Date ? v : new Date(v); return isNaN(d) ? null : d; }
    case "$year": { const d = new Date(E(a)); return isNaN(d) ? null : d.getFullYear(); }
    case "$floor": return Math.floor(num(a));
    case "$ceil": return Math.ceil(num(a));
    case "$round": case "$trunc": return Math.trunc(num(a));
    case "$abs": return Math.abs(num(a));
    case "$add": return (Array.isArray(a) ? a : [a]).reduce((s, x) => s + num(x), 0);
    case "$multiply": return (Array.isArray(a) ? a : [a]).reduce((s, x) => s * num(x), 1);
    case "$subtract": return num(a[0]) - num(a[1]);
    case "$divide": { const d = num(a[1]); return d === 0 ? null : num(a[0]) / d; }
    case "$mod": { const d = num(a[1]); return d === 0 ? null : num(a[0]) % d; }
    case "$eq": return looseEq(E(a[0]), E(a[1]));
    case "$ne": return !looseEq(E(a[0]), E(a[1]));
    case "$gt": return num(a[0]) > num(a[1]);
    case "$gte": return num(a[0]) >= num(a[1]);
    case "$lt": return num(a[0]) < num(a[1]);
    case "$lte": return num(a[0]) <= num(a[1]);
    case "$and": return a.every((x) => Boolean(E(x)));
    case "$or": return a.some((x) => Boolean(E(x)));
    case "$not": return !E(Array.isArray(a) ? a[0] : a);
    case "$in": { const l = E(a[1]); return Array.isArray(l) && l.some((x) => looseEq(x, E(a[0]))); }
    case "$cond": {
      const c = Array.isArray(a) ? { if: a[0], then: a[1], else: a[2] } : a;
      return E(c.if) ? E(c.then) : E(c.else);
    }
    case "$switch": {
      for (const b of a.branches || []) if (E(b.case)) return E(b.then);
      return a.default !== undefined ? E(a.default) : null;
    }
    case "$let": {
      const scope = { ...(vars || {}) };
      for (const [k, v] of Object.entries(a.vars || {})) scope[k] = evalExpr(v, doc, vars);
      return evalExpr(a.in, doc, scope);
    }
    case "$map": {
      const input = arr(a.input); const as = a.as || "this";
      return input.map((el) => evalExpr(a.in, doc, { ...(vars || {}), [as]: el }));
    }
    case "$filter": {
      const input = arr(a.input); const as = a.as || "this";
      return input.filter((el) => Boolean(evalExpr(a.cond, doc, { ...(vars || {}), [as]: el })));
    }
    case "$mergeObjects": return Object.assign({}, ...(Array.isArray(a) ? a : [a]).map((x) => E(x) || {}));
    case "$dateDiff": case "$timeDiff": case "$dateToString": return null;
    default: return null;
  }
}

function applyLookup(results, stage, foreign) {
  const { from, localField, foreignField, as, pipeline: sub } = stage.$lookup;
  const key = firestoreDb.normalizeCollectionName(from);
  const frows = foreign[key] || foreign[from] || [];
  return results.map((r) => {
    const lv = getPath(r, localField);
    let matches = frows.filter((fr) => {
      const fv = getPath(fr, foreignField);
      return Array.isArray(lv) ? lv.some((x) => looseEq(x, fv)) : looseEq(lv, fv);
    });
    if (Array.isArray(sub) && sub.length) matches = runPipeline(matches, sub, foreign);
    return { ...r, [as]: matches };
  });
}

function applyUnwind(results, stage) {
  const spec = stage.$unwind;
  const path = (typeof spec === "string" ? spec : spec.path).replace(/^\$/, "");
  const keepEmpty = typeof spec === "object" && spec.preserveNullAndEmptyArrays;
  const out = [];
  for (const r of results) {
    const v = getPath(r, path);
    if (Array.isArray(v)) {
      if (v.length) { for (const el of v) out.push({ ...r, [path]: el }); }
      else if (keepEmpty) out.push({ ...r, [path]: null });
    } else if (v !== undefined && v !== null) {
      out.push(r);
    } else if (keepEmpty) {
      out.push({ ...r, [path]: null });
    }
  }
  return out;
}

function runPipeline(rows, pipeline, foreign = {}) {
  let results = Array.isArray(rows) ? rows.slice() : [];
  for (const stage of pipeline || []) {
    if (stage.$match) results = matchStage(results, stage.$match);
    else if (stage.$sort) {
      const keys = Object.keys(stage.$sort);
      results.sort((a, b) => {
        for (const k of keys) {
          const dir = stage.$sort[k] === -1 ? -1 : 1;
          const av = a[k], bv = b[k];
          if (av === bv) continue;
          if (av === undefined) return 1;
          if (bv === undefined) return -1;
          return (av > bv ? 1 : -1) * dir;
        }
        return 0;
      });
    } else if (stage.$skip) results = results.slice(stage.$skip);
    else if (stage.$limit) results = results.slice(0, stage.$limit);
    else if (stage.$count) results = [{ [stage.$count]: results.length }];
    else if (stage.$facet) {
      const out = {};
      for (const [name, sub] of Object.entries(stage.$facet)) out[name] = runPipeline(results, sub, foreign);
      results = [out];
    } else if (stage.$lookup) {
      results = applyLookup(results, stage, foreign);
    } else if (stage.$unwind) {
      results = applyUnwind(results, stage);
    } else if (stage.$addFields || stage.$set) {
      const add = stage.$addFields || stage.$set;
      results = results.map((r) => ({ ...r, ...resolveComputed(add, r) }));
    } else if (stage.$project) {
      const p = stage.$project;
      const plainIncl = Object.entries(p).filter(([, v]) => v === 1 || v === true).map(([k]) => k);
      // A field set to an expression / "$ref" is also an inclusion in Mongo.
      const computedKeys = Object.entries(p)
        .filter(([, v]) => v !== 0 && v !== false && v !== 1 && v !== true)
        .map(([k]) => k);
      const excl = Object.entries(p).filter(([, v]) => v === 0 || v === false).map(([k]) => k);
      const isInclusion = plainIncl.length > 0 || computedKeys.length > 0;
      results = results.map((r) => {
        if (isInclusion) {
          const o = {};
          for (const k of plainIncl) if (getPath(r, k) !== undefined) o[k] = getPath(r, k);
          if (p._id !== 0 && p._id !== false) o._id = r._id;
          return { ...o, ...resolveComputed(p, r) };
        }
        const o = { ...r };
        for (const k of excl) delete o[k];
        return o;
      });
    } else if (stage.$group) {
      results = groupStage(results, stage.$group);
    }
  }
  return results;
}

// Turn a $project / $addFields spec into concrete fields for one doc.
function resolveComputed(spec, doc) {
  const out = {};
  for (const [k, v] of Object.entries(spec)) {
    if (v === 1 || v === 0 || v === true || v === false) continue; // projection flag
    if (typeof v === "string") { out[k] = v.startsWith("$") ? evalExpr(v, doc) : v; continue; }
    if (v && typeof v === "object") { out[k] = evalExpr(v, doc); continue; }
    out[k] = v;
  }
  return out;
}

// Collect the collections referenced by every $lookup (including inside $facet).
function collectLookupNames(pipeline, set) {
  for (const stage of pipeline || []) {
    if (stage && stage.$lookup && stage.$lookup.from) set.add(stage.$lookup.from);
    if (stage && stage.$facet) for (const sub of Object.values(stage.$facet)) collectLookupNames(sub, set);
    if (stage && stage.$lookup && Array.isArray(stage.$lookup.pipeline)) collectLookupNames(stage.$lookup.pipeline, set);
  }
  return set;
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
    // Pre-load every collection referenced by a $lookup so runPipeline (sync)
    // can resolve joins in memory.
    const names = collectLookupNames(pipeline, new Set());
    const foreign = {};
    await Promise.all(
      [...names].map(async (name) => {
        const key = firestoreDb.normalizeCollectionName(name);
        try { foreign[key] = await firestoreDb.find(key, {}); }
        catch (e) { foreign[key] = []; }
      })
    );
    return runPipeline(seed, pipeline, foreign);
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
