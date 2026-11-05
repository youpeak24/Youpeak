/**
 * Mongo-style query evaluation for the Firestore compatibility layer (D-01).
 *
 * firestoreDb.find() pushes plain equality pairs down to Firestore. Anything
 * else in a query — $in/$nin/$ne/$gt…/$regex/$exists, $or/$and/$nor — used to
 * be silently dropped, so a filter such as `{ _id: { $in: ids } }` matched the
 * WHOLE collection, and deleteMany/updateMany/countDocuments built on it
 * touched every document. This module evaluates the full query against each
 * candidate document, and throws on an operator it does not implement, so an
 * unsupported filter fails loudly instead of widening to everything.
 */
"use strict";

class UnsupportedQueryOperatorError extends Error {
  constructor(op) {
    super(`Unsupported query operator "${op}" in Firestore compatibility layer`);
    this.name = "UnsupportedQueryOperatorError";
    this.code = "UNSUPPORTED_QUERY_OPERATOR";
  }
}

const FIELD_OPS = new Set(["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$exists", "$regex", "$options", "$size", "$all", "$not", "$elemMatch"]);
const LOGICAL_OPS = new Set(["$or", "$and", "$nor"]);

// ObjectId-like wrappers and populated refs compare by their id string.
function unwrap(v) {
  if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) && !(v instanceof RegExp)) {
    if (typeof v.toHexString === "function") return v.toHexString();
    if (typeof v.toJSON === "function") return v.toJSON();
    if (v._id != null && Object.keys(v).every((k) => !k.startsWith("$"))) return String(v._id);
  }
  return v;
}

function getPath(doc, path) {
  if (doc == null) return undefined;
  if (Object.prototype.hasOwnProperty.call(doc, path)) return doc[path];
  if (!path.includes(".")) return doc[path];
  let cur = doc;
  for (const part of path.split(".")) {
    if (cur == null) return undefined;
    if (Array.isArray(cur) && !/^\d+$/.test(part)) {
      const vals = cur.map((x) => (x == null ? undefined : x[part])).filter((x) => x !== undefined);
      cur = vals.length ? vals.flat() : undefined;
    } else {
      cur = cur[part];
    }
  }
  return cur;
}

function scalarEq(a, b) {
  a = unwrap(a); b = unwrap(b);
  if (a instanceof Date) a = a.toISOString();
  if (b instanceof Date) b = b.toISOString();
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  // Ids are stored as strings but often compared with numbers (legacy
  // epoch-ms ids) or ObjectId wrappers: compare those as strings. Booleans
  // and other mixed types stay strict, like Firestore's own equality.
  if ((typeof a === "string" && typeof b === "number") || (typeof a === "number" && typeof b === "string")) return String(a) === String(b);
  if (typeof a === "object" && typeof b === "object") {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch (_) { return false; }
  }
  return false;
}

// Mongo equality: an array field matches when it contains the value.
function valueEq(fieldValue, target) {
  if (Array.isArray(fieldValue) && !Array.isArray(target)) return fieldValue.some((x) => scalarEq(x, target));
  return scalarEq(fieldValue, target);
}

function cmp(fieldValue, target, test) {
  const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
  return values.some((v) => {
    v = unwrap(v); const t = unwrap(target);
    if (v == null || t == null) return false;
    const a = v instanceof Date ? v.getTime() : v;
    const b = t instanceof Date ? t.getTime() : t;
    // Numbers compare numerically; ISO date strings and other strings compare
    // lexically (which orders ISO timestamps correctly).
    if (typeof a === "number" || typeof b === "number") {
      const na = Number(a), nb = Number(b);
      if (Number.isNaN(na) || Number.isNaN(nb)) return false;
      return test(na, nb);
    }
    return test(String(a), String(b));
  });
}

function toRegExp(pattern, options) {
  if (pattern instanceof RegExp) return options ? new RegExp(pattern.source, options) : pattern;
  return new RegExp(String(pattern), options || "");
}

function isOperatorObject(v) {
  if (!v || typeof v !== "object" || Array.isArray(v) || v instanceof Date || v instanceof RegExp) return false;
  const keys = Object.keys(v);
  return keys.length > 0 && keys.every((k) => k.startsWith("$"));
}

