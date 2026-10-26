import { toPng } from "html-to-image";
import { useEffect, useState } from "react";
import { getServiceDoctorSchedule } from "../data/doctors";

function CashierReceiptModal({ order, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const service = order.services || {};
  const patient = order.patients || {};
  const doctorInfo = getServiceDoctorSchedule(service);

  const formattedOrderId = `SEH-${String(order.id).padStart(5, "0")}`;
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-xs"
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
            width: 320px !important;
            margin: 0 !important;
            padding: 16px !important;
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

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-6 flex flex-col items-center"
      >
        {/* Floating Action Buttons Bar (No-Print) */}
        <div className="no-print mb-3 flex w-full items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
            >
              <span>🖨️</span> Cetak Struk
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-slate-900 active:scale-95"
            >
              <span>⬇️</span> {isDownloading ? "Menyiapkan..." : "Download PNG"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100"
            >
              Tutup ✕
            </button>
          </div>
        </div>

        {/* The Thermal Cashier Receipt Container */}
        <div
          id="cashier-thermal-receipt"
          className="w-full max-w-[340px] rounded-lg bg-white p-5 font-mono text-[11px] leading-relaxed text-slate-800 shadow-2xl border border-slate-200"
        >
          {/* Header Struk */}
          <div className="text-center">
            <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-sm font-black text-white">
              +
            </div>
            <h2 className="text-sm font-black tracking-wider text-slate-900">
              KLINIK SEHATIN
            </h2>
            <p className="text-[10px] text-slate-500">
              Jl. Rasuna Said No. 7, Jakarta Selatan
            </p>
            <p className="text-[10px] text-slate-500">
              Telp: (021) 7788-9900 • WA: 0812-7777-2026
            </p>
            <p className="text-[9px] text-slate-400">
              www.sehatin.id • Izin Klinik: 445/07/DKS/2026
            </p>
          </div>

          <div className="my-2 border-b border-dashed border-slate-400"></div>

          {/* Judul & Info Transaksi */}
          <div className="text-center font-bold tracking-wider text-slate-900">
            STRUK RESERVASI LAYANAN
          </div>
          <div className="my-1.5 border-b border-dashed border-slate-300"></div>

          <div className="space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>No. Transaksi</span>
              <span className="font-bold text-slate-900">#{formattedOrderId}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu Cetak</span>
              <span className="text-[10px] text-slate-500">{printDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir / Loket</span>
              <span>POS-01 (Klinik)</span>
            </div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-400"></div>

          {/* Informasi Pasien */}
          <div className="space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>Nama Pasien</span>
              <span className="font-bold text-slate-900 truncate max-w-[170px]">
                {patient.nama_lengkap || "Pasien Sehatin"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>No. Rekam Medis</span>
              <span className="font-semibold text-slate-800">
                {patient.no_rm || `RM-${String(order.id).padStart(6, "0")}`}
              </span>
            </div>
            {patient.no_telp && (
              <div className="flex justify-between">
                <span>No. Telepon</span>
                <span>{patient.no_telp}</span>
              </div>
            )}
          </div>

          <div className="my-2 border-b border-dashed border-slate-400"></div>

          {/* Rincian Layanan Medis */}
          <div className="space-y-1.5">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              Layanan Medis
            </div>
            <div className="font-bold text-slate-900 text-xs">
              {service.title || "Layanan Medis"}
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Kategori</span>
              <span className="uppercase font-semibold text-emerald-700">
                {service.category || "Umum"}
              </span>
            </div>

            {/* Khusus Pelayanan Medis Konsultasi & Pemeriksaan: Jadwal Dokter */}
            {doctorInfo && (
              <div className="my-1 rounded-sm bg-slate-50 p-2 border border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-500">Dokter :</span>
                  <span className="font-bold text-slate-900 text-right">
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

            <div className="flex justify-between text-slate-700">
              <span>Jadwal Kunjungan</span>
              <span className="font-bold text-slate-900">
                {order.tanggal_kunjungan} {order.jam_kunjungan}
              </span>
            </div>

            {order.keluhan && (
              <div className="text-[10px] text-slate-500 italic">
                Keluhan: &ldquo;{order.keluhan}&rdquo;
              </div>
            )}
          </div>

          <div className="my-2 border-b border-dashed border-slate-400"></div>

          {/* Rincian Tarif / Biaya Kasir */}
          <div className="space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>1x {service.title || "Layanan"}</span>
              <span>Rp {priceNumber.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Biaya Registrasi / Loket</span>
              <span>Rp 0 (GRATIS)</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Pajak (PPN 0%)</span>
              <span>Rp 0</span>
            </div>

            <div className="my-1.5 border-b-2 border-slate-800"></div>

            <div className="flex justify-between text-xs font-black text-slate-900">
              <span>TOTAL PEMBAYARAN</span>
              <span>Rp {priceNumber.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Metode Pembayaran</span>
              <span>KASIR / TUNAI / QRIS</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span>STATUS PESANAN</span>
              <span className="text-emerald-700">
                [ {getStatusBadge(order.status)} ]
              </span>
            </div>
          </div>

          <div className="my-3 border-b border-dashed border-slate-400"></div>

          {/* Barcode Kasir */}
          <div className="text-center">
            {/* Realistic Barcode Stripes */}
            <div
              className="mx-auto flex h-10 w-44 items-center justify-center gap-[2px] overflow-hidden py-1"
              aria-hidden="true"
            >
              {[
                3, 1, 2, 1, 4, 1, 2, 3, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3, 1,
                2, 1, 3, 2, 1, 4, 1, 2, 3, 1,
              ].map((w, idx) => (
                <div
                  key={idx}
                  className="h-full bg-slate-900"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <div className="text-[9px] tracking-widest text-slate-500">
              *{formattedOrderId}*
            </div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300"></div>

          {/* Footer Struk */}
          <div className="space-y-1 text-center text-[10px] text-slate-500">
            <p className="font-bold text-slate-700">
              *** TERIMA KASIH ATAS KUNJUNGAN ANDA ***
            </p>
            <p>Semoga Lekas Sembuh & Sehat Selalu</p>
            <p className="text-[9px] text-slate-400">
              Harap tunjukkan struk ini kepada petugas resepsionis/kasir saat
              tiba di klinik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashierReceiptModal;
