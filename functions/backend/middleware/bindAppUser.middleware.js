/**
 * requireAppUser() for the older client routes that read `userId` from the
 * body or query string.
 *
 * The shared `key` header is compiled into the app and the admin panel's
 * public JavaScript, so anyone can send it. On these routes a body/query
 * `userId` let a caller act as any user — file a withdrawal against their
 * balance to a different UPI ID, deactivate the account, change its profile,
 * spend its coins or attach it to a referral code.
 *
 * This verifies the Firebase ID token (middleware/appUser.middleware.js) and
 * then overwrites `userId` in both the body and the query with the token's
 * user, so the existing controllers keep working unchanged. A request that
 * names a different user is refused rather than silently rewritten.
 */
"use strict";

const requireAppUser = require("./appUser.middleware");

module.exports = function bindAppUser() {
  const auth = requireAppUser();
  return (req, res, next) =>
    auth(req, res, () => {
      const claimed = (req.body && req.body.userId) || (req.query && req.query.userId);
      if (claimed && String(claimed) !== req.appUserId) {
        return res.status(403).json({ status: false, code: "USER_MISMATCH", message: "You can only do this for your own account." });
      }
      if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) req.body.userId = req.appUserId;
      req.query.userId = req.appUserId;
      return next();
    });
};
