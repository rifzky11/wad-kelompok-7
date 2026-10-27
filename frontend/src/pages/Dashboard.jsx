import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import CashierReceiptModal from "../components/CashierReceiptModal";
import {
  formatPickupDeadline,
  isMedicineOrder,
  isMedicineOrderExpired,
} from "../lib/medicineOrders";

function Dashboard({ session, onLogout }) {
  const isAdmin = session?.role === "admin";
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [receiptCode, setReceiptCode] = useState("");
  const [receiptLookupError, setReceiptLookupError] = useState("");
  const [receiptScanSuccess, setReceiptScanSuccess] = useState("");
  const [isLookingUpReceipt, setIsLookingUpReceipt] = useState(false);
  const [scannedReceiptOrder, setScannedReceiptOrder] = useState(null);
  const [isUpdatingScanStatus, setIsUpdatingScanStatus] = useState(false);

  useEffect(() => {
    apiRequest(`/api/appointments?page=${page}&limit=8`)
      .then((result) => {
        setOrders(result.data || []);
        setOrdersError("");
        setTotalOrders(result.meta?.totalData || 0);
        setTotalPages(result.meta?.totalPages || 1);
      })
      .catch((error) => setOrdersError(error.message));
  }, [page]);

  const updateStatus = async (id, status) => {
    try {
      await apiRequest(`/api/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, status } : order,
        ),
      );
      if (scannedReceiptOrder && scannedReceiptOrder.id === id) {
        setScannedReceiptOrder((prev) => ({ ...prev, status }));
      }
    } catch (error) {
      setOrdersError(error.message);
      throw error;
    }
  };

  const findReceipt = async (event) => {
    event.preventDefault();
    const code = receiptCode.trim();
    if (!code) {
      setReceiptLookupError("Masukkan kode unik yang tertera pada struk.");
      return;
    }

    setReceiptLookupError("");
    setReceiptScanSuccess("");
    setIsLookingUpReceipt(true);
    try {
      const result = await apiRequest(
        `/api/appointments/receipt/${encodeURIComponent(code)}`,
      );
      setScannedReceiptOrder(result.data);
    } catch (error) {
      setReceiptLookupError(error.message);
      setScannedReceiptOrder(null);
    } finally {
      setIsLookingUpReceipt(false);
    }
  };

  const handleQuickComplete = async (orderId) => {
    setIsUpdatingScanStatus(true);
    setReceiptLookupError("");
    try {
      await updateStatus(orderId, "completed");
      setReceiptScanSuccess("Pesanan berhasil diselesaikan!");
    } catch (error) {
      setReceiptLookupError(error.message || "Gagal menyelesaikan pesanan.");
    } finally {
      setIsUpdatingScanStatus(false);
    }
  };

  const handleScanStatusChange = async (orderId, newStatus) => {
    setIsUpdatingScanStatus(true);
    setReceiptLookupError("");
    try {
      await updateStatus(orderId, newStatus);
      setReceiptScanSuccess(`Status pesanan berhasil diubah menjadi: ${newStatus}`);
    } catch (error) {
      setReceiptLookupError(error.message || "Gagal mengubah status pesanan.");
    } finally {
      setIsUpdatingScanStatus(false);
    }
  };

  const getOrderStatus = (order) => {
    if (isMedicineOrder(order)) {
      if (order.status === "completed") return "completed";
      if (isMedicineOrderExpired(order)) return "expired";
      return "confirmed";
    }
    return order.status || "pending";
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelled":
      case "expired":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Selesai (Lunas)";
      case "confirmed":
        return "Dikonfirmasi";
      case "cancelled":
        return "Dibatalkan";
      case "expired":
        return "Hangus";
      default:
        return "Menunggu";
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Halo,{" "}
            {session?.profile?.nama_lengkap ||
              session?.user?.user_metadata?.nama_lengkap ||
              session?.role}
          </h1>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Keluar
        </button>
      </div>

      {isAdmin && (
        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Verifikasi Struk
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Scan struk dengan kode unik
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Masukkan kode unik yang tercetak pada struk untuk membuka data
              pesanan pasien dan mengubah status pesanan menjadi selesai.
            </p>
          </div>
          <form
            onSubmit={findReceipt}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="receipt-code">
              Kode unik struk
            </label>
            <input
              id="receipt-code"
              value={receiptCode}
              onChange={(event) =>
                setReceiptCode(event.target.value.toUpperCase())
              }
              placeholder="Contoh: STRK-A1B2C3D4E5 atau SEH-00007"
              maxLength={32}
              className="min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-sm uppercase tracking-wider text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="submit"
              disabled={isLookingUpReceipt}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
            >
              {isLookingUpReceipt ? "Mencari..." : "Cari Struk"}
            </button>
          </form>

          {receiptLookupError && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {receiptLookupError}
            </p>
          )}

          {receiptScanSuccess && (
            <p className="mt-3 rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 border border-emerald-300 font-medium">
              ✓ {receiptScanSuccess}
            </p>
          )}

          {/* Card Hasil Scan Struk */}
          {scannedReceiptOrder && (
            <div className="mt-5 rounded-xl border border-emerald-300 bg-white p-5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
                    🧾
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Pesanan #{scannedReceiptOrder.id}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Kode: {scannedReceiptOrder.kode_unik || `SEH-${String(scannedReceiptOrder.id).padStart(5, "0")}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusBadgeClass(
                      getOrderStatus(scannedReceiptOrder)
                    )}`}
                  >
                    {getStatusLabel(getOrderStatus(scannedReceiptOrder))}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setScannedReceiptOrder(null);
                      setReceiptScanSuccess("");
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-sm"
                    title="Tutup hasil verifikasi"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Rincian Pesanan */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="block text-slate-400 font-medium mb-0.5">Pasien</span>
                  <p className="font-bold text-slate-800 text-sm">
                    {scannedReceiptOrder.patients?.nama_lengkap || "-"}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    RM: {scannedReceiptOrder.patients?.no_rm || "-"}
                  </p>
                  {scannedReceiptOrder.patients?.no_telp && (
                    <p className="text-slate-500 text-[11px]">
                      Telp: {scannedReceiptOrder.patients.no_telp}
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="block text-slate-400 font-medium mb-0.5">Layanan</span>
                  <p className="font-bold text-slate-800 text-sm">
                    {scannedReceiptOrder.services?.title || "Layanan Medis"}
                  </p>
                  <p className="uppercase text-emerald-700 font-semibold text-[11px]">
                    {scannedReceiptOrder.services?.category || "Umum"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="block text-slate-400 font-medium mb-0.5">
                    {isMedicineOrder(scannedReceiptOrder) ? "Pengambilan & Keluhan" : "Jadwal & Keluhan"}
                  </span>
                  {isMedicineOrder(scannedReceiptOrder) ? (
                    <>
                      <p className="font-semibold text-slate-800">Ambil kapan saja</p>
                      <p
                        className={`text-[11px] ${
                          isMedicineOrderExpired(scannedReceiptOrder)
                            ? "font-bold text-rose-600"
                            : "text-slate-500"
                        }`}
                      >
                        {isMedicineOrderExpired(scannedReceiptOrder) ? "Hangus sejak " : "Batas ambil "}
                        {formatPickupDeadline(scannedReceiptOrder)}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-slate-800">
                      {scannedReceiptOrder.tanggal_kunjungan?.includes("T")
                        ? scannedReceiptOrder.tanggal_kunjungan.split("T")[0]
                        : scannedReceiptOrder.tanggal_kunjungan}{" "}
                      {scannedReceiptOrder.jam_kunjungan}
                    </p>
                  )}
                  {scannedReceiptOrder.keluhan && (
                    <p className="text-slate-500 italic text-[11px] truncate">
                      &ldquo;{scannedReceiptOrder.keluhan}&rdquo;
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-2.5">
                  <span className="block text-emerald-700 font-medium mb-0.5">Total Biaya</span>
                  <p className="font-extrabold text-emerald-900 text-base">
                    Rp {Number(scannedReceiptOrder.services?.price || 0).toLocaleString("id-ID")}
                  </p>
                  <p className="text-slate-500 text-[11px]">Metode: Kasir/Tunai</p>
                </div>
              </div>

              {/* Action Bar Admin untuk Selesaikan Pesanan */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {getOrderStatus(scannedReceiptOrder) === "expired" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200">
                      <span>⛔</span> Pesanan hangus — stok tidak dikembalikan
                    </span>
                  ) : scannedReceiptOrder.status !== "completed" ? (
                    <button
                      type="button"
                      disabled={isUpdatingScanStatus}
                      onClick={() => handleQuickComplete(scannedReceiptOrder.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                    >
                      <span>✅</span> {isUpdatingScanStatus ? "Menyelesaikan..." : "Selesaikan Pesanan"}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                      <span>✓</span> Pesanan Sudah Selesai
                    </span>
                  )}

                  {/* Dropdown status pesanan */}
                  {getOrderStatus(scannedReceiptOrder) !== "expired" && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span>Ubah status:</span>
                      <select
                        value={getOrderStatus(scannedReceiptOrder)}
                        disabled={isUpdatingScanStatus}
                        onChange={(e) =>
                          handleScanStatusChange(scannedReceiptOrder.id, e.target.value)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                      >
                        {!isMedicineOrder(scannedReceiptOrder) && (
                          <option value="pending">Menunggu</option>
                        )}
                        <option value="confirmed">Dikonfirmasi</option>
                        <option value="completed">Selesai</option>
                        {!isMedicineOrder(scannedReceiptOrder) && (
                          <option value="cancelled">Dibatalkan</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(scannedReceiptOrder)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white shadow-xs active:scale-95"
                >
                  <span>🧾</span> Preview Struk
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              {isAdmin ? "Pesanan pasien" : "Pesanan saya"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Daftar pesanan
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {totalOrders} pesanan
          </span>
        </div>
        {ordersError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {ordersError}
          </p>
        )}
        {!ordersError && orders.length === 0 && (
          <p className="mt-5 text-sm text-slate-500">Belum ada pesanan.</p>
        )}
        {orders.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3">Pesanan</th>
                  <th className="px-3 py-3">Pasien</th>
                  <th className="px-3 py-3">Jadwal</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      #{order.id}
                      <span className="block font-normal text-slate-500">
                        {order.services?.title || "Layanan"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {order.patients?.nama_lengkap || "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {isMedicineOrder(order) ? (
                        <>
                          <span className="font-medium text-slate-700">Ambil kapan saja</span>
                          <span
                            className={`block text-xs ${
                              isMedicineOrderExpired(order)
                                ? "font-semibold text-rose-600"
                                : "text-slate-400"
                            }`}
                          >
                            {isMedicineOrderExpired(order) ? "Hangus sejak " : "Batas ambil "}
                            {formatPickupDeadline(order)}
                          </span>
                        </>
                      ) : (
                        <>
                          {order.tanggal_kunjungan?.includes("T")
                            ? order.tanggal_kunjungan.split("T")[0]
                            : order.tanggal_kunjungan}
                          <span className="block text-xs text-slate-400">
                            {order.jam_kunjungan}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isAdmin ? (
                        isMedicineOrder(order) && getOrderStatus(order) === "expired" ? (
                          <span className="font-semibold text-rose-700" title="Melewati batas pengambilan 2 hari">
                            Hangus
                          </span>
                        ) : (
                          <select
                            value={getOrderStatus(order)}
                            onChange={(event) =>
                              updateStatus(order.id, event.target.value)
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                          >
                            {!isMedicineOrder(order) && (
                              <option value="pending">Menunggu</option>
                            )}
                            <option value="confirmed">Dikonfirmasi</option>
                            <option value="completed">Selesai</option>
                            {!isMedicineOrder(order) && (
                              <option value="cancelled">Dibatalkan</option>
                            )}
                          </select>
                        )
                      ) : (
                        <span
                          className={`font-semibold capitalize ${
                            getOrderStatus(order) === "expired"
                              ? "text-rose-700"
                              : getOrderStatus(order) === "cancelled"
                              ? "text-rose-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {getStatusLabel(getOrderStatus(order))}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white shadow-xs active:scale-95"
                        title="Cetak Struk Kasir"
                      >
                        <span>🧾</span> Cetak Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm font-medium text-slate-600">
              Halaman {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((previous) => Math.min(totalPages, previous + 1))
              }
              disabled={page >= totalPages}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        )}
      </section>

      {/* Modal Cetak Struk Kasir */}
      {selectedReceiptOrder && (
        <CashierReceiptModal
          order={selectedReceiptOrder}
          isAdmin={isAdmin}
          onUpdateStatus={async (id, newStatus) => {
            await updateStatus(id, newStatus);
            if (scannedReceiptOrder && scannedReceiptOrder.id === id) {
              setScannedReceiptOrder((prev) => ({ ...prev, status: newStatus }));
            }
          }}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </main>
  );
}

export default Dashboard;
