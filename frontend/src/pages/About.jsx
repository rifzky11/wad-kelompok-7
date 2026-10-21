function About({ navigate }) {
  const values = [
    {
      icon: "🩺",
      title: "Profesionalisme Medis",
      desc: "Seluruh layanan kesehatan kami dikelola dengan standar operasional yang teruji.",
    },
    {
      icon: "🤝",
      title: "Pelayanan Penuh Empati",
      desc: "Kami memperlakukan setiap pasien selayaknya keluarga sendiri dengan komunikasi yang hangat, terbuka, dan menenangkan.",
    },
    {
      icon: "⚡",
      title: "Inovasi Digital Terpadu",
      desc: "Sistem reservasi real-time dan rekam medis elektronik memangkas birokrasi serta antrean berlebih di klinik.",
    },
    {
      icon: "🛡️",
      title: "Higienitas & Keamanan Terjaga",
      desc: "Fasilitas steril dengan sterilisasi berstandar nasional demi kenyamanan dan perlindungan optimal pasien.",
    },
  ];

  const teamMembers = [
    {
      name: "Muhammad Farrel Al Ghifary",
      nim: "25110300026",
      role: "Project Coordinator & Fullstack",
      initials: "FA",
      badgeColor: "bg-blue-100 text-blue-800",
      contribution:
        "Koordinasi arsitektur sistem, sinkronisasi alur fitur antarmuka, dan manajemen integrasi modul.",
    },
    {
      name: "Kevin Arya Saputra",
      nim: "25110300007",
      role: "Backend & Data Integration",
      initials: "KA",
      badgeColor: "bg-indigo-100 text-indigo-800",
      contribution:
        "Pengembangan REST API Express, integrasi database Supabase PostgreSQL, dan logic autentikasi multi-role.",
    },
    {
      name: "Chandra Tabligh Wiguna",
      nim: "25110300017",
      role: "Frontend Development",
      initials: "CT",
      badgeColor: "bg-teal-100 text-teal-800",
      contribution:
        "Pengembangan komponen React modular, styling antarmuka Tailwind CSS, serta integrasi fetch data API.",
    },
    {
      name: "Brilliant Gibran Adhinata",
      nim: "25110300019",
      role: "API Design & Database Architecture",
      initials: "BG",
      badgeColor: "bg-emerald-100 text-emerald-800",
      contribution:
        "Rancang bangun arsitektur data ERD relasional, spesifikasi kontrak API endpoint, dan standardisasi database.",
    },
    {
      name: "Nawwaf Dzakwan Sigit",
      nim: "25110300022",
      role: "UI/UX & Quality Assurance",
      initials: "ND",
      badgeColor: "bg-amber-100 text-amber-800",
      contribution:
        "Penyempurnaan tata letak visual antarmuka pengguna, pengujian alur interaksi, dan validasi mutu aplikasi.",
    },
  ];

  return (
    <div className="space-y-16 py-12 md:py-16">
      {/* 1. Hero About */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
            <span>🏥 TENTANG KLINIK SEHATIN</span>
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Mewujudkan Layanan Kesehatan Keluarga yang{" "}
            <span className="text-emerald-600">Nyaman & Terpercaya</span>
          </h1>

          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
            Sehatin adalah klinik kesehatan keluarga modern yang mengintegrasikan
            keunggulan layanan kesehatan dengan kemudahan teknologi
            digital. Kami percaya setiap individu dan keluarga berhak
            memperoleh perawatan kesehatan yang manusiawi, berkualitas, dan transparan.
          </p>
        </div>

        {/* Highlight Metrics */}
        <div className="mt-12 grid grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:grid-cols-4 sm:p-8">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-emerald-600">2026</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Tahun Didirikan
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-slate-900">10+</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Layanan Terpercaya
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-slate-900">4 Poli</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Layanan Medis Utama
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-emerald-600">100%</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Rekam Medis Digital
            </p>
          </div>
        </div>
      </section>

      {/* 2. Visi & Misi */}
      <section className="bg-slate-100/70 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              KOMITMEN KAMI
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Visi & Misi Klinik Sehatin
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-base text-slate-600">
              Arah dan prinsip mendasar dalam setiap langkah pelayanan medis yang kami dedikasikan.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Visi */}
            <div className="flex flex-col justify-between rounded-3xl border border-emerald-100 bg-white p-8 shadow-xs">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  🎯
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">
                  Visi Kami
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  Menjadi penyedia layanan kesehatan primer terdepan dan terpercaya
                  di Indonesia yang memadukan keunggulan kompetensi klinis dengan
                  kemudahan teknologi digital demi meningkatkan taraf kesehatan
                  setiap keluarga.
                </p>
              </div>
              <div className="mt-8 rounded-2xl bg-emerald-50/70 p-4 text-xs font-medium text-emerald-900">
                ⭐ Mengedepankan keselamatan pasien, kenyamanan keluarga, dan integritas medis tanpa kompromi.
              </div>
            </div>

            {/* Misi */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                🚀
              </div>
              <h3 className="mt-6 text-2xl font-bold text-slate-900">
                Misi Kami
              </h3>
              <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    1
                  </span>
                  <span>
                    Menyelenggarakan diagnosis dan penanganan medis holistik yang
                    akurat, terjangkau, dan berorientasi pada keselamatan pasien.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    2
                  </span>
                  <span>
                    Mengoptimalkan teknologi digital dalam sistem reservasi daring
                    dan rekam medis elektronik demi memangkas waktu antre.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    3
                  </span>
                  <span>
                    Menjamin transparansi tarif layanan, tindakan medis, serta
                    resep obat tanpa ada pembiayaan tersembunyi.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    4
                  </span>
                  <span>
                    Membina komunikasi terapeutik yang edukatif, empatik, dan
                    ramah antara tenaga medis dan keluarga pasien.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Nilai Utama */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            PRINSIP KERJA
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Nilai-Nilai Utama (Core Values)
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-base text-slate-600">
            Fondasi yang membentuk budaya pelayanan kami setiap hari.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((val, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                {val.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{val.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {val.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Tim Pengembang (Kelompok 7) */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              SHOWCASE TIM PROYEK
            </span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Tim Pengembang — Kelompok 7
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Final Project Mata Kuliah Web Application Development (WAD) • Program Studi S1 Ilmu Komputer, Universitas Cakrawala.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div
                key={member.nim}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-800/80 p-6 shadow-md transition duration-300 hover:border-emerald-500/50 hover:bg-slate-800"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-base font-extrabold text-white shadow-inner">
                      {member.initials}
                    </div>
                    <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-mono text-slate-300">
                      NIM: {member.nim}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-400">
                    {member.role}
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-slate-300">
                    {member.contribution}
                  </p>
                </div>
              </div>
            ))}

            {/* Project Summary Card */}
            <div className="flex flex-col justify-center rounded-2xl border border-dashed border-emerald-500/50 bg-emerald-950/30 p-6 text-center">
              <span className="text-3xl">💻</span>
              <h4 className="mt-3 text-base font-bold text-emerald-300">
                Arsitektur Modern
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-emerald-200/80">
                Frontend React 19 + Vite + Tailwind CSS terhubung dengan Node.js Express REST API dan Supabase Cloud Database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Informasi Operasional & Kontak */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Jam Operasional */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                🕒
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Jam Operasional Pelayanan
              </h3>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-medium text-slate-700">Senin – Jumat</span>
                <span className="font-semibold text-slate-900">08:00 – 21:00 WIB</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-medium text-slate-700">Sabtu</span>
                <span className="font-semibold text-slate-900">08:00 – 18:00 WIB</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-medium text-slate-700">Minggu & Libur Nasional</span>
                <span className="font-semibold text-emerald-700">09:00 – 15:00 WIB (Poli Siaga)</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-slate-700">UGD Ringan & Darurat</span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  Siaga 24 Jam
                </span>
              </div>
            </div>
          </div>

          {/* Lokasi & Kontak */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                📍
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Lokasi & Hubungi Kami
              </h3>
            </div>
            <div className="mt-6 space-y-3.5 text-sm text-slate-600">
              <p className="flex items-start gap-2.5">
                <span className="font-bold text-slate-800">Alamat:</span>
                <span>Gedung Klinik Sehatin Lt. 1-2, Jl. Cakrawala Medika No. 7, Jakarta Selatan</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="font-bold text-slate-800">Telepon:</span>
                <span>(021) 555-7777</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="font-bold text-slate-800">WhatsApp:</span>
                <span>+62 812-3456-7890</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="font-bold text-slate-800">Email:</span>
                <span>halo@sehatin.id</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Ingin Berkonsultasi Mengenai Layanan Kami?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
            Tim medis kami siap mendengarkan keluhan dan memberikan solusi perawatan kesehatan yang tepat untuk Anda.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate?.("/pricing")}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
            >
              Lihat Katalog Layanan Medis
            </button>
            <button
              type="button"
              onClick={() => navigate?.("/")}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;