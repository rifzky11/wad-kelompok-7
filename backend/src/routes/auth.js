const express = require("express");
const crypto = require("crypto");
const {
  supabase,
  normalizeRole,
} = require("../middleware/auth");
const {
  signToken,
  hashPassword,
  comparePassword,
} = require("../utils/auth");

const router = express.Router();

router.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (role === "guest") {
    return res.json({ data: { role: "guest", user: null, session: null }, message: "Masuk sebagai guest." });
  }
  if (!supabase || !process.env.JWT_SECRET) {
    return res.status(503).json({
      data: null,
      message: "Auth belum dikonfigurasi. Isi SUPABASE_URL, SUPABASE_ANON_KEY, dan JWT_SECRET.",
    });
  }
  if (!email || !password) {
    return res.status(400).json({
      data: null,
      message: "Email dan password wajib diisi.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: account, error } = await supabase
    .from("users")
    .select("id, email, nama_lengkap, role, password_hash")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("Failed to load account:", error.message);
    return res.status(503).json({ data: null, message: "Akun belum dapat diperiksa." });
  }

  if (!account || !(await comparePassword(password, account.password_hash))) {
    return res.status(401).json({
      data: null,
      message: "Email atau password tidak valid.",
    });
  }

  const profile = {
    id: account.id,
    email: account.email,
    nama_lengkap: account.nama_lengkap,
    role: normalizeRole(account.role),
  };
  const user = {
    id: account.id,
    email: account.email,
    user_metadata: { nama_lengkap: account.nama_lengkap },
  };
  const accessToken = signToken({ sub: account.id, role: profile.role });
  const userRole = profile.role;
  res.json({
    data: {
      role: userRole,
      user,
      profile,
      session: { access_token: accessToken },
    },
    message: "Login berhasil.",
  });
});

router.post("/api/auth/register", async (req, res) => {
  const { email, password, nama_lengkap } = req.body;
  if (!supabase || !process.env.JWT_SECRET) {
    return res.status(503).json({
      data: null,
      message: "Auth belum dikonfigurasi. Isi SUPABASE_URL, SUPABASE_ANON_KEY, dan JWT_SECRET.",
    });
  }
  if (!email || !password || !nama_lengkap) {
    return res.status(400).json({ data: null, message: "Nama, email, dan password wajib diisi." });
  }
  if (password.length < 6) {
    return res.status(400).json({ data: null, message: "Password minimal terdiri dari 6 karakter." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = nama_lengkap.trim();
  const { data: existingAccount, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check existing account:", existingError.message);
    return res.status(503).json({ data: null, message: "Akun belum dapat diperiksa." });
  }
  if (existingAccount) {
    return res.status(409).json({
      data: null,
      message: "Email sudah terdaftar. Silakan masuk.",
    });
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const { data: account, error } = await supabase
    .from("users")
    .insert({
      id,
      email: normalizedEmail,
      nama_lengkap: normalizedName,
      password_hash: passwordHash,
      role: "patient",
    })
    .select("id, email, nama_lengkap, role")
    .single();

  if (error) {
    console.error("Failed to create account:", error.message);
    if (
      error.code === "23503" &&
      error.message.includes("users_id_fkey")
    ) {
      return res.status(503).json({
        data: null,
        code: "AUTH_SCHEMA_USES_SUPABASE_AUTH",
        message:
          "Database masih memakai foreign key Supabase Auth. Jalankan ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey di Supabase SQL Editor.",
      });
    }

    const { error: patientError } = await supabase.from("patients").insert({
      user_id: account.id,
      no_rm: `RM-${account.id.slice(0, 8)}`,
      nik: account.id.replaceAll("-", "").slice(0, 20),
      nama_lengkap: account.nama_lengkap,
      jenis_kelamin: "Belum diisi",
      tanggal_lahir: "1900-01-01",
    });

    if (patientError) {
      await supabase.from("users").delete().eq("id", account.id);
      console.error("Failed to create patient profile:", patientError.message);
      return res.status(500).json({
        data: null,
        message: "Akun dibuat, tetapi data pasien gagal dibuat.",
      });
    }
    if (
      error.code === "PGRST204" &&
      error.message.includes("password_hash")
    ) {
      return res.status(503).json({
        data: null,
        code: "AUTH_SCHEMA_OUTDATED",
        message:
          "Database belum diperbarui. Jalankan ALTER TABLE public.users ADD COLUMN password_hash TEXT di Supabase SQL Editor.",
      });
    }
    return res.status(500).json({ data: null, message: "Akun gagal dibuat." });
  }

  const profile = {
    id: account.id,
    email: account.email,
    nama_lengkap: account.nama_lengkap,
    role: account.role,
  };
  const user = {
    id: account.id,
    email: account.email,
    user_metadata: { nama_lengkap: account.nama_lengkap },
  };
  const accessToken = signToken({ sub: account.id, role: account.role });
  res.status(201).json({
    data: {
      role: "patient",
      user,
      profile,
      session: { access_token: accessToken },
    },
    message: "Registrasi dan login berhasil.",
  });
});

module.exports = router;
