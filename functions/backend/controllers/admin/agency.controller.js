const db = require("../../util/connection");
const bcrypt = require("bcryptjs");

// Every response below was returning the agency's bcrypt password hash
// straight from the Firestore doc — never send it back, hashed or not.
function sanitizeAgency(agency) {
  if (!agency) return agency;
  const { password, ...rest } = agency;
  return rest;
}

// Create agency
exports.store = async (req, res) => {
  try {
    const {
      name,
      code,
      email,
      password,
      mobileNumber,
      commissionRatePercentage,
      state,
      district,
      cities,
      zipCodes,
      geofenceCenter,
      radiusKm,
    } = req.body;

    if (!name || !code || !email || !password) {
      return res.status(200).json({ status: false, message: "Please fill all required fields!" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const existEmail = await db.findOne("agencies", { email: cleanEmail });
    const existCode = await db.findOne("agencies", { code: cleanCode });

    if (existEmail || existCode) {
      return res.status(200).json({ status: false, message: "Agency code or email already exists!" });
    }

    const encryptedPassword = bcrypt.hashSync(password.trim(), 10);
    const agencyId = "agency_" + Date.now();

    const agencyData = {
      _id: agencyId,
      name: name.trim(),
      code: cleanCode,
      email: cleanEmail,
      password: encryptedPassword,
      mobileNumber: mobileNumber || "",
      commissionRatePercentage: Number(commissionRatePercentage) || 10,
      state: state || "",
      district: district || "",
      cities: cities || [],
      zipCodes: zipCodes || [],
      geofenceCenter: geofenceCenter || { latitude: 0, longitude: 0 },
      radiusKm: Number(radiusKm) || 50,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.create("agencies", agencyData, agencyId);

    // Create Agency Admin user account in admins collection
    const adminData = {
      _id: "admin_" + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: encryptedPassword,
      role: "AGENCY_ADMIN",
      agencyId: agencyId,
      createdAt: new Date().toISOString(),
    };

    await db.create("admins", adminData, adminData._id);

    return res.status(200).json({ status: true, message: "Agency created successfully!", agency: sanitizeAgency(agencyData) });
  } catch (error) {
    console.error("Error creating agency:", error);
    return res.status(200).json({ status: false, message: error.message || "Failed to create agency" });
  }
};

// Get all agencies
exports.getAgencies = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const agencies = await db.find("agencies", {}, { sort: { createdAt: -1 } });
    const count = agencies.length;

    const paginatedAgencies = agencies.slice((start - 1) * limit, start * limit).map(sanitizeAgency);

    return res.status(200).json({ status: true, message: "Agencies fetched successfully!", total: count, agencies: paginatedAgencies });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return res.status(200).json({ status: true, message: "Success", total: 0, agencies: [] });
  }
};

// Update agency
exports.update = async (req, res) => {
  try {
    const { agencyId } = req.query;
    const agency = await db.findById("agencies", agencyId);
    if (!agency) {
      return res.status(200).json({ status: false, message: "Agency not found!" });
    }

    const updatedData = {
      name: req.body.name || agency.name,
      mobileNumber: req.body.mobileNumber || agency.mobileNumber,
      commissionRatePercentage:
        req.body.commissionRatePercentage !== undefined
          ? req.body.commissionRatePercentage
          : agency.commissionRatePercentage,
      state: req.body.state || agency.state,
      district: req.body.district || agency.district,
      cities: req.body.cities || agency.cities,
      zipCodes: req.body.zipCodes || agency.zipCodes,
      geofenceCenter: req.body.geofenceCenter || agency.geofenceCenter,
      radiusKm: req.body.radiusKm !== undefined ? req.body.radiusKm : agency.radiusKm,
    };

    const updatedAgency = await db.update("agencies", agencyId, updatedData);
    return res.status(200).json({ status: true, message: "Agency updated successfully!", agency: sanitizeAgency(updatedAgency) });
  } catch (error) {
    console.error("Error updating agency:", error);
    return res.status(200).json({ status: false, message: error.message || "Failed to update agency" });
  }
};

// Toggle agency active status
exports.toggleStatus = async (req, res) => {
  try {
    const { agencyId } = req.query;
    const agency = await db.findById("agencies", agencyId);
    if (!agency) {
      return res.status(200).json({ status: false, message: "Agency not found!" });
    }

    const newStatus = !agency.isActive;
    await db.update("agencies", agencyId, { isActive: newStatus });

    return res.status(200).json({ status: true, message: "Agency status toggled!", isActive: newStatus });
  } catch (error) {
    console.error("Error toggling agency status:", error);
    return res.status(200).json({ status: false, message: error.message || "Failed to toggle status" });
  }
};
