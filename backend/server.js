const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

app.get("/", (req, res) => {
  res.status(200).send("Hello World");
});

app.get("/services", (req, res) => {
  const service_data = [
    {
      id: 1,
      title: "Konsultasi Umum",
      price: 150000,
      image:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80",
    },
    {
      id: 2,
      title: "Pemeriksaan Gigi",
      price: 200000,
      image:
        "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=700&q=80",
    },
    {
      id: 3,
      title: "Konsultasi Kulit",
      price: 250000,
      image:
        "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=700&q=80",
    },
    {
      id: 4,
      title: "Medical Check-up",
      price: 450000,
      image:
        "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=700&q=80",
    },
  ];

  res
    .status(200)
    .send({ data: service_data, message: "Data successfully received." });
});
