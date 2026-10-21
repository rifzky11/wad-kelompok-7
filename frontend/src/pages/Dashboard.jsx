function Dashboard({ session, onLogout }) {
  const isAdmin = session?.role === "admin";

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
    </main>
  );
}

export default Dashboard;
