const express = require("express");
const crypto = require("crypto");
const { normalizeRole } = require("../middleware/auth");
const { signToken, hashPassword, comparePassword } = require("../utils/auth");
const { query } = require("../db");

const router = express.Router();

router.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (role === "guest") {
    return res.json({ data: { role: "guest", user: null, session: null }, message: "Masuk sebagai guest." });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      data: null,
      message: "Auth belum dikonfigurasi. Isi DATABASE_URL dan JWT_SECRET.",
    });
  }
  if (!email || !password) {
    return res.status(400).json({
      data: null,
      message: "Email dan password wajib diisi.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await query(
      "SELECT id, email, nama_lengkap, role, password_hash FROM users WHERE email = $1",
      [normalizedEmail]
    );
    const account = result.rows[0];

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
  } catch (err) {
    console.error("Failed to load account:", err.message);
    return res.status(503).json({ data: null, message: "Akun belum dapat diperiksa." });
  }
});

router.post("/api/auth/register", async (req, res) => {
  const { email, password, nama_lengkap } = req.body;
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      data: null,
      message: "Auth belum dikonfigurasi. Isi DATABASE_URL dan JWT_SECRET.",
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

  try {
    // Cek email duplikat
    const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        data: null,
        message: "Email sudah terdaftar. Silakan masuk.",
      });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    // Buat akun user
    const insertResult = await query(
      `INSERT INTO users (id, email, nama_lengkap, password_hash, role)
       VALUES ($1, $2, $3, $4, 'patient')
       RETURNING id, email, nama_lengkap, role`,
      [id, normalizedEmail, normalizedName, passwordHash]
    );
    const account = insertResult.rows[0];

    // Buat profil pasien otomatis
    const no_rm = `RM-${id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const nik = id.replaceAll("-", "").slice(0, 20);
    try {
      await query(
        `INSERT INTO patients (user_id, no_rm, nik, nama_lengkap, jenis_kelamin, tanggal_lahir)
         VALUES ($1, $2, $3, $4, 'Belum diisi', '1900-01-01')`,
        [account.id, no_rm, nik, account.nama_lengkap]
      );
    } catch (patientErr) {
      // Rollback: hapus user jika patient gagal dibuat
      await query("DELETE FROM users WHERE id = $1", [account.id]);
      console.error("Failed to create patient profile:", patientErr.message);
      return res.status(500).json({
        data: null,
        message: "Akun dibuat, tetapi data pasien gagal dibuat.",
      });
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
  } catch (err) {
    console.error("Failed to create account:", err.message);
    return res.status(500).json({ data: null, message: "Akun gagal dibuat." });
  }
});

module.exports = router;
