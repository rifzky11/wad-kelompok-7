const express = require("express");
const { supabaseAdmin, authenticate, allowRoles } = require("../middleware/auth");
const { uploadServiceImage } = require("../utils/s3");

const router = express.Router();

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
  const { title, price, image_data: imageData, category, kuota } = req.body;

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
    .insert([{ title, price, kuota, image, category: category || "lainnya" }])
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
  const { title, price, image_data: imageData, category, kuota } = req.body;

  if (!title && price === undefined && imageData === undefined && category === undefined && kuota === undefined) {
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
