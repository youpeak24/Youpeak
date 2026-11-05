const route = require("express").Router();
const upload = require("../../util/uploadMiddleware");
const requireAppUser = require("../../middleware/appUser.middleware");
const files = require("../../controllers/client/file.controller");
// Authenticate before accepting file bytes or granting upload capacity.
route.use(requireAppUser());
route.put("/upload-file", upload, files.uploadContent);
route.post("/stream-upload-url", files.getStreamUploadUrl);
route.get("/stream-upload-url", files.getStreamUploadUrl);
route.post("/direct-upload-url", files.getDirectUploadUrl);
route.post("/abandon-upload", files.abandonUpload);
module.exports = route;
