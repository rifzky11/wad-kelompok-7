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
  const { data, error } = await supabase
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
  const { title, price, image, category, kuota, description, doctor_name, schedule } = req.body;

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
    imageUrl = normalizeImageUrl(image);
  } catch (error) {
    return res.status(error.status || 500).json({
      data: null,
      message: error.message,
    });
  }

  const insertPayload = {
    title,
    price,
    kuota,
    image: imageUrl,
    category: category || "lainnya",
    description: description || null,
  };
  if (doctor_name !== undefined) insertPayload.doctor_name = doctor_name;
  if (schedule !== undefined) insertPayload.schedule = schedule;

  let { data, error } = await supabase
    .from("services")
    .insert([insertPayload])
    .select()
    .single();

  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    delete insertPayload.doctor_name;
    delete insertPayload.schedule;
    const retry = await supabase
      .from("services")
      .insert([insertPayload])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

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
  const { title, price, image, category, kuota, description, doctor_name, schedule } = req.body;

  if (!title && price === undefined && image === undefined && category === undefined && kuota === undefined && description === undefined && doctor_name === undefined && schedule === undefined) {
    return res.status(400).json({
      data: null,
      message: "Setidaknya salah satu field harus diisi untuk update.",
    });
  }

  const updatePayload = {};
  if (title !== undefined) updatePayload.title = title;
  if (price !== undefined) updatePayload.price = price;
  if (category !== undefined) updatePayload.category = category;
  if (description !== undefined) updatePayload.description = description;
  if (doctor_name !== undefined) updatePayload.doctor_name = doctor_name;
  if (schedule !== undefined) updatePayload.schedule = schedule;
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

  let { data, error } = await supabase
    .from("services")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    delete updatePayload.doctor_name;
    delete updatePayload.schedule;
    const retry = await supabase
      .from("services")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

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
