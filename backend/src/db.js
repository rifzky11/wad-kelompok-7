const { Pool, types } = require("pg");

// Parse PostgreSQL DATE (OID 1082) as plain 'YYYY-MM-DD' string bukannya Date object (yang jadi ISO 2026-10-30T17:00:00.000Z saat serialize ke JSON)
types.setTypeParser(1082, (val) => val);

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL tidak ditemukan di environment. Pastikan file .env sudah ada dan berisi DATABASE_URL yang benar."
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

module.exports = { pool, query };
