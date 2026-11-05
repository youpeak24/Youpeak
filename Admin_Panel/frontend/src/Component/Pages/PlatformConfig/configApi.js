import axios from "axios";

// Platform Config (functions/backend/controllers/admin/platformConfig.controller.js)
export const fetchPlatformConfig = () => axios.get("admin/platformConfig").then((r) => r.data);

export const savePlatformConfigSection = (sectionKey, values) =>
  axios.patch(`admin/platformConfig/${sectionKey}`, { values }).then((r) => r.data);

export const fetchConfigHistory = (sectionKey, limit = 10) =>
  axios.get("admin/platformConfig/history", { params: { section: sectionKey, limit } }).then((r) => r.data);

// Tier ladders (membershipTiers collection)
export const fetchTiers = (tierType) =>
  axios.get("admin/membershipTier/getTiers", { params: { tierType } }).then((r) => r.data);

export const fetchDefaultTiers = (tierType) =>
  axios.get("admin/membershipTier/defaults", { params: { tierType } }).then((r) => r.data);

export const saveTier = (tier) => axios.post("admin/membershipTier/store", tier).then((r) => r.data);
