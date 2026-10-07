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
app.post("/api/services", ensureDb, async (req, res) => {
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
app.put("/api/services/:id", ensureDb, async (req, res) => {
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
app.delete("/api/services/:id", ensureDb, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
