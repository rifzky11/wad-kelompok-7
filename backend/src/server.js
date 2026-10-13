const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { supabase } = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "*", // Mengizinkan akses dari client frontend (5173, 5174, dll)
  })
);
app.use(express.json());

// Helper middleware untuk memastikan koneksi DB tersedia
function ensureDb(req, res, next) {
  if (!supabase) {
    return res.status(503).json({
      data: null,
      message:
        "Supabase belum dikonfigurasi. Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY ada di .env.",
    });
  }
  next();
}

function normalizeRole(role) {
  const normalizedRole = String(role || "").toLowerCase();
  const roleAliases = {
    guest: "guest",
    patient: "patient",
    pasien: "patient",
    doctor: "doctor",
    dokter: "doctor",
    admin: "admin",
  };

  return roleAliases[normalizedRole] || "patient";
}

async function authenticate(req, res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({
      data: null,
      message: "Autentikasi diperlukan.",
    });
  }

  if (!supabase) {
    return res.status(503).json({
      data: null,
      message: "Supabase belum dikonfigurasi.",
    });
  }

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.getUser(token));
  } catch (verificationError) {
    console.error("Failed to verify Supabase access token:", verificationError);
    return res.status(503).json({
      data: null,
      message: "Layanan autentikasi sedang tidak tersedia.",
    });
  }
  if (error || !data.user) {
    return res.status(401).json({
      data: null,
      message: "Sesi tidak valid atau sudah kedaluwarsa.",
    });
  }

  req.auth = {
    user: data.user,
    role: normalizeRole(data.user.app_metadata?.role),
  };
  next();
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

// Root test endpoint
app.get("/", (req, res) => {
  res.status(200).send("API Sehatin is running smoothly!");
});

// ==========================================
// A. LAYANAN MEDIS (CRUD ENDPOINTS)
// Sesuai Desain API Dokumen:
// 1. GET    /services          -> Mengambil daftar layanan klinik
// 2. GET    /api/services/:id  -> Mengambil detail layanan berdasarkan ID
// 3. POST   /api/services      -> Menambahkan layanan baru
// 4. PUT    /api/services/:id  -> Mengubah data layanan
// 5. DELETE /api/services/:id  -> Menghapus layanan
// ==========================================

// 1. GET /services (dan alias /api/services untuk kemudahan)
const getAllServices = async (req, res) => {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({ data: null, message: error.message });
  }

  res.status(200).json({
    data,
    message: "Daftar layanan berhasil diambil.",
  });
};

app.get("/services", ensureDb, getAllServices);
app.get("/api/services", ensureDb, getAllServices);

// 2. GET /api/services/:id -> Mengambil detail layanan berdasarkan ID
app.get("/api/services/:id", ensureDb, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({
        data: null,
        message: `Layanan dengan ID ${id} tidak ditemukan.`,
      });
    }
    return res.status(500).json({ data: null, message: error.message });
  }

  res.status(200).json({
    data,
    message: "Detail layanan berhasil diambil.",
  });
});

// 3. POST /api/services -> Menambahkan layanan baru
app.post("/api/services", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { title, price, image } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({
      data: null,
      message: "Field 'title' dan 'price' wajib diisi.",
    });
  }

  const { data, error } = await supabase
    .from("services")
    .insert([{ title, price, image }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ data: null, message: error.message });
  }

  res.status(201).json({
    data,
    message: "Layanan baru berhasil ditambahkan.",
  });
});

// 4. PUT /api/services/:id -> Mengubah data layanan
app.put("/api/services/:id", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { id } = req.params;
  const { title, price, image } = req.body;

  if (!title && price === undefined && image === undefined) {
    return res.status(400).json({
      data: null,
      message: "Setidaknya salah satu field (title, price, image) harus diisi untuk update.",
    });
  }

  const updatePayload = {};
  if (title !== undefined) updatePayload.title = title;
  if (price !== undefined) updatePayload.price = price;
  if (image !== undefined) updatePayload.image = image;

  const { data, error } = await supabase
    .from("services")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ data: null, message: error.message });
  }

  if (!data) {
    return res.status(404).json({
      data: null,
      message: `Layanan dengan ID ${id} tidak ditemukan.`,
    });
  }

  res.status(200).json({
    data,
    message: "Data layanan berhasil diperbarui.",
  });
});

