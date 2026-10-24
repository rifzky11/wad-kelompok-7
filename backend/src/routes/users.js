const express = require("express");
const { supabase, authenticate, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/api/users", authenticate, allowRoles("admin"), async (req, res) => {
  const role = req.query.role;
  let query = supabase
    .from("users")
    .select("id, email, nama_lengkap, role, created_at")
    .order("created_at", { ascending: false });

  if (role) query = query.eq("role", role);
  if (req.query.search) {
    const search = String(req.query.search).trim();
    query = query.or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%`);
  }
  const { data, error } = await query;

  if (error) return res.status(500).json({ data: null, message: error.message });

  const users = data || [];
  res.json({
    data: users,
    message: "Daftar pengguna berhasil diambil.",
  });
});

router.patch("/api/users/:id/role", authenticate, allowRoles("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["patient", "admin"].includes(role)) {
    return res.status(400).json({
      data: null,
      message: "Role harus patient atau admin.",
    });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", req.params.id)
    .select("id, email, nama_lengkap, role")
    .single();

  if (error?.code === "PGRST116") {
    return res.status(404).json({ data: null, message: "Pengguna tidak ditemukan." });
  }
  if (error) return res.status(500).json({ data: null, message: error.message });
  res.json({ data, message: "Role pengguna berhasil diperbarui." });
});

module.exports = router;
