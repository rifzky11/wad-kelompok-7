const express = require("express");
const { supabaseAdmin, authenticate, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/api/users", authenticate, allowRoles("admin"), async (req, res) => {
  const role = req.query.role;
  let query = supabaseAdmin
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
  const userIds = users.map((user) => user.id);
  let doctorsByUserId = new Map();

  if (userIds.length) {
    const { data: doctors, error: doctorsError } = await supabaseAdmin
      .from("doctors")
      .select("id, user_id, nama_dokter, spesialisasi")
      .in("user_id", userIds);

    if (doctorsError && doctorsError.code !== "PGRST205") {
      return res.status(500).json({ data: null, message: doctorsError.message });
    }

    doctorsByUserId = new Map(
      (doctors || []).map((doctor) => [doctor.user_id, doctor]),
    );
  }

  res.json({
    data: users.map((user) => ({
      ...user,
      doctors: doctorsByUserId.get(user.id)
        ? [doctorsByUserId.get(user.id)]
        : [],
    })),
    message: "Daftar pengguna berhasil diambil.",
  });
});

router.patch("/api/users/:id/role", authenticate, allowRoles("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["patient", "doctor", "admin"].includes(role)) {
    return res.status(400).json({
      data: null,
      message: "Role harus patient, doctor, atau admin.",
    });
  }

  const { data, error } = await supabaseAdmin
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
