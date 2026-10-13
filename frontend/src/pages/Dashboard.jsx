import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

const emptyDoctor = { nama_dokter: "", spesialisasi: "", no_sip: "", no_telp: "" };
const emptySchedule = { hari: "Senin", jam_mulai: "08:00", jam_selesai: "12:00", kuota: 10 };
const emptyPatient = { no_rm: "", nik: "", nama_lengkap: "", jenis_kelamin: "Laki-laki", tanggal_lahir: "", no_telp: "", alamat: "" };

function Dashboard({ session, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctor, setDoctor] = useState(emptyDoctor);
  const [schedule, setSchedule] = useState(emptySchedule);
  const [patient, setPatient] = useState(emptyPatient);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [message, setMessage] = useState("");
  const canManageDoctors = session?.role === "admin";
  const canManagePatients = session?.role === "admin";

  const loadData = useCallback(async () => {
    try {
      const requests = [apiRequest("/api/doctors")];
      if (canManagePatients) requests.push(apiRequest("/api/patients"));
      const [doctorResult, patientResult] = await Promise.all(requests);
      setDoctors(doctorResult.data || []);
      setPatients(patientResult?.data || []);
      setSelectedDoctor((current) => current || String(doctorResult.data?.[0]?.id || ""));
    } catch (loadError) {
      setMessage(loadError.message);
    }
  }, [canManagePatients]);

  useEffect(() => {
    queueMicrotask(() => { loadData(); });
  }, [loadData]);

  const submitDoctor = async (event) => {
    event.preventDefault();
    try {
      await apiRequest("/api/doctors", { method: "POST", body: JSON.stringify(doctor) });
      setDoctor(emptyDoctor);
      setMessage("Dokter berhasil ditambahkan.");
      loadData();
    } catch (saveError) { setMessage(saveError.message); }
  };

  const submitSchedule = async (event) => {
    event.preventDefault();
    try {
      await apiRequest(`/api/doctors/${selectedDoctor}/schedules`, { method: "POST", body: JSON.stringify(schedule) });
      setMessage("Jadwal berhasil ditambahkan.");
      loadData();
    } catch (saveError) { setMessage(saveError.message); }
  };

  const submitPatient = async (event) => {
    event.preventDefault();
    try {
      await apiRequest("/api/patients", { method: "POST", body: JSON.stringify(patient) });
      setPatient(emptyPatient);
      setMessage("Pasien berhasil didaftarkan.");
      loadData();
    } catch (saveError) { setMessage(saveError.message); }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Dashboard</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Halo, {session?.user?.user_metadata?.nama_lengkap || session?.role}</h1></div>
        <button onClick={onLogout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keluar</button>
      </div>
      {message && <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Dokter & jadwal</h2>
          <div className="mt-4 space-y-3">{doctors.map((item) => <article key={item.id} className="rounded-lg bg-slate-50 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{item.nama_dokter}</h3><p className="text-sm text-slate-500">{item.spesialisasi}</p></div><span className="text-xs text-slate-500">{item.doctor_schedules?.length || 0} jadwal</span></div>{item.doctor_schedules?.map((itemSchedule) => <p key={itemSchedule.id} className="mt-2 text-sm text-emerald-700">{itemSchedule.hari}, {itemSchedule.jam_mulai}–{itemSchedule.jam_selesai} · kuota {itemSchedule.kuota}</p>)}</article>)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Daftar pasien</h2>
          <div className="mt-4 space-y-3">{patients.map((item) => <article key={item.id} className="rounded-lg bg-slate-50 p-4"><p className="font-semibold text-slate-900">{item.nama_lengkap}</p><p className="text-sm text-slate-500">RM {item.no_rm} · {item.no_telp || "No. telepon belum diisi"}</p></article>)}</div>
        </div>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {canManageDoctors && <form onSubmit={submitDoctor} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Tambah dokter</h2>{Object.entries(doctor).map(([key, value]) => <input key={key} required={["nama_dokter", "spesialisasi"].includes(key)} value={value} onChange={(event) => setDoctor({ ...doctor, [key]: event.target.value })} placeholder={key.replaceAll("_", " ")} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" />)}<button className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Simpan dokter</button></form>}
        {canManageDoctors && <form onSubmit={submitSchedule} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Tambah jadwal</h2><select value={selectedDoctor} onChange={(event) => setSelectedDoctor(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2">{doctors.map((item) => <option key={item.id} value={item.id}>{item.nama_dokter}</option>)}</select><select value={schedule.hari} onChange={(event) => setSchedule({ ...schedule, hari: event.target.value })} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2">{["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day) => <option key={day}>{day}</option>)}</select><div className="mt-3 grid grid-cols-2 gap-2"><input type="time" value={schedule.jam_mulai} onChange={(event) => setSchedule({ ...schedule, jam_mulai: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" /><input type="time" value={schedule.jam_selesai} onChange={(event) => setSchedule({ ...schedule, jam_selesai: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" /></div><input type="number" min="1" value={schedule.kuota} onChange={(event) => setSchedule({ ...schedule, kuota: Number(event.target.value) })} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Kuota" /><button className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Simpan jadwal</button></form>}
        {canManagePatients && <form onSubmit={submitPatient} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Daftar pasien</h2>{Object.entries(patient).map(([key, value]) => key === "jenis_kelamin" ? <select key={key} value={value} onChange={(event) => setPatient({ ...patient, [key]: event.target.value })} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"><option>Laki-laki</option><option>Perempuan</option></select> : <input key={key} required={["no_rm", "nik", "nama_lengkap", "tanggal_lahir"].includes(key)} type={key === "tanggal_lahir" ? "date" : "text"} value={value} onChange={(event) => setPatient({ ...patient, [key]: event.target.value })} placeholder={key.replaceAll("_", " ")} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" />)}<button className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">Simpan pasien</button></form>}
      </section>
    </main>
  );
}

export default Dashboard;
