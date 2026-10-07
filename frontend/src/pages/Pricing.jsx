import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

function LayananMedis() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    image: "",
  });

  // Fetch daftar layanan
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/services`);
      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.message || "Gagal memuat layanan medis.");
      }

      setServices(resJson.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  };

  // Open modal create
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      price: "",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
    });
    setIsModalOpen(true);
  };

  // Open modal edit
  const handleOpenEditModal = (service) => {
    setEditingId(service.id);
    setFormData({
      title: service.title,
      price: service.price,
      image: service.image || "",
    });
    setIsModalOpen(true);
  };

  // Submit modal (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      alert("Nama layanan dan tarif wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingId
        ? `${API_URL}/api/services/${editingId}`
        : `${API_URL}/api/services`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          price: Number(formData.price),
          image: formData.image,
        }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.message || "Terjadi kesalahan saat menyimpan data.");
      }

      showNotification(
        "success",
        editingId
          ? "Data layanan berhasil diperbarui!"
          : "Layanan baru berhasil ditambahkan!"
      );
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Service
  const handleDelete = async (id, title) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus layanan "${title}"?`
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/services/${id}`, {
        method: "DELETE",
      });
      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.message || "Gagal menghapus layanan.");
      }

      showNotification("success", `Layanan "${title}" berhasil dihapus.`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Kelompok 7 • Sehatin
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Layanan Medis
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Daftar dan kelola layanan medis klinik Sehatin lengkap dengan integrasi CRUD API dan Database Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            <span className="text-lg leading-none">+</span> Tambah Layanan
          </button>
        </div>

        {/* Notifikasi Toast */}
        {notification.message && (
          <div
            className={`mt-4 flex items-center justify-between rounded-xl p-4 text-sm font-medium ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-xs font-bold underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 font-medium">Memuat data layanan...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              ⚠️
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Gagal Memuat Layanan</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={fetchServices}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && services.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
              🏥
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Belum Ada Layanan Medis</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Belum ada data layanan di database. Anda dapat menambahkan data layanan baru menggunakan tombol di bawah.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              + Tambah Layanan Sekarang
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!isLoading && !error && services.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-emerald-200"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={
                        service.image ||
                        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={service.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                      ID: #{service.id}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-xl font-black text-emerald-600">
                      Rp {Number(service.price).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(service)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-emerald-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service.id, service.title)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Layanan Medis" : "Tambah Layanan Medis Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Layanan Medis *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemeriksaan Dokter Umum"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tarif / Harga (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Contoh: 75000"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL Gambar
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingId
                    ? "Simpan Perubahan"
                    : "Tambahkan Layanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayananMedis;
