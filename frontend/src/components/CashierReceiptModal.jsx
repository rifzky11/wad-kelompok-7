import { toPng } from "html-to-image";
import { useEffect, useState } from "react";
import { getServiceDoctorSchedule } from "../data/doctors";
import {
  MEDICINE_PICKUP_DAYS,
  formatPickupDeadline,
  isMedicineOrder,
  isMedicineOrderExpired,
} from "../lib/medicineOrders";

function CashierReceiptModal({ order, onClose, onUpdateStatus, isAdmin = false }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!currentOrder) return null;

  const service = currentOrder.services || {};
  const patient = currentOrder.patients || {};
  const doctorInfo = getServiceDoctorSchedule(service);
  const isMedicine = isMedicineOrder(currentOrder);
  const isExpired = isMedicineOrderExpired(currentOrder);
  const displayStatus = isExpired ? "expired" : currentOrder.status;

  const formattedOrderId = `SEH-${String(currentOrder.id).padStart(5, "0")}`;
  const receiptCode = currentOrder.kode_unik || formattedOrderId;
  const printDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const priceNumber = Number(service.price || 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return "DIKONFIRMASI";
      case "completed":
        return "SELESAI (LUNAS)";
      case "cancelled":
        return "DIBATALKAN";
      case "expired":
        return "HANGUS (TIDAK DIAMBIL)";
      default:
        return "MENUNGGU KONFIRMASI";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const receiptElement = document.getElementById("cashier-thermal-receipt");
    if (!receiptElement) return;

    setIsDownloading(true);
    try {
      const downloadUrl = await toPng(receiptElement, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `struk-${formattedOrderId}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal membuat gambar struk:", error);
      window.alert("Struk gagal diunduh sebagai PNG. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSetStatus = async (newStatus) => {
    if (!currentOrder?.id) return;
    setIsUpdatingStatus(true);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(currentOrder.id, newStatus);
      }
      setCurrentOrder((prev) => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("Gagal memperbarui status pesanan:", error);
      window.alert(error.message || "Gagal memperbarui status pesanan.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 p-3 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      {/* Isolated Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #cashier-thermal-receipt,
          #cashier-thermal-receipt * {
            visibility: visible !important;
          }
          #cashier-thermal-receipt {
            position: fixed !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 280px !important;
            margin: 0 !important;
            padding: 12px !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex min-h-full items-center justify-center py-4 sm:py-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-w-[290px] flex-col items-center"
        >
          {/* Action Buttons Bar (No-Print) */}
          <div className="no-print mb-2.5 flex w-full flex-col gap-1.5">
            <div className="flex w-full items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                title="Cetak struk ke printer thermal"
              >
                <span>🖨️</span> Cetak
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 px-2 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-slate-900 active:scale-95 disabled:opacity-60"
                title="Download struk sebagai gambar PNG"
              >
                <span>⬇️</span> {isDownloading ? "..." : "PNG"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 active:scale-95"
              >
                Tutup ✕
              </button>
            </div>

            {/* Quick Status Action for Admin */}
            {isAdmin && onUpdateStatus && (
              isExpired ? (
                <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700">
                  <span>⛔</span> Pesanan hangus — stok tidak dikembalikan
                </div>
              ) : (
                <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px]">
                  {currentOrder.status === "completed" ? (
                    <div className="flex w-full items-center justify-between">
                      <span className="font-bold text-emerald-800 flex items-center gap-1 text-[11px]">
                        <span>✓</span> Status: Selesai
                      </span>
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleSetStatus("confirmed")}
                        className="text-[10px] text-slate-500 underline hover:text-slate-800"
                      >
                        Batal Selesai
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleSetStatus("completed")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 py-1 font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                    >
                      <span>✅</span> {isUpdatingStatus ? "Menyimpan..." : "Selesaikan Pesanan"}
                    </button>
                  )}
                </div>
              )
            )}
          </div>

          {/* Compact Thermal Cashier Receipt Container */}
          <div
            id="cashier-thermal-receipt"
            className="w-full max-w-[285px] rounded-lg bg-white p-3.5 font-mono text-[9.5px] leading-tight text-slate-800 shadow-xl border border-slate-200"
          >
            {/* Header Struk */}
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-xs font-black text-white">
                +
              </div>
              <h2 className="text-xs font-black tracking-wide text-slate-900">
                KLINIK SEHATIN
              </h2>
              <p className="text-[8.5px] text-slate-500">
                Jl. Rasuna Said No. 7, Jakarta Selatan
              </p>
              <p className="text-[8.5px] text-slate-500">
                Telp: (021) 7788-9900 • WA: 0812-7777-2026
              </p>
              <p className="text-[8px] text-slate-400">
                www.sehatin.id • Izin: 445/07/DKS/2026
              </p>
            </div>

            <div className="my-1.5 border-b border-dashed border-slate-300"></div>

            {/* Judul & Info Transaksi */}
            <div className="text-center font-bold tracking-wider text-slate-900 text-[9.5px]">
              {isMedicine ? "STRUK PESANAN OBAT" : "STRUK RESERVASI LAYANAN"}
            </div>
            <div className="my-1 border-b border-dashed border-slate-200"></div>

            <div className="space-y-0.5 text-slate-700">
              <div className="flex justify-between">
                <span>No. Transaksi</span>
                <span className="font-bold text-slate-900">#{formattedOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Kode Unik Struk</span>
                <span className="font-bold text-slate-900">{receiptCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu Cetak</span>
                <span className="text-[8.5px] text-slate-500">{printDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir / Loket</span>
                <span>POS-01 (Klinik)</span>
              </div>
            </div>

            <div className="my-1.5 border-b border-dashed border-slate-300"></div>

            {/* Informasi Pasien */}
            <div className="space-y-0.5 text-slate-700">
              <div className="flex justify-between">
                <span>Nama Pasien</span>
                <span className="font-bold text-slate-900 truncate max-w-[145px]">
                  {patient.nama_lengkap || "Pasien Sehatin"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>No. Rekam Medis</span>
                <span className="font-semibold text-slate-800">
                  {patient.no_rm || `RM-${String(currentOrder.id).padStart(6, "0")}`}
                </span>
              </div>
              {patient.no_telp && (
                <div className="flex justify-between">
                  <span>No. Telepon</span>
                  <span>{patient.no_telp}</span>
                </div>
              )}
            </div>

            <div className="my-1.5 border-b border-dashed border-slate-300"></div>

            {/* Rincian Layanan Medis */}
            <div className="space-y-1">
              <div className="text-slate-400 text-[8.5px] font-bold uppercase tracking-wider">
                Layanan Medis
              </div>
              <div className="font-bold text-slate-900 text-[10.5px]">
                {service.title || "Layanan Medis"}
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kategori</span>
                <span className="uppercase font-semibold text-emerald-700">
                  {service.category || "Umum"}
                </span>
              </div>

              {/* Jadwal Dokter Jika Ada */}
              {doctorInfo && (
                <div className="my-1 rounded-sm bg-slate-50 p-1.5 border border-dashed border-slate-300 space-y-0.5 text-[8.5px]">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-slate-500">Dokter :</span>
                    <span className="font-bold text-slate-900 text-right truncate max-w-[140px]">
                      {doctorInfo.doctor}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-slate-500">Spesialis :</span>
                    <span className="text-slate-700 text-right">
                      {doctorInfo.specialty}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-slate-500">Jadwal :</span>
                    <span className="font-semibold text-emerald-800 text-right">
                      {doctorInfo.schedule}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-slate-500">Ruangan :</span>
                    <span className="text-slate-700 text-right">
                      {doctorInfo.room}
                    </span>
                  </div>
                </div>
              )}

              {isMedicine ? (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>Pengambilan</span>
                    <span className="font-bold text-slate-900">Kapan saja</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Batas Ambil</span>
                    <span className={`font-bold ${isExpired ? "text-rose-600" : "text-slate-900"}`}>
                      {formatPickupDeadline(currentOrder)}
                    </span>
                  </div>
                  <p className="text-[8px] italic leading-tight text-slate-500">
                    Maksimal {MEDICINE_PICKUP_DAYS} hari sejak pemesanan. Jika tidak diambil,
                    pesanan hangus dan stok obat tidak dikembalikan.
                  </p>
                </>
              ) : (
                <div className="flex justify-between text-slate-700">
                  <span>Jadwal Kunjungan</span>
                  <span className="font-bold text-slate-900">
                    {currentOrder.tanggal_kunjungan?.includes("T")
                      ? currentOrder.tanggal_kunjungan.split("T")[0]
                      : currentOrder.tanggal_kunjungan}{" "}
                    {currentOrder.jam_kunjungan}
                  </span>
                </div>
              )}

              {currentOrder.keluhan && (
                <div className="text-[8.5px] text-slate-500 italic truncate max-w-[250px]">
                  Keluhan: &ldquo;{currentOrder.keluhan}&rdquo;
                </div>
              )}
            </div>

            <div className="my-1.5 border-b border-dashed border-slate-300"></div>

            {/* Rincian Tarif / Biaya Kasir */}
            <div className="space-y-0.5 text-slate-700">
              <div className="flex justify-between">
                <span>1x {service.title || "Layanan"}</span>
                <span>Rp {priceNumber.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-[8.5px] text-slate-500">
                <span>Biaya Loket / Registrasi</span>
                <span>Rp 0 (GRATIS)</span>
              </div>
              <div className="flex justify-between text-[8.5px] text-slate-500">
                <span>Pajak (PPN 0%)</span>
                <span>Rp 0</span>
              </div>

              <div className="my-1 border-b-2 border-slate-800"></div>

              <div className="flex justify-between text-[10.5px] font-black text-slate-900">
                <span>TOTAL PEMBAYARAN</span>
                <span>Rp {priceNumber.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-[8.5px] text-slate-600">
                <span>Metode Pembayaran</span>
                <span>KASIR / TUNAI / QRIS</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold mt-0.5">
                <span>STATUS PESANAN</span>
                <span
                  className={
                    displayStatus === "completed"
                      ? "text-emerald-700"
                      : displayStatus === "confirmed"
                      ? "text-blue-700"
                      : displayStatus === "cancelled" || displayStatus === "expired"
                      ? "text-rose-600"
                      : "text-amber-700"
                  }
                >
                  [ {getStatusBadge(displayStatus)} ]
                </span>
              </div>
            </div>

            <div className="my-2 border-b border-dashed border-slate-300"></div>

            {/* Barcode Kasir */}
            <div className="text-center">
              <div
                className="mx-auto flex h-7 w-36 items-center justify-center gap-[1.5px] overflow-hidden py-0.5"
                aria-hidden="true"
              >
                {[
                  3, 1, 2, 1, 4, 1, 2, 3, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3, 1,
                  2, 1, 3, 2, 1, 4, 1, 2, 3, 1,
                ].map((w, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-slate-900"
                    style={{ width: `${Math.max(1, Math.round(w * 0.8))}px` }}
                  />
                ))}
              </div>
              <div className="text-[8px] tracking-widest text-slate-500 mt-0.5">
                *{receiptCode}*
              </div>
            </div>

            <div className="my-1.5 border-b border-dashed border-slate-300"></div>

            {/* Footer Struk */}
            <div className="space-y-0.5 text-center text-[8.5px] text-slate-500">
              <p className="font-bold text-slate-700 text-[9px]">
                {isMedicine
                  ? "*** TERIMA KASIH ATAS PESANAN ANDA ***"
                  : "*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***"}
              </p>
              <p>Semoga Lekas Sembuh & Sehat Selalu</p>
              <p className="text-[8px] text-slate-400">
                {isMedicine
                  ? "Harap tunjukkan struk ini kepada petugas apotek/kasir saat mengambil obat."
                  : "Harap tunjukkan struk ini kepada petugas resepsionis/kasir saat tiba di klinik."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashierReceiptModal;
