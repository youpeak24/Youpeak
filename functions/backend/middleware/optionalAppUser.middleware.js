/**
 * Viewer identity for browse routes (feeds, search, video/channel pages,
 * comments) that work for signed-in users and must not trust a
 * caller-chosen userId (F-18).
 *
 *   • Authorization: Bearer <Firebase ID token>  → verified like bindAppUser():
 *     userId in body/query is forced to the token's user; a different userId → 403.
 *   • No bearer token → the caller is anonymous: any body/query userId is
 *     REMOVED, so the shared (public) app key can no longer read another
 *     user's personalised state (likes, subscriptions, unlocks) or act as them.
 *     Handlers that require a userId then answer "invalid details".
 */
"use strict";

const checkAccess = require("../checkAccess");
const bindAppUser = require("./bindAppUser.middleware");

module.exports = function optionalAppUser() {
  const checkKey = checkAccess();
  const bound = bindAppUser();
  return (req, res, next) => {
    if (/^Bearer\s+\S/i.test(req.get("authorization") || "")) return bound(req, res, next);
    return checkKey(req, res, () => {
      if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) delete req.body.userId;
      if (req.query) delete req.query.userId;
      req.appUserId = undefined;
      return next();
    });
  };
};
