/**
 * Skrip Seeding Data untuk Sehatin
 * Mengisi data awal untuk Services (Layanan Medis)
 */
const { supabase } = require("./db");

const initialServices = [
  {
    title: "Pemeriksaan Dokter Umum",
    price: 60000,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Konsultasi Dokter Gigi",
    price: 120000,
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Pemeriksaan Kesehatan Anak",
    price: 90000,
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Laboratorium Darah Lengkap",
    price: 150000,
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Vaksinasi & Imunisasi",
    price: 175000,
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Fisioterapi & Rehabilitasi Medis",
    price: 130000,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Pemeriksaan USG & Kebidanan",
    price: 200000,
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Medical Check Up Dasar",
    price: 250000,
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
  },
];

async function seedData() {
  if (!supabase) {
    console.error("Supabase client belum terinisialisasi. Periksa .env!");
    return;
  }

  console.log("Memulai seeding data 'services'...");

  // Cek apakah data sudah ada
  const { data: existing, error: checkError } = await supabase
    .from("services")
    .select("id")
    .limit(1);

  if (checkError) {
    console.error("Gagal memeriksa tabel services:", checkError.message);
    console.log(
      "\nPastikan tabel 'services' sudah dibuat di Supabase sebelum seeding! Jalankan DDL dari schema.js di SQL Editor Supabase."
    );
    return;
  }

  if (existing && existing.length > 0) {
    console.log("Tabel 'services' sudah memiliki data. Melewatkan seeding atau Anda bisa truncate terlebih dahulu.");
    return;
  }

  const { data, error } = await supabase.from("services").insert(initialServices).select();

  if (error) {
    console.error("Gagal memasukkan seed services:", error.message);
  } else {
    console.log(`Berhasil menambahkan ${data.length} data layanan medis!`);
  }
}

if (require.main === module) {
  seedData();
}

module.exports = { seedData, initialServices };
