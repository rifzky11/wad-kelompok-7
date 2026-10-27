const { query } = require("../db");

const MEDICINE_CATEGORY = "obat";
const MEDICINE_PICKUP_DAYS = 2;

/**
 * Cek apakah sebuah kategori layanan termasuk pesanan obat.
 * @param {string} [category]
 * @returns {boolean}
 */
function isMedicineCategory(category) {
  return String(category || "").trim().toLowerCase() === MEDICINE_CATEGORY;
}

/**
 * Tandai pesanan obat yang melewati batas pengambilan sebagai "expired" (hangus).
 *
 * Aturan bisnis: pesanan obat bisa diambil kapan saja, maksimal 2 hari sejak
 * pemesanan. Jika tidak diambil, pesanan hangus dan stok produk TIDAK
 * dikembalikan. Karena itu fungsi ini sengaja tidak menyentuh kolom `kuota`;
 * stok sudah terpotong saat pesanan dibuat dan tetap hangus bersama pesanannya.
 *
 * @returns {Promise<number>} jumlah pesanan yang baru ditandai hangus
 */
async function expireOverdueMedicineOrders() {
  const result = await query(
    `UPDATE appointments AS a
        SET status = 'expired'
       FROM services AS s
      WHERE a.service_id = s.id
        AND s.category = $1
        AND a.status IN ('pending', 'confirmed')
        AND a.batas_pengambilan IS NOT NULL
        AND a.batas_pengambilan <= NOW()
      RETURNING a.id`,
    [MEDICINE_CATEGORY]
  );

  return result.rowCount;
}

module.exports = {
  MEDICINE_CATEGORY,
  MEDICINE_PICKUP_DAYS,
  isMedicineCategory,
  expireOverdueMedicineOrders,
};
