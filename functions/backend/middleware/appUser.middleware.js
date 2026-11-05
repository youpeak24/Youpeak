/**
 * Per-user authentication for client routes that move coins or money.
 *
 * The older client routes only check the shared `key` header (checkAccess.js)
 * and take `userId` from the request body — anyone holding the app secret can
 * act as any user. Routes behind requireAppUser() instead derive the user from
 * a Firebase ID token:
 *
 *   Authorization: Bearer <Firebase ID token>
 *
 * The app gets that token by signing in to Firebase with the custom token the
 * login endpoint mints after it has verified the login itself (see
 * userFirestore.controller.js store()), so the token's uid IS the YouPeak
 * user id. A body/query `userId` is never read by these routes.
 */
"use strict";

const admin = require("../util/firebaseAdmin");
const db = require("../util/connection");
const checkAccess = require("../checkAccess");

function unauthorized(res, code, message) {
  return res.status(401).json({ status: false, code, message });
}

module.exports = function requireAppUser() {
  const checkKey = checkAccess();
  return (req, res, next) =>
    checkKey(req, res, async () => {
      try {
        const header = req.get("authorization") || "";
        const match = header.match(/^Bearer\s+(.+)$/i);
        if (!match) return unauthorized(res, "AUTH_REQUIRED", "Please sign in again to continue.");

        let decoded;
        try {
          decoded = await admin.auth().verifyIdToken(match[1].trim());
        } catch (e) {
          return unauthorized(res, "AUTH_INVALID", "Your session has expired. Please sign in again.");
        }

        const user = await db.findById("users", decoded.uid);
        if (!user || user.isActive === false) {
          return unauthorized(res, "AUTH_NO_ACCOUNT", "Account not found. Please sign in again.");
        }
        if (user.isBlock) {
          return res.status(403).json({ status: false, code: "USER_BLOCKED", message: "You are blocked by the admin." });
        }

        req.appUser = user;
        req.appUserId = String(user._id || user.id);
        return next();
      } catch (error) {
        console.error("requireAppUser error:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
      }
    });
};