function matchField(fieldValue, cond) {
  if (cond instanceof RegExp) {
    const vals = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
    return vals.some((v) => typeof v === "string" && cond.test(v));
  }
  if (!isOperatorObject(cond)) return valueEq(fieldValue, cond);

  for (const [op, target] of Object.entries(cond)) {
    if (!FIELD_OPS.has(op)) throw new UnsupportedQueryOperatorError(op);
    switch (op) {
      case "$eq": if (!valueEq(fieldValue, target)) return false; break;
      case "$ne": if (valueEq(fieldValue, target)) return false; break;
      case "$gt": if (!cmp(fieldValue, target, (a, b) => a > b)) return false; break;
      case "$gte": if (!cmp(fieldValue, target, (a, b) => a >= b)) return false; break;
      case "$lt": if (!cmp(fieldValue, target, (a, b) => a < b)) return false; break;
      case "$lte": if (!cmp(fieldValue, target, (a, b) => a <= b)) return false; break;
      case "$in": {
        if (!Array.isArray(target)) throw new Error("$in needs an array");
        const ok = target.some((t) => (t instanceof RegExp ? matchField(fieldValue, t) : valueEq(fieldValue, t)));
        if (!ok) return false;
        break;
      }
      case "$nin": {
        if (!Array.isArray(target)) throw new Error("$nin needs an array");
        if (target.some((t) => valueEq(fieldValue, t))) return false;
        break;
      }
      case "$exists": if ((fieldValue !== undefined) !== Boolean(target)) return false; break;
      case "$regex": {
        const re = toRegExp(target, cond.$options);
        const vals = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
        if (!vals.some((v) => typeof v === "string" && re.test(v))) return false;
        break;
      }
      case "$options": break; // consumed by $regex
      case "$size": if (!Array.isArray(fieldValue) || fieldValue.length !== Number(target)) return false; break;
      case "$all": {
        if (!Array.isArray(target) || !Array.isArray(fieldValue)) return false;
        if (!target.every((t) => fieldValue.some((v) => scalarEq(v, t)))) return false;
        break;
      }
      case "$not": if (matchField(fieldValue, target)) return false; break;
      case "$elemMatch": {
        if (!Array.isArray(fieldValue)) return false;
        const ok = fieldValue.some((el) => (el && typeof el === "object" && !isOperatorObject(target) ? matchesQuery(el, target) : matchField(el, target)));
        if (!ok) return false;
        break;
      }
      default: throw new UnsupportedQueryOperatorError(op);
    }
  }
  return true;
}

/** True when `doc` satisfies the Mongo-style `query`. Throws on unsupported operators. */
function matchesQuery(doc, query) {
  if (!query || typeof query !== "object") return true;
  for (const [key, cond] of Object.entries(query)) {
    if (key.startsWith("$")) {
      if (!LOGICAL_OPS.has(key)) throw new UnsupportedQueryOperatorError(key);
      if (!Array.isArray(cond)) throw new Error(`${key} needs an array`);
      if (key === "$or" && !cond.some((c) => matchesQuery(doc, c))) return false;
      if (key === "$and" && !cond.every((c) => matchesQuery(doc, c))) return false;
      if (key === "$nor" && cond.some((c) => matchesQuery(doc, c))) return false;
      continue;
    }
    if (cond === undefined) continue; // Mongo drops undefined filter values
    let fieldValue = getPath(doc, key);
    // Documents always carry their id at the doc path; `id` and `_id` are aliases.
    if (fieldValue === undefined && (key === "_id" || key === "id")) fieldValue = doc && (doc._id ?? doc.id);
    if (cond === null) { if (fieldValue != null) return false; continue; }
    if (!matchField(fieldValue, cond)) return false;
  }
  return true;
}

/** Whether a query has anything beyond plain scalar equality (needs in-memory evaluation). */
function needsInMemoryFilter(query) {
  if (!query || typeof query !== "object") return false;
  for (const [key, v] of Object.entries(query)) {
    if (key.startsWith("$")) return true;
    if (v === undefined) continue;
    if (v === null) return true;
    if (v instanceof RegExp) return true;
    if (typeof v === "object" && !(v instanceof Date)) {
      const u = unwrap(v);
      if (u === v) return true; // operator object or nested document
    }
  }
  return false;
}

/** Throws if the query uses an operator this layer does not implement (validate before any read or write). */
function assertSupported(query) {
  if (!query || typeof query !== "object") return;
  for (const [key, cond] of Object.entries(query)) {
    if (key.startsWith("$")) {
      if (!LOGICAL_OPS.has(key)) throw new UnsupportedQueryOperatorError(key);
      if (!Array.isArray(cond)) throw new Error(`${key} needs an array`);
      cond.forEach(assertSupported);
      continue;
    }
    if (!isOperatorObject(cond)) continue;
    for (const [op, target] of Object.entries(cond)) {
      if (!FIELD_OPS.has(op)) throw new UnsupportedQueryOperatorError(op);
      if (op === "$not" && isOperatorObject(target)) assertSupported({ [key]: target });
      if (op === "$elemMatch" && target && typeof target === "object") {
        if (isOperatorObject(target)) assertSupported({ [key]: target }); else assertSupported(target);
      }
    }
  }
}

module.exports = { matchesQuery, needsInMemoryFilter, assertSupported, unwrap, getPath, UnsupportedQueryOperatorError };
