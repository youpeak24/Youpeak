"use strict";
// Admin authorization runs on the parent router. Persistence is shared with
// the app so an admin image cannot be reported as saved while only in /tmp.
const files = require("../client/file.controller");
exports.uploadContent = files.uploadContent;
exports.getDirectUploadUrl = files.getDirectUploadUrl;
exports.getCloudflareStreamUploadUrl = files.getStreamUploadUrl;
