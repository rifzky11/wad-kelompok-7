import { useState } from "react";
import heroImg from "../assets/hero.png";

function Hero({ navigate }) {
  const [count, setCount] = useState(() =>
    Number(localStorage.getItem("angka") || 0),
  );

  const updateCount = () => {
    const next = count + 1;
    setCount(next);
    localStorage.setItem("angka", String(next));
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Copy & CTA */}
          <div className="text-center lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/70 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Klinik Keluarga Terpercaya • Layanan Digital Terpadu</span>
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-5xl xl:text-6xl">
              Kesehatan Terbaik untuk{" "}
              <span className="text-emerald-600">Keluarga Anda</span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Sehatin hadir memberikan layanan medis komprehensif, mulai dari
              konsultasi umum, dokter gigi, hingga pemeriksaan rutin. Reservasi
              mudah tanpa antre panjang dengan rekam medis terpadu.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button
                type="button"
                onClick={updateCount}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-95"
              >
                <span>Jadwalkan Kunjungan : {count}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate?.("/pricing")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 active:scale-95"
              >
                <span>Lihat Layanan Medis</span>
                <span>→</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6 text-center lg:text-left">
              <div>
                <p className="text-2xl font-bold text-slate-900">15.000+</p>
                <p className="text-xs font-medium text-slate-500">Pasien Terlayani</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">10+</p>
                <p className="text-xs font-medium text-slate-500">Dokter Ber-SIP</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">4.9 / 5.0</p>
                <p className="text-xs font-medium text-slate-500">Rating Kepuasan</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual */}
          <div className="relative mx-auto max-w-md lg:col-span-5 lg:max-w-none">
            <div className="relative flex items-center justify-center rounded-3xl border border-emerald-100 bg-gradient-to-tr from-emerald-100/50 via-white to-emerald-50 p-6 shadow-xl shadow-emerald-900/5">
              <img
                src={heroImg}
                alt="Tenaga Medis Klinik Sehatin"
                className="h-auto max-h-80 w-auto object-contain transition duration-500 hover:scale-105"
              />

              {/* Floating Badge 1 */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3.5 shadow-lg backdrop-blur-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  🩺
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Dokter Siaga</p>
                  <p className="text-[11px] text-slate-500">Konsultasi Ramah & Tepat</p>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute -top-4 -right-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-xs">
                <span className="text-base">⚡</span>
                <span className="text-xs font-bold text-emerald-700">Reservasi Cepat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;