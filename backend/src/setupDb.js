// Helper konfigurasi DATABASE_URL.
// Jalankan dari folder backend:
//   npm run db:setup -- "postgresql://postgres.<ref>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
//   npm run db:setup -- --clipboard      (ambil connection string dari clipboard Windows)
//   npm run db:setup -- --password <password-database>
// Script ini menulis DATABASE_URL ke backend/.env, lalu langsung menguji koneksinya.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ENV_PATH = path.join(__dirname, "..", ".env");
const DEFAULT_HOST = "aws-0-ap-northeast-1.pooler.supabase.com";
const DEFAULT_REF = "mxdkzlwlbdrdnrwccgdv";

const REQUIRED_TABLES = ["users", "patients", "services", "appointments", "medical_records", "invoices"];

function maskConnectionString(value) {
  return String(value).replace(/\/\/([^:/@]+):([^@]*)@/, (_, user, pass) => {
    return `//${user}:${pass ? "****" : "(kosong)"}@`;
  });
}

function readClipboard() {
  try {
    // -Sta diperlukan agar Get-Clipboard bisa membaca clipboard di proses anak.
    return execFileSync("powershell", ["-NoProfile", "-Sta", "-Command", "Get-Clipboard -Raw"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function buildFromPassword(password) {
  if (!password) return "";
  return `postgresql://postgres.${DEFAULT_REF}:${encodeURIComponent(password)}@${DEFAULT_HOST}:6543/postgres`;
}

function resolveConnectionString(argv) {
  const args = argv.slice(2);
  const passwordFlagIndex = args.indexOf("--password");
  if (passwordFlagIndex !== -1) return buildFromPassword(args[passwordFlagIndex + 1]);

  const first = args.find((arg) => !arg.startsWith("--"));
  if (first) {
    return /^postgres(ql)?:\/\//i.test(first) ? first : buildFromPassword(first);
  }

  return readClipboard();
}

function validate(connectionString) {
  if (!connectionString) {
    return "Input kosong. Salin connection string dari Supabase, atau pakai --clipboard / --password.";
  }
  if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
    return "Connection string harus diawali postgresql:// atau postgres://. Nilai yang diterima bukan URI PostgreSQL.";
  }

  let parsed;
  try {
    parsed = new URL(connectionString.trim());
  } catch {
    return "Format URI tidak valid. Periksa karakter khusus pada password (encode dengan encodeURIComponent).";
  }

  if (!parsed.username) return "Username database kosong. Untuk Supabase gunakan postgres.<project-ref>.";
  if (!parsed.password) {
    return "Password database kosong pada URI. Salin URI lengkap dari Supabase Dashboard > Connect (password ikut tersalin).";
  }
  if (/[<>]/.test(decodeURIComponent(parsed.password))) {
    return "Password masih berupa placeholder (<PASSWORD>). Ganti dengan password database Supabase yang sebenarnya.";
  }
  if (!parsed.hostname) return "Host database kosong pada URI.";

  return null;
}

function writeEnv(connectionString) {
  const existing = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const line = `DATABASE_URL=${connectionString.trim()}`;
  const pattern = /^[#\s]*DATABASE_URL=.*$/m;

  let content = pattern.test(existing)
    ? existing.replace(pattern, line)
    : `${existing.trimEnd()}\n${line}\n`;

  if (!/^\s*DATABASE_SSL=/m.test(content)) {
    content = `${content.trimEnd()}\nDATABASE_SSL=true\n`;
  }

  fs.writeFileSync(ENV_PATH, content, "utf8");
}

async function testConnection(connectionString) {
  // db.js membaca process.env saat di-require, jadi set dulu sebelum require.
  process.env.DATABASE_URL = connectionString.trim();
  if (!process.env.DATABASE_SSL) process.env.DATABASE_SSL = "true";

  const { pool, describeDatabaseTarget, explainDatabaseError } = require("./db");

  console.log(`\n🔎 Menguji koneksi ke: ${describeDatabaseTarget()}`);
  try {
    const info = await pool.query("SELECT current_database() AS database, current_user AS db_user");
    console.log("✅ DATABASE_URL tersimpan dan koneksi database berhasil.");
    console.log(`   database : ${info.rows[0].database}`);
    console.log(`   user     : ${info.rows[0].db_user}`);

    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const existing = new Set(tables.rows.map((row) => row.table_name));
    const missing = REQUIRED_TABLES.filter((table) => !existing.has(table));

    if (missing.length === 0) {
      console.log("✅ Semua tabel utama sudah ada.");
    } else {
      console.warn(`⚠️  Tabel belum ada: ${missing.join(", ")}`);
      console.warn("   Jalankan `node src/schema.js`, salin SQL-nya ke Supabase SQL Editor, lalu `node src/seed.js`.");
    }
    console.log("\n👉 Restart backend (`npm run dev`) agar DATABASE_URL baru dipakai.");
  } catch (err) {
    console.error("❌ DATABASE_URL sudah ditulis ke backend/.env, tetapi koneksi masih gagal.");
    console.error(`   kode  : ${err.code || "-"}`);
    console.error(`   pesan : ${err.message}`);
    console.error(`   saran : ${explainDatabaseError(err)}`);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

async function main() {
  const connectionString = resolveConnectionString(process.argv);
  const error = validate(connectionString);

  if (error) {
    console.error(`❌ ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`📝 Menulis DATABASE_URL ke ${ENV_PATH}`);
  console.log(`   ${maskConnectionString(connectionString.trim())}`);
  writeEnv(connectionString);

  await testConnection(connectionString);
}

main();
