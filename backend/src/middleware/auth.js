const { query } = require("../db");
const { verifyToken } = require("../utils/auth");

async function ensureDb(req, res, next) {
  try {
    await query("SELECT 1");
    next();
  } catch (err) {
    return res.status(503).json({
      data: null,
      message: "Database belum dapat dijangkau. Pastikan DATABASE_URL sudah dikonfigurasi dengan benar di .env.",
    });
  }
}

function normalizeRole(role) {
  const normalizedRole = String(role || "").toLowerCase();
  const roleAliases = {
    guest: "guest",
    patient: "patient",
    admin: "admin",
  };

  return roleAliases[normalizedRole] || "patient";
}

async function authenticate(req, res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ data: null, message: "Autentikasi diperlukan." });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      data: null,
      message: "Auth belum dikonfigurasi. Tambahkan JWT_SECRET.",
    });
  }

  try {
    const payload = verifyToken(token);
    if (!payload?.sub) {
      return res.status(401).json({
        data: null,
        message: "Sesi tidak valid atau sudah kedaluwarsa.",
      });
    }

    const result = await query(
      "SELECT id, email, nama_lengkap, role FROM users WHERE id = $1",
      [payload.sub]
    );
    const profile = result.rows[0];

    if (!profile) {
      return res.status(401).json({
        data: null,
        message: "Akun tidak ditemukan.",
      });
    }

    req.auth = {
      user: {
        id: profile.id,
        email: profile.email,
      },
      profile,
      role: normalizeRole(profile.role),
    };
    next();
  } catch (verificationError) {
    console.error("Failed to verify access token:", verificationError);
    return res.status(503).json({
      data: null,
      message: "Layanan autentikasi sedang tidak tersedia.",
    });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({
        data: null,
        message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
      });
    }
    next();
  };
}

module.exports = {
  ensureDb,
  normalizeRole,
  authenticate,
  allowRoles,
};
