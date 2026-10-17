import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

const emptyDoctorProfile = {
  nama_dokter: "",
  spesialisasi: "",
  no_sip: "",
  no_telp: "",
  image_url: "",
};
const emptySchedule = {
  hari: "Senin",
  jam_mulai: "08:00",
  jam_selesai: "12:00",
  kuota: 10,
};
function formatTime(time) {
  return String(time || "").slice(0, 5);
}

function Dashboard({ session, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [patientUsers, setPatientUsers] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorProfile, setDoctorProfile] = useState(emptyDoctorProfile);
  const [schedule, setSchedule] = useState(emptySchedule);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [doctorImageFile, setDoctorImageFile] = useState(null);
  const [doctorDashboard, setDoctorDashboard] = useState(null);
  const [doctorProfileLoaded, setDoctorProfileLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const canManageDoctors = session?.role === "admin";
  const isDoctor = session?.role === "doctor";

  const loadData = useCallback(async () => {
    try {
      if (isDoctor) {
        try {
          const result = await apiRequest("/api/doctors/me");
          setDoctorDashboard(result.data);
          setDoctorProfile(result.data.doctor);
          setDoctorProfileLoaded(true);
        } catch (loadError) {
          if (loadError.code !== "DOCTOR_PROFILE_MISSING") throw loadError;
          setDoctorDashboard(null);
          setDoctorProfileLoaded(true);
        }
        return;
      }

      const requests = [apiRequest("/api/doctors")];
      const [doctorResult] = await Promise.all(requests);
      setDoctors(doctorResult.data || []);
      setSelectedDoctor("");
    } catch (loadError) {
      setMessage(loadError.message);
    }
  }, [isDoctor]);

  const searchDoctors = async (event) => {
    const search = event.target.value;
    if (!search.trim()) {
      setUsers([]);
      setSelectedDoctor("");
      return;
    }

    try {
      const result = await apiRequest(
        `/api/users?role=doctor&search=${encodeURIComponent(search)}`,
      );
      setUsers(result.data || []);
    } catch (searchError) {
      setMessage(searchError.message);
    }
  };

  const searchPatients = async (event) => {
    const search = event.target.value;
    setPatientSearch(search);
    if (!search.trim()) {
      setPatientUsers([]);
      return;
    }

    try {
      const result = await apiRequest(
        `/api/users?role=patient&search=${encodeURIComponent(search)}`,
      );
      setPatientUsers(result.data || []);
    } catch (searchError) {
      setMessage(searchError.message);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, [loadData]);

  const submitSchedule = async (event) => {
    event.preventDefault();
    try {
      await apiRequest(`/api/doctors/${selectedDoctor}/schedules`, {
        method: "POST",
        body: JSON.stringify(schedule),
      });
      setMessage("Jadwal berhasil ditambahkan.");
      loadData();
    } catch (saveError) {
      setMessage(saveError.message);
    }
  };

  const submitDoctorProfile = async (event) => {
    event.preventDefault();
    try {
      const imageData = doctorImageFile
        ? await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Foto gagal dibaca."));
            reader.readAsDataURL(doctorImageFile);
          })
        : undefined;
      await apiRequest("/api/doctors/me", {
        method: "POST",
        body: JSON.stringify({
          nama_dokter: doctorProfile.nama_dokter,
          spesialisasi: doctorProfile.spesialisasi,
          no_sip: doctorProfile.no_sip,
          no_telp: doctorProfile.no_telp,
          ...(imageData ? { image_data: imageData } : {}),
        }),
      });
      setMessage("Profil dokter berhasil disimpan.");
      setDoctorImageFile(null);
      loadData();
    } catch (saveError) {
      setMessage(saveError.message);
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
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Keluar
        </button>
      </div>
      {message && (
        <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {(!isDoctor || doctorDashboard) && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Dokter & jadwal</h2>
          <div className="mt-4 space-y-3">
            {doctors.map((item) => (
              <article key={item.id} className="rounded-lg bg-slate-50 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.nama_dokter}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {item.spesialisasi}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {item.doctor_schedules?.length || 0} jadwal
                  </span>
                </div>
                {item.doctor_schedules?.map((itemSchedule) => (
                  <p
                    key={itemSchedule.id}
                    className="mt-2 text-sm text-emerald-700"
                  >
                    {itemSchedule.hari}, {formatTime(itemSchedule.jam_mulai)}–
                    {formatTime(itemSchedule.jam_selesai)} · kuota{" "}
                    {itemSchedule.kuota}
                  </p>
                ))}
              </article>
            ))}
          </div>
          </div>
          {canManageDoctors && (
            <form
              onSubmit={submitSchedule}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-slate-900">Tambah jadwal</h2>
              <input
                type="search"
                placeholder="Cari nama atau email dokter"
                onChange={searchDoctors}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <div className="mt-3 space-y-2">
                {users.map((item) => {
                  const doctor = item.doctors?.[0];
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedDoctor(String(doctor?.id || ""))}
                      disabled={!doctor}
                      className={`block w-full rounded-lg p-3 text-left text-sm ${
                        selectedDoctor === String(doctor?.id)
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-50 text-slate-700"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="block font-semibold">
                        {item.nama_lengkap}
                      </span>
                      <span>{item.email}</span>
                      {!doctor && (
                        <span className="block text-xs text-red-600">
                          Profil dokter belum dibuat
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <select
                value={schedule.hari}
                onChange={(event) =>
                  setSchedule({ ...schedule, hari: event.target.value })
                }
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(
                  (day) => (
                    <option key={day}>{day}</option>
                  ),
                )}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={schedule.jam_mulai}
                  onChange={(event) =>
                    setSchedule({ ...schedule, jam_mulai: event.target.value })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  type="time"
                  value={schedule.jam_selesai}
                  onChange={(event) =>
                    setSchedule({ ...schedule, jam_selesai: event.target.value })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <input
                type="number"
                min="1"
                value={schedule.kuota}
                onChange={(event) =>
                  setSchedule({ ...schedule, kuota: Number(event.target.value) })
                }
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Kuota"
              />
              <button
                disabled={!selectedDoctor}
                className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Simpan jadwal
              </button>
            </form>
          )}
          {canManageDoctors && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Ubah patient menjadi dokter
              </h2>
              <input
                type="search"
                value={patientSearch}
                placeholder="Cari nama atau email patient"
                onChange={searchPatients}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <div className="mt-3 space-y-2">
                {patientSearch.trim() && patientUsers.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Patient tidak ditemukan.
                  </p>
                )}
                {patientUsers.map((item) => (
                  <article
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.nama_lengkap}
                      </p>
                      <p className="text-sm text-slate-500">{item.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await apiRequest(`/api/users/${item.id}/role`, {
                            method: "PATCH",
                            body: JSON.stringify({ role: "doctor" }),
                          });
                          setMessage(
                            `${item.nama_lengkap} berhasil diubah menjadi dokter.`,
                          );
                          setPatientSearch("");
                          setPatientUsers([]);
                          loadData();
                        } catch (saveError) {
                          setMessage(saveError.message);
                        }
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Jadikan dokter
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {isDoctor && doctorProfileLoaded && !doctorDashboard && (
          <form
            onSubmit={submitDoctorProfile}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold">Daftar profil dokter</h2>
            {Object.entries(doctorProfile)
              .filter(([key]) => key !== "image_url")
              .map(([key, value]) => (
              <input
                key={key}
                required={["nama_dokter", "spesialisasi"].includes(key)}
                value={value}
                onChange={(event) =>
                  setDoctorProfile({
                    ...doctorProfile,
                    [key]: event.target.value,
                  })
                }
                placeholder={key.replaceAll("_", " ")}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              ))}
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Foto dokter
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setDoctorImageFile(event.target.files?.[0] || null)
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Pilih foto langsung dari perangkat (JPG, PNG, atau WEBP).
              </span>
            </label>
            <button className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">
              Simpan profil dokter
            </button>
          </form>
        )}
        {isDoctor && doctorDashboard && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <h2 className="text-lg font-bold text-slate-900">Jadwal saya</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {doctorDashboard.schedules.length ? (
                  doctorDashboard.schedules.map((item) => (
                    <article key={item.id} className="rounded-lg bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{item.hari}</p>
                      <p className="mt-1 text-sm text-emerald-700">
                        {formatTime(item.jam_mulai)}–{formatTime(item.jam_selesai)} · kuota{" "}
                        {item.kuota}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Belum ada jadwal.</p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <h2 className="text-lg font-bold text-slate-900">Pasien saya</h2>
              <div className="mt-4 space-y-3">
                {doctorDashboard.appointments.length ? (
                  doctorDashboard.appointments.map((appointment) => (
                    <article key={appointment.id} className="rounded-lg bg-slate-50 p-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {appointment.patients?.nama_lengkap || "Pasien"}
                        </p>
                        <span className="text-sm text-emerald-700">
                          {appointment.tanggal_kunjungan} ·{" "}
                          {formatTime(appointment.jam_kunjungan)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {appointment.patients?.no_rm || "-"} ·{" "}
                        {appointment.services?.title || "Layanan"}
                      </p>
                      {appointment.keluhan && (
                        <p className="mt-2 text-sm text-slate-600">
                          Keluhan: {appointment.keluhan}
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Belum ada pasien.</p>
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
