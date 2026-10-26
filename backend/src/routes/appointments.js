const express = require("express");
const crypto = require("crypto");
const { authenticate, allowRoles } = require("../middleware/auth");
const { query } = require("../db");

const router = express.Router();

function createReceiptCode() {
  return `STRK-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

router.post("/api/appointments", authenticate, allowRoles("patient"), async (req, res) => {
  const { service_id, tanggal_kunjungan, jam_kunjungan, keluhan } = req.body;
  if (!service_id || !tanggal_kunjungan || !jam_kunjungan) {
    return res.status(400).json({ data: null, message: "Layanan, tanggal, dan jam kunjungan wajib diisi." });
  }

  try {
    // Ambil patient berdasarkan user_id
    const patientResult = await query(
      "SELECT id FROM patients WHERE user_id = $1",
      [req.auth.user.id]
    );
    if (patientResult.rows.length === 0) {
      return res.status(400).json({ data: null, code: "PATIENT_PROFILE_REQUIRED", message: "Lengkapi pendaftaran pasien terlebih dahulu." });
    }
    const patient = patientResult.rows[0];

    // Ambil service
    const serviceResult = await query(
      "SELECT id, title, price, kuota, category FROM services WHERE id = $1",
      [service_id]
    );
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ data: null, message: "Layanan tidak ditemukan." });
    }
    const service = serviceResult.rows[0];
    if (service.kuota < 1) {
      return res.status(409).json({ data: null, message: "Kuota layanan sudah habis." });
    }

    const kode_unik = createReceiptCode();
    const status = service.category === "obat" ? "confirmed" : "pending";

    // Buat appointment
    const apptResult = await query(
      `INSERT INTO appointments (patient_id, service_id, kode_unik, tanggal_kunjungan, jam_kunjungan, keluhan, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient.id, service_id, kode_unik, tanggal_kunjungan, jam_kunjungan, keluhan || null, status]
    );
    const appointment = apptResult.rows[0];

    // Update kuota secara atomik (optimistic lock)
    const quotaResult = await query(
      "UPDATE services SET kuota = kuota - 1 WHERE id = $1 AND kuota = $2 RETURNING id",
      [service_id, service.kuota]
    );
    if (quotaResult.rows.length === 0) {
      await query("DELETE FROM appointments WHERE id = $1", [appointment.id]);
      return res.status(409).json({ data: null, message: "Kuota layanan baru saja habis. Silakan pilih layanan lain." });
    }

    // Ambil appointment dengan relasi untuk response
    const fullResult = await query(
      `SELECT a.*,
              p.no_rm AS "patients.no_rm", p.nama_lengkap AS "patients.nama_lengkap",
              s.title AS "services.title", s.price AS "services.price", s.category AS "services.category"
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = $1`,
      [appointment.id]
    );

    const row = fullResult.rows[0];
    const enriched = {
      ...appointment,
      patients: {
        no_rm: row["patients.no_rm"],
        nama_lengkap: row["patients.nama_lengkap"],
      },
      services: {
        title: row["services.title"],
        price: row["services.price"],
        category: row["services.category"],
      },
    };

    res.status(201).json({ data: enriched, message: "Pesanan berhasil dibuat." });
  } catch (err) {
    console.error("Create appointment error:", err.message);
    res.status(500).json({ data: null, message: err.message });
  }
});

router.get("/api/appointments/receipt/:code", authenticate, allowRoles("admin"), async (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  if (!code || code.length > 32) {
    return res.status(400).json({ data: null, message: "Kode unik struk tidak valid." });
  }

  try {
    const receiptSql = `
      SELECT a.*,
             p.id AS "patient_id_ref", p.no_rm, p.nama_lengkap AS "patient_nama", p.no_telp,
             s.title AS "service_title", s.price AS "service_price", s.category AS "service_category"
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN services s ON a.service_id = s.id
      WHERE a.kode_unik = $1
    `;
    const result = await query(receiptSql, [code]);

    if (result.rows.length > 0) {
      const r = result.rows[0];
      const receipt = {
        ...r,
        patients: { id: r.patient_id_ref, no_rm: r.no_rm, nama_lengkap: r.patient_nama, no_telp: r.no_telp },
        services: { title: r.service_title, price: r.service_price, category: r.service_category },
      };
      return res.json({ data: receipt, message: "Struk berhasil ditemukan." });
    }

    // Legacy lookup by numeric ID (format: SEH-<number>)
    const legacyId = code.match(/^SEH-(\d+)$/)?.[1];
    if (legacyId) {
      const legacyResult = await query(receiptSql.replace("a.kode_unik = $1", "a.id = $1"), [Number(legacyId)]);
      if (legacyResult.rows.length > 0) {
        const r = legacyResult.rows[0];
        const receipt = {
          ...r,
          patients: { id: r.patient_id_ref, no_rm: r.no_rm, nama_lengkap: r.patient_nama, no_telp: r.no_telp },
          services: { title: r.service_title, price: r.service_price, category: r.service_category },
        };
        return res.json({ data: receipt, message: "Struk berhasil ditemukan." });
      }
    }

    res.status(404).json({ data: null, message: "Struk dengan kode tersebut tidak ditemukan." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

router.get("/api/appointments", authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 8));
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let params = [];

    if (req.auth.role === "patient") {
      const patResult = await query("SELECT id FROM patients WHERE user_id = $1", [req.auth.user.id]);
      const patientId = patResult.rows[0]?.id || -1;
      params.push(patientId);
      whereClauses.push(`a.patient_id = $${params.length}`);
    } else if (req.auth.role !== "admin") {
      return res.status(403).json({ data: null, message: "Anda tidak memiliki izin untuk melihat pesanan." });
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM appointments a ${whereStr}`,
      params
    );
    const totalData = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT a.*,
              p.id AS "pat_id", p.no_rm, p.nama_lengkap AS "pat_nama", p.no_telp,
              s.title AS "svc_title", s.price AS "svc_price", s.category AS "svc_category"
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN services s ON a.service_id = s.id
       ${whereStr}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const data = dataResult.rows.map((r) => ({
      ...r,
      patients: { id: r.pat_id, no_rm: r.no_rm, nama_lengkap: r.pat_nama, no_telp: r.no_telp },
      services: { title: r.svc_title, price: r.svc_price, category: r.svc_category },
    }));

    res.json({
      data,
      meta: {
        currentPage: page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit) || 1,
      },
      message: "Daftar pesanan berhasil diambil.",
    });
  } catch (err) {
    console.error("Get appointments error:", err.message);
    res.status(500).json({ data: null, message: err.message });
  }
});

router.patch("/api/appointments/:id/status", authenticate, allowRoles("admin"), async (req, res) => {
  const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ data: null, message: "Status pesanan tidak valid." });
  }

  try {
    // Cek apakah pesanan ada dan ambil kategori service
    const currentResult = await query(
      `SELECT a.id, s.category AS service_category
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ data: null, message: "Pesanan tidak ditemukan." });
    }

    const current = currentResult.rows[0];
    if (current.service_category === "obat" && ["pending", "cancelled"].includes(req.body.status)) {
      return res.status(400).json({ data: null, message: "Pesanan obat hanya dapat berstatus dikonfirmasi atau selesai." });
    }

    const result = await query(
      "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *",
      [req.body.status, req.params.id]
    );
    res.json({ data: result.rows[0], message: "Status pesanan berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

module.exports = router;
