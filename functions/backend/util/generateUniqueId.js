"use strict";
const db = require("./connection");

// generate uniqueId of the user (pure Firestore)
const generateUniqueId = async () => {
  const random = () => {
    return Math.floor(Math.random() * (999999999 - 100000000)) + 100000000;
  };

  let uniqueId = random();
  let user = await db.findOne("users", { uniqueId: uniqueId });
  while (user) {
    uniqueId = random();
    user = await db.findOne("users", { uniqueId: uniqueId });
  }

  // Schema (and every client model) declares uniqueId as a String — return
  // that, not the raw number, or every profile-parsing screen throws a
  // type-mismatch error on it.
  return String(uniqueId);
};

module.exports = { generateUniqueId };
