const express = require("express");
const { supabase, authenticate, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/api/appointments", authenticate, allowRoles("patient"), async (req, res) => {
  const { service_id, tanggal_kunjungan, jam_kunjungan, keluhan } = req.body;
  if (!service_id || !tanggal_kunjungan || !jam_kunjungan) {
    return res.status(400).json({ data: null, message: "Layanan, tanggal, dan jam kunjungan wajib diisi." });
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients").select("id").eq("user_id", req.auth.user.id).maybeSingle();
  if (patientError) return res.status(500).json({ data: null, message: patientError.message });
  if (!patient) return res.status(400).json({ data: null, code: "PATIENT_PROFILE_REQUIRED", message: "Lengkapi pendaftaran pasien terlebih dahulu." });

  const { data: service, error: serviceError } = await supabase
    .from("services").select("id, title, price, kuota, category").eq("id", service_id).single();
  if (serviceError?.code === "PGRST116") return res.status(404).json({ data: null, message: "Layanan tidak ditemukan." });
  if (serviceError) return res.status(500).json({ data: null, message: serviceError.message });
  if (service.kuota < 1) return res.status(409).json({ data: null, message: "Kuota layanan sudah habis." });

  const { data: appointment, error } = await supabase.from("appointments")
    .insert({ patient_id: patient.id, service_id, tanggal_kunjungan, jam_kunjungan, keluhan: keluhan || null, status: service.category === "obat" ? "confirmed" : "pending" })
    .select("*, patients(no_rm, nama_lengkap), services(title, price, category)")
    .single();
  if (error) return res.status(500).json({ data: null, message: error.message });

  const { data: quotaUpdate, error: quotaError } = await supabase.from("services")
    .update({ kuota: service.kuota - 1 }).eq("id", service_id).eq("kuota", service.kuota).select("id").maybeSingle();
  if (quotaError) return res.status(500).json({ data: null, message: quotaError.message });
  if (!quotaUpdate) {
    await supabase.from("appointments").delete().eq("id", appointment.id);
    return res.status(409).json({ data: null, message: "Kuota layanan baru saja habis. Silakan pilih layanan lain." });
  }
  res.status(201).json({ data: appointment, message: "Pesanan berhasil dibuat." });
});

router.get("/api/appointments", authenticate, async (req, res) => {
  let query = supabase.from("appointments")
    .select("*, patients(id, no_rm, nama_lengkap, no_telp), services(title, price, category)")
    .order("created_at", { ascending: false });
  if (req.auth.role === "patient") {
    const { data: patient, error: patientError } = await supabase.from("patients").select("id").eq("user_id", req.auth.user.id).maybeSingle();
    if (patientError) return res.status(500).json({ data: null, message: patientError.message });
    query = query.eq("patient_id", patient?.id || -1);
  } else if (req.auth.role !== "admin") {
    return res.status(403).json({ data: null, message: "Anda tidak memiliki izin untuk melihat pesanan." });
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data: data || [], message: "Daftar pesanan berhasil diambil." });
});

router.patch("/api/appointments/:id/status", authenticate, allowRoles("admin"), async (req, res) => {
  const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
  if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ data: null, message: "Status pesanan tidak valid." });
  const { data: current, error: currentError } = await supabase
    .from("appointments")
    .select("id, services(category)")
    .eq("id", req.params.id)
    .single();
  if (currentError?.code === "PGRST116") return res.status(404).json({ data: null, message: "Pesanan tidak ditemukan." });
  if (currentError) return res.status(500).json({ data: null, message: currentError.message });
  if (current.services?.category === "obat" && ["pending", "cancelled"].includes(req.body.status)) {
    return res.status(400).json({ data: null, message: "Pesanan obat hanya dapat berstatus dikonfirmasi atau selesai." });
  }
  const { data, error } = await supabase.from("appointments").update({ status: req.body.status }).eq("id", req.params.id).select().single();
  if (error?.code === "PGRST116") return res.status(404).json({ data: null, message: "Pesanan tidak ditemukan." });
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Status pesanan berhasil diperbarui." });
});

module.exports = router;
