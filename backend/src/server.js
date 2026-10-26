// ⚠️ dotenv HARUS dipanggil pertama kali sebelum module lain di-load
// agar process.env sudah terisi saat Pool pg dibuat di db.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ensureDb } = require("./middleware/auth");
const servicesRoutes = require("./routes/services");
const patientsRoutes = require("./routes/patients");
const usersRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const appointmentsRoutes = require("./routes/appointments");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "8mb" }));

app.get("/", (req, res) => {
  res.status(200).send("API Sehatin is running smoothly!");
});

app.use(["/services", "/api/services", "/api/patients", "/api/users", "/api/appointments"], ensureDb);

app.use(servicesRoutes);
app.use(patientsRoutes);
app.use(usersRoutes);
app.use(authRoutes);
app.use(appointmentsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
