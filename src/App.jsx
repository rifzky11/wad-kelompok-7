import { useEffect, useState } from "react";
import "./App.css";

const featureData = [
  {
    id: "1",
    icon: "⚕️",
    title: "Mudah Digunakan",
    subtitle: "Buat jadwal konsultasi tanpa proses yang rumit.",
  },
  {
    id: "2",
    icon: "🩺",
    title: "Dokter Berpengalaman",
    subtitle: "Dapatkan perawatan dari tenaga medis terpercaya.",
  },
  {
    id: "3",
    icon: "📋",
    title: "Catatan Terarah",
    subtitle: "Pantau kebutuhan pemeriksaan kesehatan Anda.",
  },
];

const clinicServices = [
  {
    id: 1,
    title: "Konsultasi Umum",
    price: 150000,
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 2,
    title: "Pemeriksaan Gigi",
    price: 200000,
    image:
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 3,
    title: "Konsultasi Kulit",
    price: 250000,
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 4,
    title: "Medical Check-up",
    price: 450000,
    image:
      "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=700&q=80",
  },
];

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  return [
    path,
    (nextPath) => {
      window.history.pushState({}, "", nextPath);
      setPath(nextPath);
    },
  ];
}

function Header({ navigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Products", path: "/products" },
    { label: "Pricing", path: "/pricing" },
  ];
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
        onClick={() => {
          updateCount();
        }}
        className="rounded-full bg-pink-600 px-8 py-3 font-semibold text-white transition hover:bg-pink-900"
      >
        Jadwalkan Kunjungan : {count}
      </button>
    </section>
  );
}

function Card({ icon, title, subtitle }) {
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-2xl shadow-inner shadow-emerald-200/60">
        <span aria-label={title}>{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}
function CardGrid({ data = [] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => (
        <Card
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
        />
      ))}
    </div>
  );
}
function Home({ features }) {
  return (
    <>
      <h1 className="text-green-500">Home</h1>
      <section>
        <Hero />
      </section>
      <section>
        <CardGrid data={features} />
      </section>
    </>
  );
}
function About() {
  return (
    <div className="px-4 py-2">
      <h1 className="font-bold">Tentang Sehatin</h1>
      <p>
        Sehatin adalah klinik keluarga yang hadir untuk membantu Anda menjaga
        kesehatan dengan layanan yang nyaman dan terpercaya.
      </p>
      <br />
      <p>
        Kami percaya setiap orang berhak mendapatkan perawatan yang penuh
        perhatian.
      </p>
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem("sehatin-products");
    return savedProducts ? JSON.parse(savedProducts) : [];
  });
  const [isLoading, setIsLoading] = useState(products.length === 0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(clinicServices);
      localStorage.setItem(
        "sehatin-products",
        JSON.stringify(clinicServices),
      );
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);
  if (isLoading)
    return (
      <p className="px-4 py-12 text-center text-slate-600">Memuat produk...</p>
    );
  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
      {products.map((product) => (
        <article
          key={product.id}
          className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex h-56 items-center justify-center rounded-lg bg-slate-50 p-6">
            <img
              src={product.image}
              alt={product.title}
              className="h-full max-w-full object-contain"
            />
          </div>
          <h2 className="mt-4 line-clamp-2 font-semibold text-slate-900">
            {product.title}
          </h2>
          <p className="mt-2 text-lg font-bold text-emerald-600">
            Rp {product.price.toLocaleString("id-ID")}
          </p>
        </article>
      ))}
    </main>
  );
}

function Pricing() {
  return <div>Pricing</div>;
}
function Footer() {
  return (
    <footer className="flex h-full w-full bg-blue-900 px-4 py-2 text-center">
      <p className="text-white">footer</p>
    </footer>
  );
}

function App() {
  const [path, navigate] = usePath();
  const page =
    path === "/about" ? (
      <About />
    ) : path === "/products" ? (
      <Products />
    ) : path === "/pricing" ? (
      <Pricing />
    ) : (
      <Home features={featureData} />
    );
  return (
    <>
      <Header navigate={navigate} />
      {page}
      <Footer />
    </>
  );
}

export default App;
