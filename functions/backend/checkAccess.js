// Shared-secret gate for client API routes.
// The key must be provided via the `secretKey` env var (see .env.example).
// The Flutter app and admin web send it in the `key` header.
module.exports = () => {
  return (req, res, next) => {
    const provided = req.headers.key || req.headers.secretkey || req.body?.key || req.query?.key;
    const expected = process.env.secretKey;

    if (!expected) {
      console.error("checkAccess: secretKey env var is not set — refusing all requests.");
      return res.status(500).json({ status: false, error: "Server auth not configured" });
    }

    if (provided && provided === expected) {
      return next();
    }
    return res.status(401).json({ status: false, error: "Unauthorized access!" });
  };
};
