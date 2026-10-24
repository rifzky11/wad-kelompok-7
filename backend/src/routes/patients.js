const express = require("express");
const { supabase, authenticate, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/api/patients", authenticate, allowRoles("admin"), async (req, res) => {
  const { data, error } = await supabase.from("patients").select("*").order("id", { ascending: true });
  if (error?.code === "PGRST205") {
    return res.status(503).json({
      data: null,
      code: "PATIENTS_TABLE_MISSING",
      message:
        "Tabel patients belum tersedia. Jalankan schema.js di Supabase SQL Editor.",
    });
  }
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Daftar pasien berhasil diambil." });
});

router.get("/api/patients/me", authenticate, allowRoles("patient"), async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", req.auth.user.id)
    .maybeSingle();
  if (error) return res.status(500).json({ data: null, message: error.message });
  if (!data) return res.status(404).json({ data: null, message: "Profil pasien belum terdaftar." });
  res.json({ data, message: "Profil pasien berhasil diambil." });
});

router.post("/api/patients/me", authenticate, allowRoles("patient"), async (req, res) => {
  const required = ["nik", "nama_lengkap", "jenis_kelamin", "tanggal_lahir"];
  if (required.some((field) => !String(req.body[field] || "").trim())) {
    return res.status(400).json({ data: null, message: "Data identitas pasien belum lengkap." });
  }

  const { data: existing, error: existingError } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", req.auth.user.id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ data: null, message: existingError.message });
  if (existing) return res.status(409).json({ data: null, message: "Profil pasien sudah terdaftar." });

  const payload = {
    user_id: req.auth.user.id,
    no_rm: `RM-${req.auth.user.id.replaceAll("-", "").slice(0, 10).toUpperCase()}`,
    nik: String(req.body.nik).trim(),
    nama_lengkap: String(req.body.nama_lengkap).trim(),
    jenis_kelamin: String(req.body.jenis_kelamin).trim(),
    tanggal_lahir: req.body.tanggal_lahir,
    no_telp: req.body.no_telp ? String(req.body.no_telp).trim() : null,
    alamat: req.body.alamat ? String(req.body.alamat).trim() : null,
  };
  const { data, error } = await supabase.from("patients").insert(payload).select().single();
  if (error) {
    if (error.code === "23505") return res.status(409).json({ data: null, message: "NIK atau nomor rekam medis sudah digunakan." });
    return res.status(500).json({ data: null, message: error.message });
  }
  res.status(201).json({ data, message: "Profil pasien berhasil didaftarkan." });
});

router.get("/api/patients/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*, appointments(*)")
    .eq("id", req.params.id)
    .single();
  if (error?.code === "PGRST116") {
    return res.status(404).json({ data: null, message: "Pasien tidak ditemukan." });
  }
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Detail pasien berhasil diambil." });
});

router.post("/api/patients", authenticate, allowRoles("admin"), async (req, res) => {
  const required = ["no_rm", "nik", "nama_lengkap", "jenis_kelamin", "tanggal_lahir"];
  if (required.some((field) => !req.body[field])) {
    return res.status(400).json({ data: null, message: "Data identitas pasien belum lengkap." });
  }

  const fields = ["no_rm", "nik", "nama_lengkap", "jenis_kelamin", "tanggal_lahir", "no_telp", "alamat"];
  const payload = Object.fromEntries(fields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
  const { data, error } = await supabase.from("patients").insert([payload]).select().single();
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.status(201).json({ data, message: "Pasien berhasil didaftarkan." });
});

router.put("/api/patients/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const fields = ["no_rm", "nik", "nama_lengkap", "jenis_kelamin", "tanggal_lahir", "no_telp", "alamat"];
  const payload = Object.fromEntries(fields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
  if (!Object.keys(payload).length) {
    return res.status(400).json({ data: null, message: "Tidak ada data yang diubah." });
  }
  const { data, error } = await supabase.from("patients").update(payload).eq("id", req.params.id).select().single();
  if (error?.code === "PGRST116") return res.status(404).json({ data: null, message: "Pasien tidak ditemukan." });
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Data pasien berhasil diperbarui." });
});

router.delete("/api/patients/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const { data, error } = await supabase.from("patients").delete().eq("id", req.params.id).select().single();
  if (error?.code === "PGRST116") return res.status(404).json({ data: null, message: "Pasien tidak ditemukan." });
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Pasien berhasil dihapus." });
});

module.exports = router;
