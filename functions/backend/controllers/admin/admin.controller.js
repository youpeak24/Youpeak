const db = require("../../util/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Cryptr = require("cryptr");

// cryptr is kept ONLY to read admin passwords created by older builds.
// New / rotated passwords are bcrypt-hashed.
const legacyCryptr = process.env.secretKey ? new Cryptr(process.env.secretKey) : null;

const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = 10;

function hashPassword(plain) {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

// Verify `plain` against a stored hash that may be bcrypt (new) or cryptr (legacy).
function verifyPassword(plain, stored) {
  if (!stored) return { ok: false, legacy: false };
  if (typeof stored === "string" && stored.startsWith("$2")) {
    return { ok: bcrypt.compareSync(plain, stored), legacy: false };
  }
  if (legacyCryptr) {
    try {
      if (legacyCryptr.decrypt(stored) === plain) return { ok: true, legacy: true };
    } catch (e) { /* not a cryptr value */ }
  }
  if (stored === plain) return { ok: true, legacy: true }; // very old plaintext rows
  return { ok: false, legacy: false };
}

function signAdminToken(admin) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return jwt.sign(
    {
      _id: admin._id || admin.id,
      name: admin.name || "Admin",
      email: admin.email,
      role: admin.role || "AGENCY_ADMIN",
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Admin Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(200).json({ status: false, message: "Email and password are required!" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    let admin = await db.findOne("admins", { email: cleanEmail });

    // One-time bootstrap of the super admin, controlled entirely by env vars.
    // Set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD once, log in, then remove them.
    if (!admin && process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
      if (cleanEmail === process.env.SEED_ADMIN_EMAIL.trim().toLowerCase() &&
          cleanPassword === process.env.SEED_ADMIN_PASSWORD) {
        admin = await db.create("admins", {
          name: "Super Admin",
          email: cleanEmail,
          password: hashPassword(cleanPassword),
          role: "SUPER_ADMIN",
          isActive: true,
        }, "admin_super_01");
      }
    }

    if (!admin) {
      return res.status(200).json({ status: false, message: "Invalid email or password." });
    }
    if (admin.isBlock || admin.isActive === false) {
      return res.status(200).json({ status: false, message: "This admin account is disabled." });
    }

    const check = verifyPassword(cleanPassword, admin.password);
    if (!check.ok) {
      return res.status(200).json({ status: false, message: "Invalid email or password." });
    }

    // Transparently upgrade legacy (cryptr / plaintext) passwords to bcrypt.
    if (check.legacy) {
      try {
        await db.update("admins", admin._id || admin.id, { password: hashPassword(cleanPassword) });
      } catch (e) {
        console.warn("admin login: password re-hash failed:", e.message);
      }
    }

    const token = signAdminToken(admin);
    const safeAdmin = { ...admin };
    delete safeAdmin.password;

    return res.status(200).json({
      status: true,
      message: "Admin Login Successful!",
      token,
      admin: safeAdmin,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Admin Profile
exports.getProfile = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.admin?.id;
    const admin = (await db.findById("admins", adminId)) || req.admin;
    if (!admin) {
      return res.status(404).json({ status: false, message: "Admin not found" });
    }
    const safeAdmin = { ...admin };
    delete safeAdmin.password;
    return res.status(200).json({ status: true, message: "Success", admin: safeAdmin });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Admin Create
exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(200).json({ status: false, message: "Email and password are required" });
    }
    // Only a super admin may create other admins.
    if (req.admin && req.admin.role !== "SUPER_ADMIN") {
      return res.status(403).json({ status: false, message: "Only a super admin can create admin accounts" });
    }
    const newAdmin = await db.create("admins", {
      name,
      email: String(email).trim().toLowerCase(),
      password: hashPassword(password),
      role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "AGENCY_ADMIN",
      agencyId: req.body.agencyId || null,
      isActive: true,
    });
    delete newAdmin.password;
    return res.status(200).json({ status: true, message: "Admin created successfully", admin: newAdmin });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Admin Update
exports.update = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.admin?.id;
    const updated = await db.update("admins", adminId, req.body);
    return res.status(200).json({ status: true, message: "Admin updated successfully", admin: updated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  return res.status(200).json({ status: true, message: "Password reset instructions sent" });
};

// Update Password
exports.updatePassword = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.admin?.id;
    const { oldPassword, newPassword } = req.body;
    const admin = await db.findById("admins", adminId);
    if (!admin) return res.status(200).json({ status: false, message: "Admin not found" });

    if (!verifyPassword(oldPassword, admin.password).ok) {
      return res.status(200).json({ status: false, message: "Old password does not match" });
    }

    await db.update("admins", adminId, { password: hashPassword(newPassword) });
    return res.status(200).json({ status: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Set Password
exports.setPassword = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.admin?.id;
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(200).json({ status: false, message: "Password must be at least 8 characters" });
    }
    await db.update("admins", adminId, { password: hashPassword(newPassword) });
    return res.status(200).json({ status: true, message: "Password set successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
