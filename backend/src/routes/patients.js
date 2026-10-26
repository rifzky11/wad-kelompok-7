const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const { query } = require("../db");

const router = express.Router();

router.get("/api/patients", authenticate, allowRoles("admin"), async (req, res) => {
  try {
    const result = await query("SELECT * FROM patients ORDER BY id ASC");
    res.json({ data: result.rows, message: "Daftar pasien berhasil diambil." });
  } catch (err) {
    console.error("Get patients error:", err.message);
    res.status(500).json({ data: null, message: err.message });
  }
});

router.get("/api/patients/me", authenticate, allowRoles("patient"), async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM patients WHERE user_id = $1",
      [req.auth.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, message: "Profil pasien belum terdaftar." });
    }
    res.json({ data: result.rows[0], message: "Profil pasien berhasil diambil." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

router.post("/api/patients/me", authenticate, allowRoles("patient"), async (req, res) => {
  const required = ["nik", "nama_lengkap", "jenis_kelamin", "tanggal_lahir"];
  if (required.some((field) => !String(req.body[field] || "").trim())) {
    return res.status(400).json({ data: null, message: "Data identitas pasien belum lengkap." });
  }

  try {
    // Cek apakah profil sudah ada
    const existing = await query("SELECT id FROM patients WHERE user_id = $1", [req.auth.user.id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ data: null, message: "Profil pasien sudah terdaftar." });
    }

    const no_rm = `RM-${req.auth.user.id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const result = await query(
      `INSERT INTO patients (user_id, no_rm, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, no_telp, alamat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.auth.user.id,
        no_rm,
        String(req.body.nik).trim(),
        String(req.body.nama_lengkap).trim(),
        String(req.body.jenis_kelamin).trim(),
        req.body.tanggal_lahir,
        req.body.no_telp ? String(req.body.no_telp).trim() : null,
        req.body.alamat ? String(req.body.alamat).trim() : null,
      ]
    );
    res.status(201).json({ data: result.rows[0], message: "Profil pasien berhasil didaftarkan." });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ data: null, message: "NIK atau nomor rekam medis sudah digunakan." });
    }
    res.status(500).json({ data: null, message: err.message });
  }
});

router.get("/api/patients/:id", authenticate, allowRoles("admin"), async (req, res) => {
  try {
    const patientResult = await query("SELECT * FROM patients WHERE id = $1", [req.params.id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ data: null, message: "Pasien tidak ditemukan." });
    }
    const patient = patientResult.rows[0];

    const apptResult = await query(
      "SELECT * FROM appointments WHERE patient_id = $1 ORDER BY created_at DESC",
      [patient.id]
    );
    patient.appointments = apptResult.rows;

    res.json({ data: patient, message: "Detail pasien berhasil diambil." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

router.post("/api/patients", authenticate, allowRoles("admin"), async (req, res) => {
  const required = ["no_rm", "nik", "nama_lengkap", "jenis_kelamin", "tanggal_lahir"];
  if (required.some((field) => !req.body[field])) {
    return res.status(400).json({ data: null, message: "Data identitas pasien belum lengkap." });
  }

  try {
    const result = await query(
      `INSERT INTO patients (no_rm, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, no_telp, alamat)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.body.no_rm,
        req.body.nik,
        req.body.nama_lengkap,
        req.body.jenis_kelamin,
        req.body.tanggal_lahir,
        req.body.no_telp || null,
        req.body.alamat || null,
      ]
    );
    res.status(201).json({ data: result.rows[0], message: "Pasien berhasil didaftarkan." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

router.put("/api/patients/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const fields = ["no_rm", "nik", "nama_lengkap", "jenis_kelamin", "tanggal_lahir", "no_telp", "alamat"];
  const updates = Object.fromEntries(
    fields.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]])
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ data: null, message: "Tidak ada data yang diubah." });
  }

  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

  try {
    const result = await query(
      `UPDATE patients SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, message: "Pasien tidak ditemukan." });
    }
    res.json({ data: result.rows[0], message: "Data pasien berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

router.delete("/api/patients/:id", authenticate, allowRoles("admin"), async (req, res) => {
  try {
    const result = await query("DELETE FROM patients WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, message: "Pasien tidak ditemukan." });
    }
    res.json({ data: result.rows[0], message: "Pasien berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

module.exports = router;
