function Footer({ navigate }) {
  const links = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Layanan Medis", path: "/pricing" },
    { label: "Login / Portal", path: "/login" },
  ];

  const handleNav = (targetPath) => {
    if (navigate) {
      navigate(targetPath);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <span className="text-2xl font-black tracking-tight text-white">
              Sehatin<span className="text-emerald-500">.</span>
            </span>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Klinik kesehatan keluarga modern dengan pelayanan prima, dokter
              berpengalaman, dan sistem informasi rekam medis digital terpadu.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs text-emerald-400">
              <span>●</span>
              <span>Klinik Siaga & Melayani</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Navigasi Halaman
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.path}>
                  <button
                    type="button"
                    onClick={() => handleNav(link.path)}
                    className="transition hover:text-emerald-400"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Jam Pelayanan */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Jam Operasional
            </h4>
            <ul className="mt-4 space-y-2 text-xs leading-relaxed">
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Senin - Jumat</span>
                <span className="text-slate-200">08:00 - 21:00 WIB</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Sabtu</span>
                <span className="text-slate-200">08:00 - 18:00 WIB</span>
              </li>
              <li className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Minggu / Libur</span>
                <span className="text-emerald-400">09:00 - 15:00 WIB</span>
              </li>
              <li className="pt-1 text-slate-400 italic">
                *UGD Ringan siap 24 jam untuk kondisi darurat.
              </li>
            </ul>
          </div>

          {/* Kontak & Lokasi */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Kontak Klinik
            </h4>
            <div className="mt-4 space-y-2 text-xs leading-relaxed">
              <p>
                <span className="font-semibold text-slate-300">Alamat:</span> Gedung
                Klinik Sehatin, Jl. Cakrawala Medika No. 7, Jakarta Selatan
              </p>
              <p>
                <span className="font-semibold text-slate-300">Telepon:</span>{" "}
                (021) 555-7777
              </p>
              <p>
                <span className="font-semibold text-slate-300">WhatsApp:</span>{" "}
                +62 812-3456-7890
              </p>
              <p>
                <span className="font-semibold text-slate-300">Email:</span>{" "}
                halo@sehatin.id
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-500">
            © 2026 Sehatin. Web Application Development — Kelompok 7 Universitas Cakrawala.
          </p>
          <p className="text-xs text-slate-500">
            Dibuat untuk Tugas Akhir Kuliah WAD
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;