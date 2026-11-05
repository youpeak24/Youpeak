"use strict";
const db = require("./connection");

const getGlobalLanguageVersion = async () => {
  try {
    let versionObj = await db.findOne("globalLanguageVersions", {});
    return versionObj?.version || 1;
  } catch (error) {
    return 1;
  }
};

const incrementGlobalLanguageVersion = async () => {
  try {
    let versionObj = await db.findOne("globalLanguageVersions", {});
    if (!versionObj) {
      await db.create("globalLanguageVersions", { version: 2 });
      return 2;
    } else {
      const newVersion = (versionObj.version || 1) + 1;
      await db.update("globalLanguageVersions", versionObj._id || versionObj.id, { version: newVersion });
      return newVersion;
    }
  } catch (error) {
    return 1;
  }
};

module.exports = { getGlobalLanguageVersion, incrementGlobalLanguageVersion };
