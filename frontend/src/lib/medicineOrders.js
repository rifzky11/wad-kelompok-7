/**
 * Aturan khusus pesanan obat:
 * - Tidak perlu memilih tanggal kunjungan, pesanan bisa diambil kapan saja.
 * - Batas pengambilan maksimal 2 hari sejak pemesanan.
 * - Jika tidak diambil, pesanan hangus dan stok produk tidak dikembalikan.
 */

export const MEDICINE_CATEGORY = "obat";
export const MEDICINE_PICKUP_DAYS = 2;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function isMedicineCategory(category) {
  return String(category || "").trim().toLowerCase() === MEDICINE_CATEGORY;
}

export function isMedicineOrder(order) {
  return isMedicineCategory(order?.services?.category);
}

/**
 * Ambil batas pengambilan pesanan obat sebagai Date.
 * Memakai `batas_pengambilan` dari API; bila belum ada (data lama) dihitung
 * dari `created_at` + 2 hari.
 * @returns {Date|null}
 */
export function getPickupDeadline(order) {
  if (!isMedicineOrder(order)) return null;

  if (order.batas_pengambilan) {
    const fromServer = new Date(order.batas_pengambilan);
    if (!Number.isNaN(fromServer.getTime())) return fromServer;
  }

  if (order.created_at) {
    const orderedAt = new Date(order.created_at);
    if (!Number.isNaN(orderedAt.getTime())) {
      return new Date(orderedAt.getTime() + MEDICINE_PICKUP_DAYS * DAY_IN_MS);
    }
  }

  return null;
}

/**
 * Pesanan obat dianggap hangus bila statusnya "expired" atau batas
 * pengambilannya sudah terlewat. Pesanan yang sudah selesai tidak hangus.
 */
export function isMedicineOrderExpired(order) {
  if (!isMedicineOrder(order)) return false;
  if (order.status === "expired") return true;
  if (order.status === "completed") return false;

  const deadline = getPickupDeadline(order);
  return Boolean(deadline && deadline.getTime() <= Date.now());
}

export function formatDateTimeId(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPickupDeadline(order) {
  const deadline = getPickupDeadline(order);
  return deadline ? formatDateTimeId(deadline) : "-";
}

/**
 * Perkiraan batas pengambilan untuk pesanan yang baru akan dibuat
 * (dipakai sebagai info di form pemesanan).
 */
export function getEstimatedPickupDeadline() {
  return new Date(Date.now() + MEDICINE_PICKUP_DAYS * DAY_IN_MS);
}
