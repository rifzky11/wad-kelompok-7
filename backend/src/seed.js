const { supabase } = require("./db");

const initialServices = [
  {
    title: "Pemeriksaan Umum",
    price: 60000,
    kuota: 10,
    category: "pemeriksaan",
    description:
      "Konsultasi dan pemeriksaan kesehatan umum oleh dokter untuk keluhan ringan hingga sedang. Meliputi pengecekan tekanan darah, suhu tubuh, denyut nadi, serta rekomendasi tindak lanjut dan resep bila diperlukan.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Konsultasi Gigi",
    price: 120000,
    kuota: 10,
    category: "konsultasi",
    description:
      "Pemeriksaan kondisi gigi dan mulut, konsultasi keluhan seperti nyeri gigi atau gusi bengkak, serta perencanaan perawatan. Pembersihan karang gigi dan tindakan lanjutan disesuaikan dengan hasil pemeriksaan.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Pemeriksaan Kesehatan Anak",
    price: 90000,
    kuota: 10,
    category: "pemeriksaan",
    description:
      "Pemantauan tumbuh kembang anak, pemeriksaan berat dan tinggi badan, imunisasi dasar, serta konsultasi keluhan umum pada anak. Cocok untuk pemeriksaan rutin balita dan anak usia sekolah.",
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Laboratorium Darah Lengkap",
    price: 150000,
    kuota: 10,
    category: "pemeriksaan",
    description:
      "Pemeriksaan darah lengkap (hematologi) untuk menilai kadar hemoglobin, leukosit, dan trombosit. Hasil pemeriksaan membantu deteksi dini anemia, infeksi, serta pemantauan kondisi kesehatan secara menyeluruh.",
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Vaksinasi & Imunisasi",
    price: 175000,
    kuota: 10,
    category: "pemeriksaan",
    description:
      "Layanan vaksinasi anak dan dewasa, termasuk imunisasi dasar, booster, serta vaksin perjalanan. Sebelum vaksinasi dilakukan skrining singkat untuk memastikan kondisi Anda layak menerima vaksin.",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Fisioterapi & Rehabilitasi Medis",
    price: 130000,
    kuota: 10,
    category: "pemeriksaan",
    description:
      "Terapi fisik untuk mengatasi nyeri otot, sendi, dan gangguan gerak akibat cedera atau kondisi kronis. Program latihan disusun oleh terapis sesuai keluhan dan target pemulihan Anda.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Pemeriksaan USG & Kebidanan",
    price: 200000,
    kuota: 10,
    category: "pemeriksaan",
    description:
      "Pemeriksaan ultrasonografi (USG) untuk memantau kehamilan dan kesehatan organ reproduksi. Meliputi pengecekan usia kehamilan, kondisi janin, serta konsultasi hasil pemeriksaan bersama dokter.",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Medical Check Up Dasar",
    price: 250000,
    kuota: 10,
    category: "pemeriksaan",
    description:
      "Paket pemeriksaan kesehatan menyeluruh yang mencakup pemeriksaan fisik, tekanan darah, gula darah, kolesterol, dan darah lengkap. Hasil pemeriksaan dirangkum dalam laporan yang mudah dipahami.",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
  },
];

async function seedData() {
  if (!supabase) {
    console.error("Supabase client belum terinisialisasi. Periksa .env!");
    return;
  }

  console.log("Memulai seeding data 'services'...");

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
    const { data: rows, error: rowsError } = await supabase
      .from("services")
      .select("id, title, description");

    if (rowsError) {
      console.error("Gagal membaca data services:", rowsError.message);
      console.log(
        "\nPastikan kolom 'description' sudah ada. Jalankan node src/schema.js atau SQL dari file tersebut di Supabase SQL Editor."
      );
      return;
    }

    // Lengkapi deskripsi layanan bawaan yang masih kosong (idempotent).
    const backfill = (rows || [])
      .map((row) => {
        if (row.description && row.description.trim()) return null;
        const seedService = initialServices.find(
          (item) => item.title === row.title
        );
        return seedService
          ? { id: row.id, description: seedService.description }
          : null;
      })
      .filter(Boolean);

    if (backfill.length === 0) {
      console.log(
        "Tabel 'services' sudah memiliki data. Melewatkan seeding atau Anda bisa truncate terlebih dahulu."
      );
      return;
    }

    let updated = 0;
    for (const item of backfill) {
      const { error: updateError } = await supabase
        .from("services")
        .update({ description: item.description })
        .eq("id", item.id);

      if (updateError) {
        console.error(
          `Gagal melengkapi deskripsi layanan ID ${item.id}:`,
          updateError.message
        );
        continue;
      }

      updated += 1;
    }

    console.log(
      `Tabel 'services' sudah memiliki data. Berhasil melengkapi deskripsi untuk ${updated} layanan medis.`
    );
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
