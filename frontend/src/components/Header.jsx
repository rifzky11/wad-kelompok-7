import { useState } from "react";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Pricing", path: "/pricing" },
];

function Header({ navigate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-xl font-bold tracking-tight text-slate-900 transition-colors hover:text-emerald-600"
        >
          Sehatin
        </button>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
            >
              {item.label}
            </button>
          ))}
        </nav>
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
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Header;
