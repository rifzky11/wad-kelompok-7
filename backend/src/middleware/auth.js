const { supabaseAdmin } = require("../db");
const { verifyToken } = require("../utils/auth");

function ensureDb(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({
      data: null,
      message:
        "Database belum dikonfigurasi. Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ada di .env.",
    });
  }
  next();
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

  if (!supabaseAdmin) {
    return res.status(503).json({
      data: null,
      message: "Database auth belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY.",
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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, email, nama_lengkap, role")
      .eq("id", payload.sub)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load user profile:", profileError.message);
      return res.status(503).json({
        data: null,
        message: "Profil pengguna belum dapat dimuat.",
      });
    }

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
  supabaseAdmin,
  ensureDb,
  normalizeRole,
  authenticate,
  allowRoles,
};
