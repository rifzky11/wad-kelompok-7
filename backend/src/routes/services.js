const express = require("express");
const { supabase, authenticate, allowRoles } = require("../middleware/auth");

const router = express.Router();

function normalizeImageUrl(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    const error = new Error("URL gambar harus berupa teks.");
    error.status = 400;
    throw error;
  }

  const imageUrl = value.trim();
  if (!imageUrl) return null;

  try {
    const parsedUrl = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("URL gambar harus menggunakan protokol HTTP atau HTTPS.");
    }
  } catch (error) {
    const validationError = new Error(
      error.message.startsWith("URL gambar")
        ? error.message
        : "URL gambar tidak valid."
    );
    validationError.status = 400;
    throw validationError;
  }

  return imageUrl;
}

function respondWithSchemaError(res, error) {
  if (error?.code !== "PGRST204") return false;

  res.status(500).json({
    data: null,
    message:
      "Schema tabel services belum terbaca oleh Supabase API. Pastikan kolom category dan kuota sudah ada, lalu jalankan NOTIFY pgrst, 'reload schema'; di Supabase SQL Editor. Detail: " +
      error.message,
  });
  return true;
}

const getAllServices = async (req, res) => {
  try {
    // 1. Tangkap page & limit dengan fallback aman
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 8);

    // 2. Hitung offset Supabase
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 3. Query ambil data + total jumlah data
    const { data, error, count } = await supabaseAdmin
      .from("services")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      if (respondWithSchemaError(res, error)) return;
      return res.status(500).json({ data: null, message: error.message });
    }

    // 4. Kirim respons
    res.status(200).json({
      data,
      meta: {
        currentPage: page,
        limit: limit,
        totalData: count || 0,
        totalPages: Math.ceil((count || 0) / limit) || 1, // Pastikan minimal ada 1 halaman
      },
      message: "Daftar layanan berhasil diambil.",
    });
  } catch (err) {
    res.status(500).json({ data: null, message: "Terjadi kesalahan server internal." });
  }
};

router.get("/services", getAllServices);
router.get("/api/services", getAllServices);

router.get("/api/services/:id", async (req, res) => {
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

router.post("/api/services", authenticate, allowRoles("admin"), async (req, res) => {
  const { title, price, image, category, kuota } = req.body;

  if (
    !title ||
    price === undefined ||
    kuota === undefined ||
    !Number.isInteger(Number(kuota)) ||
    Number(kuota) < 0
  ) {
    return res.status(400).json({
      data: null,
      message: "Field 'title', 'price', dan 'kuota' wajib diisi.",
    });
  }

  let imageUrl;
  try {
    if (imageData) image = await uploadServiceImage(imageData);
  } catch (error) {
    return res.status(error.status || 500).json({
      data: null,
      message: error.message,
    });
  }

  const { data, error } = await supabase
    .from("services")
    .insert([
      {
        title,
        price,
        kuota,
        image: imageUrl,
        category: category || "lainnya",
      },
    ])
    .select()
    .single();

  if (error) {
    if (respondWithSchemaError(res, error)) return;
    return res.status(500).json({ data: null, message: error.message });
  }

  res.status(201).json({
    data,
    message: "Layanan baru berhasil ditambahkan.",
  });
});

router.put("/api/services/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { title, price, image, category, kuota } = req.body;

  if (!title && price === undefined && image === undefined && category === undefined && kuota === undefined) {
    return res.status(400).json({
      data: null,
      message: "Setidaknya salah satu field (title, price, image) harus diisi untuk update.",
    });
  }

  const updatePayload = {};
  if (title !== undefined) updatePayload.title = title;
  if (price !== undefined) updatePayload.price = price;
  if (category !== undefined) updatePayload.category = category;
  if (kuota !== undefined) {
    if (!Number.isInteger(Number(kuota)) || Number(kuota) < 0) {
      return res.status(400).json({
        data: null,
        message: "Kuota harus berupa bilangan bulat nol atau lebih.",
      });
    }
    updatePayload.kuota = kuota;
  }

  if (image !== undefined) {
    try {
      updatePayload.image = normalizeImageUrl(image);
    } catch (error) {
      return res.status(error.status || 500).json({
        data: null,
        message: error.message,
      });
    }
  }

  const { data, error } = await supabase
    .from("services")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (respondWithSchemaError(res, error)) return;
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

router.delete("/api/services/:id", authenticate, allowRoles("admin"), async (req, res) => {
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

module.exports = router;