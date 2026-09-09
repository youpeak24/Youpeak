const firestoreDb = require("./firestoreDb.service");

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

  ModelConstructor.updateOne = async function (query, updateData) {
    const id = query._id || query.id;
    if (id) {
      return await firestoreDb.update(collectionName, id, updateData.$set || updateData);
    }
    const existing = await firestoreDb.findOne(collectionName, query);
    if (existing) {
      return await firestoreDb.update(collectionName, existing._id || existing.id, updateData.$set || updateData);
    }
    return null;
  };

  ModelConstructor.updateMany = async function (query, updateData) {
    const items = await firestoreDb.find(collectionName, query);
    const updated = [];
    for (const item of items) {
      const res = await firestoreDb.update(collectionName, item._id || item.id, updateData.$set || updateData);
      updated.push(res);
    }
    return updated;
  };

  ModelConstructor.findByIdAndUpdate = async function (id, updateData, options = {}) {
    const payload = updateData.$set ? { ...updateData.$set } : { ...updateData };
    if (updateData.$inc) {
      const existing = await firestoreDb.findById(collectionName, id);
      if (existing) {
        Object.keys(updateData.$inc).forEach(key => {
          payload[key] = (Number(existing[key]) || 0) + Number(updateData.$inc[key]);
        });
      }
    }
    return await firestoreDb.update(collectionName, id, payload);
  };

  ModelConstructor.findOneAndUpdate = async function (query, updateData, options = {}) {
    const existing = await firestoreDb.findOne(collectionName, query);
    if (!existing) return null;
    const id = existing._id || existing.id;
    const payload = updateData.$set ? { ...updateData.$set } : { ...updateData };
    if (updateData.$inc) {
      Object.keys(updateData.$inc).forEach(key => {
        payload[key] = (Number(existing[key]) || 0) + Number(updateData.$inc[key]);
      });
    }
    return await firestoreDb.update(collectionName, id, payload);
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
