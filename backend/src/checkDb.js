// ⚠️ dotenv harus dipanggil sebelum db.js agar DATABASE_URL sudah terbaca.
// Jalankan dari folder backend: node src/checkDb.js
require("dotenv").config();

const { pool, describeDatabaseTarget, explainDatabaseError } = require("./db");

const REQUIRED_TABLES = ["users", "patients", "services", "appointments", "medical_records", "invoices"];

async function checkDatabase() {
  console.log(`🔎 Menguji koneksi ke: ${describeDatabaseTarget()}`);
  console.log(`   DATABASE_SSL        : ${process.env.DATABASE_SSL ?? "(default: ssl aktif)"}\n`);

  if (!process.env.DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL belum diisi di backend/.env.\n" +
        "   Ambil connection string di Supabase Dashboard > Project Settings > Database >\n" +
        "   Connection string > URI, lalu tempel sebagai DATABASE_URL."
    );
    process.exitCode = 1;
    return;
  }

  try {
    const info = await pool.query(
      "SELECT current_database() AS database, current_user AS db_user, version() AS version"
    );
    console.log("✅ Koneksi database berhasil.");
    console.log(`   database : ${info.rows[0].database}`);
    console.log(`   user     : ${info.rows[0].db_user}`);
    console.log(`   versi    : ${String(info.rows[0].version).split(",")[0]}\n`);

    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const existing = new Set(tables.rows.map((row) => row.table_name));
    const missing = REQUIRED_TABLES.filter((table) => !existing.has(table));

    if (missing.length === 0) {
      console.log("✅ Semua tabel utama tersedia:", REQUIRED_TABLES.join(", "));
    } else {
      console.warn(`⚠️  Tabel belum ada: ${missing.join(", ")}`);
      console.warn("   Jalankan `node src/schema.js` lalu salin SQL-nya ke Supabase SQL Editor.");
    }
  } catch (err) {
    console.error("❌ Koneksi database gagal.");
    console.error(`   kode  : ${err.code || "-"}`);
    console.error(`   pesan : ${err.message}`);
    console.error(`   saran : ${explainDatabaseError(err)}`);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

checkDatabase();
