import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import CashierReceiptModal from "../components/CashierReceiptModal";

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
  const [isLookingUpReceipt, setIsLookingUpReceipt] = useState(false);

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
    } catch (error) {
      setOrdersError(error.message);
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
    setIsLookingUpReceipt(true);
    try {
      const result = await apiRequest(
        `/api/appointments/receipt/${encodeURIComponent(code)}`,
      );
      setSelectedReceiptOrder(result.data);
    } catch (error) {
      setReceiptLookupError(error.message);
    } finally {
      setIsLookingUpReceipt(false);
    }
  };

  const isMedicineOrder = (order) => order.services?.category === "obat";
  const getOrderStatus = (order) =>
    isMedicineOrder(order)
      ? order.status === "completed"
        ? "completed"
        : "confirmed"
      : order.status || "pending";

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
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Keluar
        </button>
      </div>

      {isAdmin && (
        <section className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              Verifikasi struk
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Scan struk dengan kode unik
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Masukkan kode unik yang tercetak pada struk untuk membuka data
              pesanan pasien.
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
              placeholder="Contoh: STRK-A1B2C3D4E5"
              maxLength={32}
              className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm uppercase tracking-wider text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="submit"
              disabled={isLookingUpReceipt}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLookingUpReceipt ? "Mencari..." : "Cari Struk"}
            </button>
          </form>
          {receiptLookupError && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {receiptLookupError}
            </p>
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
                      {order.tanggal_kunjungan?.includes("T") ? order.tanggal_kunjungan.split("T")[0] : order.tanggal_kunjungan}
                      <span className="block text-xs text-slate-400">
                        {order.jam_kunjungan}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {isAdmin ? (
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
                      ) : (
                        <span className="font-semibold capitalize text-emerald-700">
                          {getOrderStatus(order)}
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
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </main>
  );
}

export default Dashboard;
