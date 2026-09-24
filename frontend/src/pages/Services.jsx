import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";
const STORAGE_KEY = "sehatin-services";

function Services() {
  const [services, setServices] = useState(() => {
    const savedServices = localStorage.getItem(STORAGE_KEY);
    return savedServices ? JSON.parse(savedServices) : [];
  });
  const [isLoading, setIsLoading] = useState(services.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch(`${API_URL}/services`);

        if (!response.ok) {
          throw new Error("Gagal memuat layanan");
        }

        const responseData = await response.json();
        const latestServices = responseData.data;
        setServices(latestServices);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latestServices));
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchServices();
  }, []);

  if (isLoading) {
    return (
      <p className="px-4 py-12 text-center text-slate-600">
        Memuat layanan...
      </p>
    );
  }

  if (error && services.length === 0) {
    return <p className="px-4 py-12 text-center text-red-600">{error}</p>;
  }

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
      {services.map((service) => (
        <article
          key={service.id}
          className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex h-56 items-center justify-center rounded-lg bg-slate-50 p-6">
            <img
              src={service.image}
              alt={service.title}
              className="h-full max-w-full object-contain"
            />
          </div>
          <h2 className="mt-4 line-clamp-2 font-semibold text-slate-900">
            {service.title}
          </h2>
          <p className="mt-2 text-lg font-bold text-emerald-600">
            Rp {service.price.toLocaleString("id-ID")}
          </p>
        </article>
      ))}
    </main>
  );
}

export default Services;