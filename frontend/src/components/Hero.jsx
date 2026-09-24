import { useState } from "react";

function Hero() {
  const [count, setCount] = useState(() =>
    Number(localStorage.getItem("angka") || 0),
  );

  const updateCount = () => {
    const next = count + 1;
    setCount(next);
    localStorage.setItem("angka", String(next));
  };

  return (
    <section className="bg-slate-50 px-8 py-20 text-center">
      <h1 className="mb-6 text-5xl font-extrabold text-slate-900">
        Kesehatan Terbaik untuk Keluarga
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
        Layanan klinik yang nyaman, terpercaya, dan dekat dengan kebutuhan
        kesehatan Anda.
      </p>
      <button
        type="button"
        onClick={updateCount}
        className="rounded-full bg-pink-600 px-8 py-3 font-semibold text-white transition hover:bg-pink-900"
      >
        Jadwalkan Kunjungan : {count}
      </button>
    </section>
  );
}

export default Hero;
