const express = require("express");
const crypto = require("crypto");
const { supabase, authenticate, allowRoles } = require("../middleware/auth");

const router = express.Router();

function createReceiptCode() {
  return `STRK-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

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
    .insert({ patient_id: patient.id, service_id, kode_unik: createReceiptCode(), tanggal_kunjungan, jam_kunjungan, keluhan: keluhan || null, status: service.category === "obat" ? "confirmed" : "pending" })
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

router.get("/api/appointments/receipt/:code", authenticate, allowRoles("admin"), async (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  if (!code || code.length > 32) {
    return res.status(400).json({ data: null, message: "Kode unik struk tidak valid." });
  }

  const receiptFields = "*, patients(id, no_rm, nama_lengkap, no_telp), services(title, price, category)";
  const { data: receipt, error: receiptError } = await supabase
    .from("appointments")
    .select(receiptFields)
    .eq("kode_unik", code)
    .maybeSingle();
  if (receiptError) return res.status(500).json({ data: null, message: receiptError.message });

  if (receipt) {
    return res.json({ data: receipt, message: "Struk berhasil ditemukan." });
  }

  const legacyId = code.match(/^SEH-(\d+)$/)?.[1];
  if (legacyId) {
    const { data: legacyReceipt, error: legacyError } = await supabase
      .from("appointments")
      .select(receiptFields)
      .eq("id", Number(legacyId))
      .maybeSingle();
    if (legacyError) return res.status(500).json({ data: null, message: legacyError.message });
    if (legacyReceipt) {
      return res.json({ data: legacyReceipt, message: "Struk berhasil ditemukan." });
    }
  }

  res.status(404).json({ data: null, message: "Struk dengan kode tersebut tidak ditemukan." });
});

router.get("/api/appointments", authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 8));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabase.from("appointments")
    .select("*, patients(id, no_rm, nama_lengkap, no_telp), services(title, price, category)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (req.auth.role === "patient") {
    const { data: patient, error: patientError } = await supabase.from("patients").select("id").eq("user_id", req.auth.user.id).maybeSingle();
    if (patientError) return res.status(500).json({ data: null, message: patientError.message });
    query = query.eq("patient_id", patient?.id || -1);
  } else if (req.auth.role !== "admin") {
    return res.status(403).json({ data: null, message: "Anda tidak memiliki izin untuk melihat pesanan." });
  }
  const { data, error, count } = await query;
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({
    data: data || [],
    meta: {
      currentPage: page,
      limit,
      totalData: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
    },
    message: "Daftar pesanan berhasil diambil.",
  });
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
