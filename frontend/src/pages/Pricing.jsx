import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import { getServiceDoctorSchedule } from "../data/doctors";
import CashierReceiptModal from "../components/CashierReceiptModal";
import OrderStatusModal from "../components/OrderStatusModal";

function LayananMedis({ session, navigate }) {
  const isAdmin = session?.role === "admin";
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [selectedService, setSelectedService] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailRequestId = useRef(0);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [formError, setFormError] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [patientForm, setPatientForm] = useState({
    nik: "", nama_lengkap: session?.profile?.nama_lengkap || "", jenis_kelamin: "",
    tanggal_lahir: "", no_telp: "", alamat: "",
  });
  const [orderForm, setOrderForm] = useState({ tanggal_kunjungan: "", jam_kunjungan: "", keluhan: "" });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    kuota: 10,
    image: "",
    category: "lainnya",
    doctor_name: "",
    schedule: "",
  });

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
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
    let isMounted = true;

    const loadServices = async () => {
      try {
        await fetchServices();
      } catch (err) {
        if (isMounted && err instanceof Error) {
          setError(err.message);
        }
      }
    };

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, [fetchServices]);

  // Tutup modal detail dengan tombol Escape
  useEffect(() => {
    if (!selectedService) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedService(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedService]);

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
      description: "",
      price: "",
      kuota: 10,
      image: "",
      category: "lainnya",
      doctor_name: "",
      schedule: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingId(service.id);
    setFormData({
      title: service.title,
      description: service.description || "",
      price: service.price,
      kuota: service.kuota ?? 10,
      image: service.image || "",
      category: service.category || "lainnya",
      doctor_name: service.doctor_name || "",
      schedule: service.schedule || "",
    });
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
      await apiRequest(
        editingId ? `/api/services/${editingId}` : "/api/services",
        {
        method,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          kuota: Number(formData.kuota),
          category: formData.category,
          image: formData.image.trim() || null,
          ...(formData.doctor_name ? { doctor_name: formData.doctor_name.trim() } : {}),
          ...(formData.schedule ? { schedule: formData.schedule.trim() } : {}),
        }),
        },
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

  // Buka detail layanan (ambil data terbaru dari API)
  const openService = async (service) => {
    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;
    setSelectedService(service);
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const result = await apiRequest(`/api/services/${service.id}`);
      if (requestId !== detailRequestId.current) return;
      if (result.data) {
        setSelectedService(result.data);
      }
    } catch (err) {
      if (requestId !== detailRequestId.current) return;
      setDetailError(err.message);
    } finally {
      if (requestId === detailRequestId.current) {
        setIsDetailLoading(false);
      }
    }
  };

  const closeServiceDetail = () => {
    // Batalkan hasil fetch yang masih berjalan agar modal tidak terbuka kembali.
    detailRequestId.current += 1;
    setSelectedService(null);
    setDetailError("");
    setIsDetailLoading(false);
  };

  const chooseService = async () => {
    if (!session || session.role === "guest") {
      navigate("/login");
      return;
    }
    if (session.role !== "patient") {
      setFormError("Hanya pasien yang dapat membuat pesanan.");
      return;
    }
    setFormError("");
    setIsActionLoading(true);
    try {
      await apiRequest("/api/patients/me");
      setIsOrderFormOpen(true);
    } catch (err) {
      if (err.status === 404) setIsPatientFormOpen(true);
      else setFormError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const registerPatient = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsActionLoading(true);
    try {
      await apiRequest("/api/patients/me", { method: "POST", body: JSON.stringify(patientForm) });
      setIsPatientFormOpen(false);
      setIsOrderFormOpen(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsActionLoading(true);
    try {
      const result = await apiRequest("/api/appointments", {
        method: "POST",
        body: JSON.stringify({ service_id: selectedService.id, ...orderForm }),
      });
      setIsOrderFormOpen(false);
      closeServiceDetail();
      setOrderStatus({
        type: "success",
        message: "Layanan berhasil dipesan. Silakan simpan struk untuk ditunjukkan saat kunjungan.",
        order: result.data,
      });
      fetchServices();
    } catch (err) {
      setIsOrderFormOpen(false);
      closeServiceDetail();
      setOrderStatus({
        type: "error",
        message: err.message || "Pesanan tidak dapat dibuat. Silakan coba lagi.",
      });
    } finally {
      setIsActionLoading(false);
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
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openService(service);
                    }
                  }}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                      <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                        {service.category || "lainnya"}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {service.title}
                      </h3>
                      {service.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {service.description}
                        </p>
                      )}
                      <p className="mt-2 text-xl font-black text-emerald-600">
                        Rp {Number(service.price).toLocaleString("id-ID")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {service.category === "obat"
                          ? `Stok tersedia: ${service.kuota ?? 0}`
                          : `Kuota tersedia: ${service.kuota ?? 0}`}
                      </p>

                      {/* Informasi Dokter & Jadwal Khusus Konsultasi & Pemeriksaan */}
                      {(() => {
                        const doctorInfo = getServiceDoctorSchedule(service);
                        if (!doctorInfo) return null;
                        return (
                          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs text-slate-700">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span>{doctorInfo.icon || "👨‍⚕️"}</span>
                              <span className="truncate">{doctorInfo.doctor}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                              <span>🕒</span>
                              <span className="truncate">{doctorInfo.schedule}</span>
                            </div>
                          </div>
                        );
                      })()}

                      <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        Lihat detail
                        <span aria-hidden="true">→</span>
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex items-center justify-end gap-2">
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

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:border-emerald-300 hover:text-emerald-700"
                >
                  Sebelumnya
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Halaman {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:border-emerald-300 hover:text-emerald-700"
                >
                  Berikutnya
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Layanan
                </label>
                <textarea
                  rows="4"
                  placeholder="Jelaskan cakupan layanan, manfaat, dan hal yang perlu diketahui pasien..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Deskripsi ini tampil pada kartu dan halaman detail layanan.
                </p>
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL Foto Layanan
                </label>
                <input
                  type="url"
                  placeholder="https://contoh.com/foto-layanan.jpg"
                  value={formData.image}
                  onChange={(event) =>
                    setFormData({ ...formData, image: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Masukkan URL publik foto (HTTP atau HTTPS).
                </p>
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Foto layanan saat ini"
                    className="mt-3 h-24 w-24 rounded-lg object-cover"
                  />
                )}
              </div>

              {(formData.category === "konsultasi" ||
                formData.category === "pemeriksaan") && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    🩺 Pengaturan Dokter & Jadwal Kerja
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Dokter Bertugas (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: dr. Andi Pratama, Sp.PD"
                      value={formData.doctor_name}
                      onChange={(e) =>
                        setFormData({ ...formData, doctor_name: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-emerald-500 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Jadwal Kerja Dokter (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Senin – Jumat (08:00 – 14:00 WIB)"
                      value={formData.schedule}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-emerald-500 outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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

      {/* Modal Detail Layanan */}
      {selectedService && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={closeServiceDetail}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-detail-title"
            onClick={(event) => event.stopPropagation()}
            className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                {selectedService.category || "lainnya"}
              </span>
              <button
                type="button"
                onClick={closeServiceDetail}
                aria-label="Tutup detail layanan"
                className="text-2xl leading-none text-slate-400 transition hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="h-56 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-full sm:min-h-[16rem]">
                {selectedService.image ? (
                  <img
                    src={selectedService.image}
                    alt={selectedService.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                    Foto belum tersedia
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col">
                <h2
                  id="service-detail-title"
                  className="text-2xl font-bold text-slate-900"
                >
                  {selectedService.title}
                </h2>
                <p className="mt-2 text-2xl font-black text-emerald-600">
                  Rp {Number(selectedService.price).toLocaleString("id-ID")}
                </p>

                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    {selectedService.category === "obat"
                      ? "Stok obat tersedia"
                      : "Kuota layanan tersedia"}
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-800">
                    {selectedService.kuota ?? 0}{" "}
                    {selectedService.category === "obat" ? "unit" : "pasien"}
                  </p>
                </div>

                {/* Jadwal Pelayanan & Dokter Khusus Konsultasi & Pemeriksaan */}
                {(() => {
                  const doctorInfo = getServiceDoctorSchedule(selectedService);
                  if (!doctorInfo) return null;
                  return (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Jadwal Praktik & Dokter Bertugas
                        </span>
                        <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-300">
                          {doctorInfo.room}
                        </span>
                      </div>
                      <div className="mt-3 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-xs border border-emerald-200">
                          {doctorInfo.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {doctorInfo.doctor}
                          </h4>
                          <p className="text-xs font-medium text-slate-600">
                            {doctorInfo.specialty}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                            <span>🕒</span> {doctorInfo.schedule}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Deskripsi Layanan
                </h3>
                {isDetailLoading ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Memuat detail layanan...
                  </p>
                ) : (
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {selectedService.description ||
                      "Belum ada deskripsi untuk layanan ini."}
                  </p>
                )}

                {detailError && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    Detail terbaru gagal dimuat: {detailError}
                  </p>
                )}

                <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Pilih layanan ini untuk mengajukan pesanan kepada admin.
                </p>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={chooseService}
                    disabled={isActionLoading || selectedService.kuota < 1}
                    className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isActionLoading ? "Memeriksa data..." : selectedService.kuota < 1 ? "Kuota habis" : "Pilih Pesanan Ini"}
                  </button>
                )}
                {formError && (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isPatientFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <form onSubmit={registerPatient} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">Pendaftaran Pasien</h2>
            <p className="mt-1 text-sm text-slate-500">Lengkapi data pasien sebelum membuat pesanan.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["nik", "NIK", "text", "Nomor identitas"],
                ["nama_lengkap", "Nama lengkap", "text", "Nama pasien"],
                ["tanggal_lahir", "Tanggal lahir", "date", ""],
                ["no_telp", "Nomor telepon", "tel", ""],
              ].map(([name, label, type, placeholder]) => (
                <label key={name} className="text-sm font-medium text-slate-700">
                  {label}
                  <input required={["nik", "nama_lengkap", "tanggal_lahir"].includes(name)} type={type} placeholder={placeholder} value={patientForm[name]} onChange={(e) => setPatientForm({ ...patientForm, [name]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
              ))}
              <label className="text-sm font-medium text-slate-700">Jenis kelamin
                <select required value={patientForm.jenis_kelamin} onChange={(e) => setPatientForm({ ...patientForm, jenis_kelamin: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Alamat
                <textarea value={patientForm.alamat} onChange={(e) => setPatientForm({ ...patientForm, alamat: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows="2" />
              </label>
            </div>
            {formError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setIsPatientFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Batal</button><button disabled={isActionLoading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isActionLoading ? "Menyimpan..." : "Daftar dan lanjutkan"}</button></div>
          </form>
        </div>
      )}

      {isOrderFormOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={placeOrder} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">Pesan {selectedService.title}</h2>
            {(() => {
              const doctorInfo = getServiceDoctorSchedule(selectedService);
              if (!doctorInfo) return null;
              return (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{doctorInfo.icon}</span>
                    <span>Dokter: {doctorInfo.doctor}</span>
                  </div>
                  <p className="mt-1 font-medium">🕒 Jadwal: {doctorInfo.schedule}</p>
                  <p className="mt-0.5 text-[11px] text-emerald-700">Pilih tanggal & jam sesuai jam operasional dokter di atas.</p>
                </div>
              );
            })()}
            <label className="mt-5 block text-sm font-medium text-slate-700">Tanggal kunjungan<input required min={new Date().toISOString().slice(0, 10)} type="date" value={orderForm.tanggal_kunjungan} onChange={(e) => setOrderForm({ ...orderForm, tanggal_kunjungan: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="mt-4 block text-sm font-medium text-slate-700">Jam kunjungan<input required type="time" value={orderForm.jam_kunjungan} onChange={(e) => setOrderForm({ ...orderForm, jam_kunjungan: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="mt-4 block text-sm font-medium text-slate-700">Keluhan (opsional)<textarea value={orderForm.keluhan} onChange={(e) => setOrderForm({ ...orderForm, keluhan: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows="3" /></label>
            {formError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setIsOrderFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Batal</button><button disabled={isActionLoading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isActionLoading ? "Mengirim..." : "Kirim Pesanan"}</button></div>
          </form>
        </div>
      )}

      {/* Modal Cetak Struk Kasir Setelah Pemesanan */}
      {receipt && (
        <CashierReceiptModal
          order={receipt}
          onClose={() => setReceipt(null)}
        />
      )}

      <OrderStatusModal
        status={orderStatus}
        onClose={() => setOrderStatus(null)}
        onDownload={() => {
          setReceipt(orderStatus?.order);
          setOrderStatus(null);
        }}
      />
    </div>
  );
}

export default LayananMedis;