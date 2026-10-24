const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { ensureDb } = require("./middleware/auth");
const servicesRoutes = require("./routes/services");
const patientsRoutes = require("./routes/patients");
const usersRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const appointmentsRoutes = require("./routes/appointments");

dotenv.config();

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
