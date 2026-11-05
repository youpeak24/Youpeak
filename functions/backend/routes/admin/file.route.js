const route = require("express").Router();
const upload = require("../../util/uploadMiddleware");
const checkAccess = require("../../checkAccess");
const files = require("../../controllers/admin/file.controller");
// Parent router checks admin JWT and scope before this shared-key gate.
route.use(checkAccess());
route.post("/upload-file", upload, files.uploadContent);
route.post("/direct-upload-url", files.getDirectUploadUrl);
route.post("/cloudflare-stream-url", files.getCloudflareStreamUploadUrl);
module.exports = route;
