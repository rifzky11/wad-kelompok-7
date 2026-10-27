const { Pool, types } = require("pg");

// Parse PostgreSQL DATE (OID 1082) as plain 'YYYY-MM-DD' string bukannya Date object (yang jadi ISO 2026-10-30T17:00:00.000Z saat serialize ke JSON)
types.setTypeParser(1082, (val) => val);

const CONNECTION_HINT = [
  "Buka Supabase Dashboard > Project Settings > Database > Connection string > URI,",
  "lalu salin ke backend/.env sebagai DATABASE_URL. Contoh:",
  "  DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres",
  'Tambahkan juga DATABASE_SSL=true (atau "false" bila memakai PostgreSQL lokal).',
  "Jika password mengandung karakter khusus (&, @, #, /, :), encode dulu dengan encodeURIComponent().",
].join("\n");

/**
 * Tampilkan target koneksi tanpa membocorkan password, berguna untuk log error.
 * @param {string} [connectionString]
 * @returns {string}
 */
function describeDatabaseTarget(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) return "(DATABASE_URL belum diisi)";

  try {
    const url = new URL(connectionString);
    const port = url.port || "5432";
    const database = url.pathname.replace(/^\//, "") || "postgres";
    return `${url.hostname}:${port}/${database}`;
  } catch {
    return "(format DATABASE_URL tidak valid)";
  }
}

if (!process.env.DATABASE_URL) {
  console.error(`❌ DATABASE_URL tidak ditemukan di environment.\n${CONNECTION_HINT}`);
} else if (!/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL.trim())) {
  console.error(
    "❌ DATABASE_URL harus diawali dengan postgresql:// atau postgres://.\n" + CONNECTION_HINT
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle pg client:", err.message);
});

/**
 * Jalankan query SQL dengan parameter.
 * @param {string} text - Query SQL
 * @param {Array} [params] - Parameter query (opsional)
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Pesan bantuan berdasarkan kode error PostgreSQL / driver pg.
 * Dipakai oleh ensureDb dan src/checkDb.js agar penyebab gagal koneksi jelas.
 * @param {NodeJS.ErrnoException & { code?: string }} err
 * @returns {string}
 */
function explainDatabaseError(err) {
  const code = err?.code;

  switch (code) {
    case "28P01":
    case "28000":
      return "Password/user database ditolak. Periksa kembali password pada DATABASE_URL (bila lupa: Supabase Dashboard > Project Settings > Database > Reset database password).";
    case "3D000":
      return "Nama database pada DATABASE_URL tidak ada. Gunakan database default Supabase: postgres.";
    case "XX000":
      return "Project/tenant tidak ditemukan di host pooler tersebut. Pastikan region pada host pooler sesuai dengan region project (mis. aws-0-ap-northeast-1.pooler.supabase.com).";
    case "ENOTFOUND":
      return "Host pada DATABASE_URL tidak dapat di-resolve. Periksa penulisan host/region.";
    case "ECONNREFUSED":
      return "Koneksi ditolak. Periksa port (6543 untuk transaction pooler, 5432 untuk session pooler/direct).";
    case "ETIMEDOUT":
    case "EHOSTUNREACH":
      return "Koneksi timeout. Jaringan/firewall memblokir host database, atau host/port salah.";
    case "SELF_SIGNED_CERT_IN_CHAIN":
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
      return "Sertifikat SSL tidak dipercaya. Set DATABASE_SSL=true di .env.";
    default:
      if (/timeout/i.test(err?.message || "") && /terminating connection/i.test(err?.message || "")) {
        return "Koneksi timeout saat handshake. Coba port 5432 (session pooler) atau periksa jaringan.";
      }
      return "Periksa kembali DATABASE_URL dan DATABASE_SSL di backend/.env.";
  }
}

module.exports = { pool, query, describeDatabaseTarget, explainDatabaseError };
