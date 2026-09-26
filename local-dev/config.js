// Shared settings for the local admin-panel stack (start.js + seed.js).
"use strict";

const path = require("path");

const ROOT = path.resolve(__dirname, "..");

module.exports = {
  ROOT,
  BACKEND_DIR: path.join(ROOT, "functions", "backend"),
  FRONTEND_DIR: path.join(ROOT, "admin", "frontend"),
  DATA_DIR: path.join(__dirname, "emulator-data"),

  // "demo-" projects are emulator-only: the Firebase CLI never touches a real project for them.
  PROJECT_ID: "demo-youpeak-local",

  FRONTEND_PORT: 3055,
  BACKEND_PORT: 5055,
  FIRESTORE_PORT: 8095,
  EMULATOR_UI_PORT: 4005,

  // Local-only values; they protect nothing real.
  SECRET_KEY: "youpeak-local-dev-key",
  JWT_SECRET: "youpeak-local-dev-jwt-secret",

  PASSWORD: "Test@1234",
  ACCOUNTS: {
    super: { email: "superadmin@youpeak.test", label: "Super Admin" },
    district: { email: "district@youpeak.test", label: "District Partner (Franchise)" },
    partner: { email: "partner@youpeak.test", label: "Digital Partner" },
  },
  AGENCY_ID: "agency_trichy_01",
  PARTNER_USER_ID: "user_103",
};
