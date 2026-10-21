const express = require("express");
const { supabaseAdmin, authenticate, allowRoles } = require("../middleware/auth");
const { uploadServiceImage } = require("../utils/s3");

const router = express.Router();

function respondWithSchemaError(res, error) {
  // PGRST204: kolom tidak dikenal PostgREST; 42703: kolom belum ada di PostgreSQL.
  if (error?.code !== "PGRST204" && error?.code !== "42703") return false;

  res.status(500).json({
    data: null,
    message:
      "Kolom description belum ada di tabel services. Jalankan perintah berikut di Supabase SQL Editor: ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description TEXT; NOTIFY pgrst, 'reload schema'; lalu simpan ulang layanan. Detail: " +
      error.message,
  });
  return true;
}

function normalizeDescription(description) {
  if (description === undefined || description === null) return null;
  const value = String(description).trim();
  return value ? value : null;
}

const getAllServices = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    if (respondWithSchemaError(res, error)) return;
    return res.status(500).json({ data: null, message: error.message });
  }

  res.status(200).json({
    data,
    message: "Daftar layanan berhasil diambil.",
  });
};

router.get("/services", getAllServices);
router.get("/api/services", getAllServices);

router.get("/api/services/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
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
  const { title, price, image_data: imageData, category, kuota, description } =
    req.body;

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

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      data: null,
      message: "Deskripsi layanan harus berupa teks.",
    });
  }

  let image;
  try {
    image = await uploadServiceImage(imageData);
  } catch (error) {
    return res.status(error.status || 500).json({
      data: null,
      message: error.message,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("services")
    .insert([
      {
        title,
        price,
        kuota,
        image,
        category: category || "lainnya",
        description: normalizeDescription(description),
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
  const { title, price, image_data: imageData, category, kuota, description } =
    req.body;

  if (
    !title &&
    price === undefined &&
    imageData === undefined &&
    category === undefined &&
    kuota === undefined &&
    description === undefined
  ) {
    return res.status(400).json({
      data: null,
      message:
        "Setidaknya salah satu field (title, price, image, category, kuota, description) harus diisi untuk update.",
    });
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      data: null,
      message: "Deskripsi layanan harus berupa teks.",
    });
  }

  const updatePayload = {};
  if (title !== undefined) updatePayload.title = title;
  if (price !== undefined) updatePayload.price = price;
  if (category !== undefined) updatePayload.category = category;
  if (description !== undefined) {
    updatePayload.description = normalizeDescription(description);
  }
  if (kuota !== undefined) {
    if (!Number.isInteger(Number(kuota)) || Number(kuota) < 0) {
      return res.status(400).json({
        data: null,
        message: "Kuota harus berupa bilangan bulat nol atau lebih.",
      });
    }
    updatePayload.kuota = kuota;
  }

  if (imageData !== undefined) {
    try {
      updatePayload.image = await uploadServiceImage(imageData);
    } catch (error) {
      return res.status(error.status || 500).json({
        data: null,
        message: error.message,
      });
    }
  }

  const { data, error } = await supabaseAdmin
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

  const { data, error } = await supabaseAdmin
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
