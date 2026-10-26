const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const { query } = require("../db");

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

const getAllServices = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 8);
    const offset = (page - 1) * limit;

    const countResult = await query("SELECT COUNT(*) FROM services");
    const totalData = parseInt(countResult.rows[0].count);

    const result = await query(
      "SELECT * FROM services ORDER BY id ASC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      meta: {
        currentPage: page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit) || 1,
      },
      message: "Daftar layanan berhasil diambil.",
    });
  } catch (err) {
    console.error("getAllServices error:", err.message);
    res.status(500).json({ data: null, message: "Terjadi kesalahan server internal." });
  }
};

router.get("/services", getAllServices);
router.get("/api/services", getAllServices);

router.get("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("SELECT * FROM services WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        message: `Layanan dengan ID ${id} tidak ditemukan.`,
      });
    }
    res.status(200).json({ data: result.rows[0], message: "Detail layanan berhasil diambil." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
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

  let imageUrl = null;
  if (image !== undefined) {
    try {
      imageUrl = normalizeImageUrl(image);
    } catch (error) {
      return res.status(error.status || 500).json({ data: null, message: error.message });
    }
  }

  try {
    const result = await query(
      `INSERT INTO services (title, price, kuota, image, category, description, doctor_name, schedule)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        price,
        Number(kuota),
        imageUrl,
        category || "lainnya",
        description || null,
        doctor_name || null,
        schedule || null,
      ]
    );
    res.status(201).json({ data: result.rows[0], message: "Layanan baru berhasil ditambahkan." });
  } catch (err) {
    console.error("Insert service error:", err.message);
    res.status(500).json({ data: null, message: err.message });
  }
});

router.put("/api/services/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { title, price, image, category, kuota, description, doctor_name, schedule } = req.body;

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (price !== undefined) updates.price = price;
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (doctor_name !== undefined) updates.doctor_name = doctor_name;
  if (schedule !== undefined) updates.schedule = schedule;
  if (kuota !== undefined) {
    if (!Number.isInteger(Number(kuota)) || Number(kuota) < 0) {
      return res.status(400).json({ data: null, message: "Kuota harus berupa bilangan bulat nol atau lebih." });
    }
    updates.kuota = Number(kuota);
  }
  if (image !== undefined) {
    try {
      updates.image = normalizeImageUrl(image);
    } catch (error) {
      return res.status(error.status || 500).json({ data: null, message: error.message });
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ data: null, message: "Setidaknya salah satu field harus diisi untuk update." });
  }

  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

  try {
    const result = await query(
      `UPDATE services SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, message: `Layanan dengan ID ${id} tidak ditemukan.` });
    }
    res.status(200).json({ data: result.rows[0], message: "Data layanan berhasil diperbarui." });
  } catch (err) {
    console.error("Update service error:", err.message);
    res.status(500).json({ data: null, message: err.message });
  }
});

router.delete("/api/services/:id", authenticate, allowRoles("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query("DELETE FROM services WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, message: `Layanan dengan ID ${id} tidak ditemukan.` });
    }
    res.status(200).json({ data: result.rows[0], message: `Layanan dengan ID ${id} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

module.exports = router;