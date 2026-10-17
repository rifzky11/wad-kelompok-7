const express = require("express");
const crypto = require("crypto");
const { supabaseAdmin, authenticate, allowRoles } = require("../middleware/auth");

const router = express.Router();

async function uploadDoctorImage(imageData) {
  if (!imageData) return null;

  const match = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) {
    const error = new Error("Foto harus berupa JPG, PNG, atau WEBP.");
    error.status = 400;
    throw error;
  }

  const [, contentType, encodedImage] = match;
  const extension = contentType.split("/")[1].replace("jpeg", "jpg");
  const bucketName = "doctors";
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();
  if (listError) throw listError;

  const doctorBucket = buckets?.find((bucket) => bucket.name === bucketName);
  if (doctorBucket && !doctorBucket.public) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(
      bucketName,
      { public: true },
    );
    if (updateError) throw updateError;
  }

  if (!doctorBucket) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      bucketName,
      {
        public: true,
        fileSizeLimit: "8MB",
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
    );
    if (createError && !createError.message?.toLowerCase().includes("already exists")) {
      throw createError;
    }
  }

  const filePath = `profiles/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, Buffer.from(encodedImage, "base64"), {
      contentType,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}

router.post("/api/doctors/me", authenticate, allowRoles("doctor"), async (req, res) => {
  const { nama_dokter, spesialisasi, no_sip, no_telp, image_data: imageData } = req.body;
  if (!nama_dokter || !spesialisasi) {
    return res.status(400).json({
      data: null,
      message: "Field 'nama_dokter' dan 'spesialisasi' wajib diisi.",
    });
  }

  let image_url;
  try {
    image_url = await uploadDoctorImage(imageData);
  } catch (error) {
    return res.status(error.status || 500).json({
      data: null,
      message: error.message,
    });
  }

  const payload = {
    user_id: req.auth.user.id,
    nama_dokter,
    spesialisasi,
    no_sip,
    no_telp,
    ...(image_url ? { image_url } : {}),
  };
  const { data, error } = await supabaseAdmin
    .from("doctors")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return res.status(500).json({ data: null, message: error.message });
  res.status(201).json({ data, message: "Profil dokter berhasil disimpan." });
});

router.get("/api/doctors", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("doctors")
    .select("*, doctor_schedules(*)")
    .order("id", { ascending: true });

  if (error?.code === "PGRST205") {
    return res.status(503).json({
      data: null,
      code: "DOCTORS_TABLE_MISSING",
      message:
        "Tabel doctors belum tersedia. Jalankan schema.js di Supabase SQL Editor.",
    });
  }
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Daftar dokter berhasil diambil." });
});

router.get("/api/doctors/me", authenticate, allowRoles("doctor"), async (req, res) => {
  const { data: doctor, error: doctorError } = await supabaseAdmin
    .from("doctors")
    .select("*")
    .eq("user_id", req.auth.user.id)
    .maybeSingle();

  if (doctorError) {
    return res.status(500).json({ data: null, message: doctorError.message });
  }
  if (!doctor) {
    return res.status(404).json({
      data: null,
      code: "DOCTOR_PROFILE_MISSING",
      message: "Profil dokter belum terdaftar.",
    });
  }

  const [{ data: schedules, error: scheduleError }, { data: appointments, error: appointmentError }] =
    await Promise.all([
      supabaseAdmin
        .from("doctor_schedules")
        .select("*")
        .eq("doctor_id", doctor.id)
        .order("id", { ascending: true }),
      supabaseAdmin
        .from("appointments")
        .select(
          "id, tanggal_kunjungan, jam_kunjungan, keluhan, status, patients(id, no_rm, nama_lengkap, no_telp), services(title)",
        )
        .eq("doctor_id", doctor.id)
        .order("tanggal_kunjungan", { ascending: true }),
    ]);

  if (scheduleError) {
    return res.status(500).json({ data: null, message: scheduleError.message });
  }
  if (appointmentError) {
    if (appointmentError.code === "PGRST205") {
      return res.status(503).json({
        data: null,
        code: "APPOINTMENTS_TABLE_MISSING",
        message:
          "Tabel appointments belum tersedia. Jalankan migrasi appointments di Supabase SQL Editor.",
      });
    }
    return res.status(500).json({ data: null, message: appointmentError.message });
  }

  res.json({
    data: { doctor, schedules: schedules || [], appointments: appointments || [] },
    message: "Data dashboard dokter berhasil diambil.",
  });
});

router.get("/api/doctors/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("doctors")
    .select("*, doctor_schedules(*)")
    .eq("id", req.params.id)
    .single();

  if (error?.code === "PGRST116") {
    return res.status(404).json({ data: null, message: "Dokter tidak ditemukan." });
  }
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Detail dokter berhasil diambil." });
});

router.get("/api/doctors/:id/schedules", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("doctor_schedules")
    .select("*")
    .eq("doctor_id", req.params.id)
    .order("id", { ascending: true });

  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Jadwal dokter berhasil diambil." });
});

router.post("/api/doctors", authenticate, allowRoles("admin"), async (req, res) => {
  const { nama_dokter, spesialisasi, no_sip, no_telp, image_url } = req.body;
  if (!nama_dokter || !spesialisasi) {
    return res.status(400).json({
      data: null,
      message: "Field 'nama_dokter' dan 'spesialisasi' wajib diisi.",
    });
  }

  const { data, error } = await supabaseAdmin
    .from("doctors")
    .insert([{ nama_dokter, spesialisasi, no_sip, no_telp, image_url }])
    .select()
    .single();
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.status(201).json({ data, message: "Dokter berhasil ditambahkan." });
});

router.put("/api/doctors/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const allowed = ["nama_dokter", "spesialisasi", "no_sip", "no_telp", "image_url"];
  const updatePayload = Object.fromEntries(
    allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
  );
  if (!Object.keys(updatePayload).length) {
    return res.status(400).json({ data: null, message: "Tidak ada data yang diubah." });
  }

  const { data, error } = await supabaseAdmin
    .from("doctors")
    .update(updatePayload)
    .eq("id", req.params.id)
    .select()
    .single();
  if (error?.code === "PGRST116") {
    return res.status(404).json({ data: null, message: "Dokter tidak ditemukan." });
  }
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Data dokter berhasil diperbarui." });
});

router.post("/api/doctors/:id/schedules", authenticate, allowRoles("admin"), async (req, res) => {
  const { hari, jam_mulai, jam_selesai, kuota = 10 } = req.body;
  if (!hari || !jam_mulai || !jam_selesai) {
    return res.status(400).json({
      data: null,
      message: "Field 'hari', 'jam_mulai', dan 'jam_selesai' wajib diisi.",
    });
  }

  const { data, error } = await supabaseAdmin
    .from("doctor_schedules")
    .insert([{ doctor_id: req.params.id, hari, jam_mulai, jam_selesai, kuota }])
    .select()
    .single();
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.status(201).json({ data, message: "Jadwal dokter berhasil ditambahkan." });
});

router.delete("/api/doctors/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("doctors")
    .delete()
    .eq("id", req.params.id)
    .select()
    .single();
  if (error?.code === "PGRST116") {
    return res.status(404).json({ data: null, message: "Dokter tidak ditemukan." });
  }
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Dokter berhasil dihapus." });
});

module.exports = router;
