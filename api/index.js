// Vercel Serverless Function entrypoint with diagnostic error logging
module.exports = (req, res) => {
  // Domain liveness only: no Firebase initialisation or database requests.
  const pathname = String(req.url || "").split("?")[0];
  if ((req.method === "GET" || req.method === "HEAD") &&
      (pathname === "/api/ping" || pathname === "/ping")) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ status: true, service: "youpeak-api", dependenciesChecked: false });
  }
  try {
    const app = require("../functions/backend/index");
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Function Error:", err);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      status: false,
      error: "Vercel Function Error",
      message: "The service is temporarily unavailable. Please try again.",
    });
  }
};
