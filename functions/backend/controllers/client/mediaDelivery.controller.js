"use strict";
const cloudflare = require("../../util/cloudflareStorage.service");
const { publicR2Origin, r2PublicUrl } = require("../../util/mediaPolicy");

// Legacy API URLs redirect to Cloudflare. Vercel never transports video bytes.
exports.redirect = async (req, res) => {
  try {
    const name = req.params.filename;
    if (!name || /[/\\\x00-\x1f]/.test(name) || name === "." || name === "..") return res.status(400).json({ status: false, message: "Invalid video path." });
    const folder = /\/uploads\/(shorts|bites)\//i.exec(req.path)?.[1]?.toLowerCase() || "videos";
    const key = `${folder}/${name}`;
    const destination = publicR2Origin(cloudflare.r2PublicDomain)
      ? r2PublicUrl(cloudflare.r2PublicDomain, key)
      : await cloudflare.getPresignedUrl(key, 3600);
    if (!destination) return res.status(503).json({ status: false, message: "Video delivery is unavailable." });
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(307, destination);
  } catch (_) {
    return res.status(503).json({ status: false, message: "Video delivery is unavailable." });
  }
};
