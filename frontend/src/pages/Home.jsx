import FeatureGrid from "../components/FeatureGrid";
import Hero from "../components/Hero";
import { clinicServices } from "../data/clinicServices";

function Home({ features = [], navigate }) {
  const steps = [
    {
      num: "01",
      title: "Pilih Layanan",
      desc: "Temukan poli atau layanan medis yang sesuai dengan kebutuhan kesehatan Anda.",
      icon: "🏥",
    },
    {
      num: "02",
      title: "Pilih Layanan",
      desc: "Pilih pemeriksaan atau konsultasi sesuai kebutuhan Anda.",
      icon: "📅",
    },
    {
      num: "03",
      title: "Pemeriksaan",
      desc: "Dapatkan pemeriksaan menyeluruh dengan proses yang tertata.",
      icon: "🩺",
    },
    {
      num: "04",
      title: "Rekam Medis Digital",
      desc: "Akses riwayat hasil periksa, resep obat, serta rincian tagihan secara transparan.",
      icon: "📋",
    },
  ];

  const testimonials = [
    {
      name: "Siti Rahmawati",
      role: "Pasien Konsultasi Umum",
      comment:
        "Pelayanannya sangat ramah dan tempatnya bersih. Reservasi via website mudah dan cepat.",
      rating: "★★★★★",
    },
    {
      name: "Budi Santoso",
      role: "Kepala Keluarga • Poli Gigi",
      comment:
        "Layanan gigi di Sehatin teliti dan anak saya sama sekali tidak takut saat periksa. Penjelasan biaya dan tindakan juga sangat transparan.",
      rating: "★★★★★",
    },
    {
      name: "dr. Amanda Putri",
      role: "Medical Check-Up Pasien",
      comment:
        "Hasil pemeriksaan dan rekam medis digitalnya teratur rapi. Sangat memudahkan saat perlu rujukan atau evaluasi berkala.",
      rating: "★★★★★",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <Hero navigate={navigate} />

      {/* 2. Keunggulan Klinik (Features) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            KEUNGGULAN SEHATIN
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Standar Pelayanan Medis Unggulan
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
            Menggabungkan keahlian tenaga medis berpengalaman dengan kenyamanan
            fasilitas klinik modern dan kemudahan teknologi digital.
          </p>
        </div>

        <FeatureGrid data={features} />
      </section>

      {/* 3. Layanan Unggulan Preview */}
      <section className="bg-slate-100/70 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                KATALOG POPULER
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Layanan Medis Unggulan
              </h2>
              <p className="mt-2 max-w-xl text-base text-slate-600">
                Pilihan pemeriksaan kesehatan yang paling sering dibutuhkan oleh
                keluarga dengan tarif pasti dan transparan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate?.("/pricing")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <span>Semua Layanan</span>
              <span>→</span>
            </button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {clinicServices.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-md bg-emerald-600/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                    Layanan Siaga
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Klinik Umum & Spesialis
                  </p>
                  <div className="mt-auto pt-4">
                    <p className="text-xs text-slate-400">Mulai dari</p>
                    <p className="text-xl font-extrabold text-emerald-600">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate?.("/pricing")}
                      className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                    >
                      Reservasi Layanan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Alur Pelayanan Pasien */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            ALUR PRAKTIS
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            4 Langkah Mudah Berobat di Sehatin
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            Proses cepat dan tertata dari rumah hingga pemeriksaan selesai.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                  {step.icon}
                </span>
                <span className="text-2xl font-black text-slate-200">
                  {step.num}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Testimoni Pasien */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            KATA MEREKA
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Dipercaya Oleh Ribuan Keluarga
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            Kepuasan dan kenyamanan pasien adalah bukti dedikasi kami.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
            >
              <div>
                <p className="text-sm font-bold tracking-wider text-amber-400">
                  {t.rating}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 italic">
                  "{t.comment}"
                </p>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Call To Action Banner */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-6 py-12 text-center text-white shadow-xl sm:px-12 sm:py-16">
          <div className="relative z-10 mx-auto max-w-2xl">
            <span className="inline-block rounded-full bg-emerald-500/40 px-3.5 py-1 text-xs font-semibold tracking-wide text-emerald-100">
              KESEHATAN ADALAH PRIORITAS
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Siap Mendaftar Pemeriksaan Kesehatan Anda?
            </h2>
            <p className="mt-4 text-base text-emerald-100 sm:text-lg">
              Pilih layanan medis yang sesuai dengan kebutuhan Anda sekarang.
              Nikmati kenyamanan berobat tanpa antre panjang.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate?.("/pricing")}
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-800 shadow-md transition hover:bg-emerald-50 active:scale-95"
              >
                Pilih Layanan
              </button>
              <button
                type="button"
                onClick={() => navigate?.("/about")}
                className="rounded-xl border border-emerald-300/60 bg-emerald-800/40 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800/80 active:scale-95"
              >
                Pelajari Tentang Sehatin
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;