import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../lib/api";

function LayananMedis({ session }) {
  const isAdmin = session?.role === "admin";
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [selectedService, setSelectedService] = useState(null);

  // State Paginasi
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    kuota: 10,
    image: "",
    category: "lainnya",
  });
  const [imageFile, setImageFile] = useState(null);

  // Fetch daftar layanan (dibungkus useCallback agar aman di dalam useEffect)
  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      // Memanggil API dengan query params page dan limit
      const result = await apiRequest(`/api/services?page=${page}&limit=8`);
      setServices(result.data || []);
      setTotalPages(result.meta?.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchServices();
    });
  }, [fetchServices]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      price: "",
      kuota: 10,
      image: "",
      category: "lainnya",
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingId(service.id);
    setFormData({
      title: service.title,
      price: service.price,
      kuota: service.kuota ?? 10,
      image: service.image || "",
      category: service.category || "lainnya",
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price || formData.kuota < 0) {
      alert("Nama layanan, tarif, dan kuota harus diisi dengan benar!");
      return;
    }

    try {
      setIsSubmitting(true);
      const method = editingId ? "PUT" : "POST";
      const imageData = imageFile
        ? await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Foto gagal dibaca."));
            reader.readAsDataURL(imageFile);
          })
        : undefined;

      await apiRequest(
        editingId ? `/api/services/${editingId}` : "/api/services",
        {
          method,
          body: JSON.stringify({
            title: formData.title,
            price: Number(formData.price),
            kuota: Number(formData.kuota),
            category: formData.category,
            ...(imageData ? { image_data: imageData } : {}),
          }),
        }
      );

      showNotification(
        "success",
        editingId
          ? "Data layanan berhasil diperbarui!"
          : "Layanan baru berhasil ditambahkan!"
      );
      setIsModalOpen(false);
      
      // Jika baru tambah data dan posisi tidak di page 1, paksa pindah ke page 1
      if (!editingId && page !== 1) {
        setPage(1);
      } else {
        fetchServices();
      }
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus layanan "${title}"?`
    );
    if (!confirmDelete) return;

    try {
      await apiRequest(`/api/services/${id}`, {
        method: "DELETE",
      });

      showNotification("success", `Layanan "${title}" berhasil dihapus.`);
      
      // Keamanan: Jika data yang dihapus adalah satu-satunya data di halaman saat ini, mundur ke halaman sebelumnya
      if (services.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchServices();
      }
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const openService = async (service) => {
    setSelectedService(service);
  };

  // Generate array untuk tombol pagination (misal: [1, 2, 3])
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

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
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              <span className="text-lg leading-none">+</span> Tambah Layanan
            </button>
          )}
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
            <p className="mt-4 font-medium text-slate-600">Memuat data layanan...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              ⚠️
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Gagal Memuat Layanan</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={fetchServices}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
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
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Belum ada data layanan di database. Anda dapat menambahkan data layanan baru menggunakan tombol di bawah.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                + Tambah Layanan Sekarang
              </button>
            )}
          </div>
        )}

        {/* Services Grid & Pagination */}
        {!isLoading && !error && services.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => openService(service)}
                  role="button"
                  tabIndex={0}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                          Foto belum tersedia
                        </div>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                        {service.category || "lainnya"}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-2 text-base font-bold text-slate-900 transition group-hover:text-emerald-700">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-xl font-black text-emerald-600">
                        Rp {Number(service.price).toLocaleString("id-ID")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {service.category === "obat"
                          ? `Stok tersedia: ${service.kuota ?? 0}`
                          : `Kuota tersedia: ${service.kuota ?? 0}`}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenEditModal(service);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-emerald-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(service.id, service.title);
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                      page === num
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Layanan Medis" : "Tambah Layanan Medis Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xl font-bold text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {formData.category === "obat" ? "Stok obat *" : "Kuota layanan *"}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.kuota}
                  onChange={(e) =>
                    setFormData({ ...formData, kuota: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Kategori *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900"
                >
                  <option value="konsultasi">Konsultasi</option>
                  <option value="obat">Obat-obatan</option>
                  <option value="pemeriksaan">Pemeriksaan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Nama Layanan Medis *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemeriksaan Umum"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Foto Layanan
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Pilih foto langsung dari perangkat (JPG, PNG, atau WEBP).
                </p>
                {formData.image && !imageFile && (
                  <img
                    src={formData.image}
                    alt="Foto layanan saat ini"
                    className="mt-3 h-24 w-24 rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
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

      {/* Modal View Detail */}
      {selectedService && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-600">
                  {selectedService.category || "lainnya"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedService.title}
                </h2>
                <p className="mt-1 font-semibold text-emerald-600">
                  Rp {Number(selectedService.price).toLocaleString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="text-2xl text-slate-400"
              >
                &times;
              </button>
            </div>
            <p className="mt-6 text-sm text-slate-600">
              {selectedService.category === "obat" ? (
                <>
                  Stok tersedia: <strong>{selectedService.kuota ?? 0}</strong>.
                </>
              ) : (
                <>
                  Kuota tersedia: <strong>{selectedService.kuota ?? 0}</strong>.
                </>
              )}{" "}
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayananMedis;