const express = require("express");
const { authenticate, allowRoles } = require("../middleware/auth");
const { query } = require("../db");

const router = express.Router();

router.get("/api/users", authenticate, allowRoles("admin"), async (req, res) => {
  try {
    const params = [];
    let whereClauses = [];

    if (req.query.role) {
      params.push(req.query.role);
      whereClauses.push(`role = $${params.length}`);
    }
    if (req.query.search) {
      const search = `%${String(req.query.search).trim()}%`;
      params.push(search);
      whereClauses.push(`(nama_lengkap ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const result = await query(
      `SELECT id, email, nama_lengkap, role, created_at FROM users ${whereStr} ORDER BY created_at DESC`,
      params
    );

    res.json({ data: result.rows, message: "Daftar pengguna berhasil diambil." });
  } catch (err) {
    console.error("Get users error:", err.message);
    res.status(500).json({ data: null, message: err.message });
  }
});

router.patch("/api/users/:id/role", authenticate, allowRoles("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["patient", "admin"].includes(role)) {
    return res.status(400).json({ data: null, message: "Role harus patient atau admin." });
  }

  try {
    const result = await query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, nama_lengkap, role",
      [role, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ data: null, message: "Pengguna tidak ditemukan." });
    }
    res.json({ data: result.rows[0], message: "Role pengguna berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ data: null, message: err.message });
  }
});

module.exports = router;
