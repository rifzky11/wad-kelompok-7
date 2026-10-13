import { useState } from "react";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Layanan Medis", path: "/pricing" },
];

function Header({ navigate, session, onLogout, currentPath = "/" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 transition-colors hover:text-emerald-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base text-white shadow-xs">
            +
          </span>
          <span>
            Sehatin<span className="text-emerald-600">.</span>
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`text-sm transition-colors ${
                  isActive
                    ? "font-bold text-emerald-600"
                    : "font-medium text-slate-600 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold capitalize text-emerald-700 hover:bg-emerald-100 transition"
              >
                Dashboard ({session.role})
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="text-sm font-medium text-slate-500 hover:text-red-600 transition"
              >
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
            >
              Masuk
            </button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-2xl text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? "×" : "☰"}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-emerald-50 font-bold text-emerald-700"
                      : "font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                navigate(session ? "/dashboard" : "/login");
                setIsOpen(false);
              }}
              className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-emerald-700"
            >
              {session ? `Dashboard (${session.role})` : "Masuk"}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;