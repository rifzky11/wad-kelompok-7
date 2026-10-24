import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

function Dashboard({ session, onLogout }) {
  const isAdmin = session?.role === "admin";
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    apiRequest("/api/appointments")
      .then((result) => setOrders(result.data || []))
      .catch((error) => setOrdersError(error.message));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await apiRequest(`/api/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    } catch (error) {
      setOrdersError(error.message);
    }
  };

  const isMedicineOrder = (order) => order.services?.category === "obat";
  const getOrderStatus = (order) =>
    isMedicineOrder(order) ? (order.status === "completed" ? "completed" : "confirmed") : (order.status || "pending");

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

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Layanan medis
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Pemeriksaan dan konsultasi berbasis kuota
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Semua layanan dikelola berdasarkan kuota. Tidak ada pemilihan
            tanpa pengelolaan jadwal tenaga medis, sehingga proses administrasi
            lebih sederhana.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            {isAdmin ? "Akses admin" : "Akses pasien"}
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            {isAdmin ? "Kelola layanan medis" : "Lihat layanan medis"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Buka halaman Layanan Medis untuk melihat tarif dan kuota yang
            tersedia{isAdmin ? ", atau menambah dan mengubah layanan." : "."}
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              {isAdmin ? "Pesanan pasien" : "Pesanan saya"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Daftar pesanan</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{orders.length} pesanan</span>
        </div>
        {ordersError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{ordersError}</p>}
        {!ordersError && orders.length === 0 && <p className="mt-5 text-sm text-slate-500">Belum ada pesanan.</p>}
        {orders.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-3 py-3">Pesanan</th><th className="px-3 py-3">Pasien</th><th className="px-3 py-3">Jadwal</th><th className="px-3 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900">#{order.id}<span className="block font-normal text-slate-500">{order.services?.title || "Layanan"}</span></td>
                    <td className="px-3 py-3 text-slate-600">{order.patients?.nama_lengkap || "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{order.tanggal_kunjungan}<span className="block">{order.jam_kunjungan}</span></td>
                    <td className="px-3 py-3">
                      {isAdmin ? (
                        <select value={getOrderStatus(order)} onChange={(event) => updateStatus(order.id, event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold">
                          {!isMedicineOrder(order) && <option value="pending">Menunggu</option>}
                          <option value="confirmed">Dikonfirmasi</option>
                          <option value="completed">Selesai</option>
                          {!isMedicineOrder(order) && <option value="cancelled">Dibatalkan</option>}
                        </select>
                      ) : <span className="font-semibold capitalize text-emerald-700">{getOrderStatus(order)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
