const express = require("express");
const crypto = require("crypto");
const { supabaseAdmin, authenticate, allowRoles } = require("../middleware/auth");

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

async function ensureServicesBucket() {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) throw listError;

  const servicesBucket = buckets?.find((bucket) => bucket.name === "services");
  if (servicesBucket) {
    if (!servicesBucket.public) {
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(
        "services",
        { public: true },
      );
      if (updateError) throw updateError;
    }
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(
    "services",
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

async function uploadServiceImage(imageData) {
  if (!imageData) return null;

  const match = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) {
    const error = new Error("Foto harus berupa JPG, PNG, atau WEBP.");
    error.status = 400;
    throw error;
  }

  const [, contentType, encodedImage] = match;
  const extension = contentType.split("/")[1].replace("jpeg", "jpg");
  const filePath = `services/${crypto.randomUUID()}.${extension}`;

  await ensureServicesBucket();

  const { error } = await supabaseAdmin.storage
    .from("services")
    .upload(filePath, Buffer.from(encodedImage, "base64"), {
      contentType,
      upsert: false,
    });

  if (error) throw error;
  const { data } = supabaseAdmin.storage.from("services").getPublicUrl(filePath);
  return data.publicUrl;
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