// 5. DELETE /api/services/:id -> Menghapus layanan
app.delete("/api/services/:id", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ data: null, message: error.message });
  }

  if (!data) {
    return res.status(404).json({
      data: null,
      message: `Layanan dengan ID ${id} tidak ditemukan.`,
    });
  }

  res.status(200).json({
    data,
    message: `Layanan dengan ID ${id} berhasil dihapus.`,
  });
});

// ==========================================
// B. DOKTER & JADWAL
// ==========================================
app.get("/api/doctors", ensureDb, async (req, res) => {
  const { data, error } = await supabase
    .from("doctors")
    .select("*, doctor_schedules(*)")
    .order("id", { ascending: true });

  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Daftar dokter berhasil diambil." });
});

app.get("/api/doctors/:id", ensureDb, async (req, res) => {
  const { data, error } = await supabase
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

app.get("/api/doctors/:id/schedules", ensureDb, async (req, res) => {
  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("doctor_id", req.params.id)
    .order("id", { ascending: true });

  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Jadwal dokter berhasil diambil." });
});

app.post("/api/doctors", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { nama_dokter, spesialisasi, no_sip, no_telp, image_url } = req.body;
  if (!nama_dokter || !spesialisasi) {
    return res.status(400).json({
      data: null,
      message: "Field 'nama_dokter' dan 'spesialisasi' wajib diisi.",
    });
  }

  const { data, error } = await supabase
    .from("doctors")
    .insert([{ nama_dokter, spesialisasi, no_sip, no_telp, image_url }])
    .select()
    .single();
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.status(201).json({ data, message: "Dokter berhasil ditambahkan." });
});

app.put("/api/doctors/:id", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const allowed = ["nama_dokter", "spesialisasi", "no_sip", "no_telp", "image_url"];
  const updatePayload = Object.fromEntries(
    allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
  );
  if (!Object.keys(updatePayload).length) {
    return res.status(400).json({ data: null, message: "Tidak ada data yang diubah." });
  }

  const { data, error } = await supabase
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

app.post("/api/doctors/:id/schedules", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { hari, jam_mulai, jam_selesai, kuota = 10 } = req.body;
  if (!hari || !jam_mulai || !jam_selesai) {
    return res.status(400).json({
      data: null,
      message: "Field 'hari', 'jam_mulai', dan 'jam_selesai' wajib diisi.",
    });
  }

  const { data, error } = await supabase
    .from("doctor_schedules")
    .insert([{ doctor_id: req.params.id, hari, jam_mulai, jam_selesai, kuota }])
    .select()
    .single();
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.status(201).json({ data, message: "Jadwal dokter berhasil ditambahkan." });
});

app.delete("/api/doctors/:id", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { data, error } = await supabase
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

// ==========================================
// C. PASIEN
// ==========================================
app.get("/api/patients", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { data, error } = await supabase.from("patients").select("*").order("id", { ascending: true });
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Daftar pasien berhasil diambil." });
});

app.get("/api/patients/:id", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
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

app.post("/api/patients", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
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

app.put("/api/patients/:id", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
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

app.delete("/api/patients/:id", authenticate, allowRoles("admin"), ensureDb, async (req, res) => {
  const { data, error } = await supabase.from("patients").delete().eq("id", req.params.id).select().single();
  if (error?.code === "PGRST116") return res.status(404).json({ data: null, message: "Pasien tidak ditemukan." });
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Pasien berhasil dihapus." });
});

// ==========================================
// D. AUTENTIKASI
// ==========================================
app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (role === "guest") {
    return res.json({ data: { role: "guest", user: null, session: null }, message: "Masuk sebagai guest." });
  }
  if (!supabase) return res.status(503).json({ data: null, message: "Supabase belum dikonfigurasi." });
  if (!email || !password) return res.status(400).json({ data: null, message: "Email dan password wajib diisi." });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ data: null, message: "Email atau password tidak valid." });
  const userRole = normalizeRole(data.user.app_metadata?.role);
  res.json({
    data: { role: userRole, user: data.user, session: data.session },
    message: "Login berhasil.",
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, nama_lengkap } = req.body;
  if (!supabase) return res.status(503).json({ data: null, message: "Supabase belum dikonfigurasi." });
  if (!email || !password || !nama_lengkap) {
    return res.status(400).json({ data: null, message: "Nama, email, dan password wajib diisi." });
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nama_lengkap, role: "patient" } },
  });
  if (error) return res.status(400).json({ data: null, message: error.message });
  res.status(201).json({ data, message: "Registrasi pasien berhasil." });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
