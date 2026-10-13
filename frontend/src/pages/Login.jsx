import { useState } from "react";
import { apiRequest } from "../lib/api";

function Login({ navigate, onLogin }) {
  const [role, setRole] = useState("patient");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...form, role }),
      });
      onLogin(result.data);
      navigate("/dashboard");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setError("");
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ role: "guest" }),
      });
      onLogin(result.data);
      navigate("/");
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Sehatin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Masuk ke akun</h1>
        <p className="mt-2 text-sm text-slate-500">Pilih peran untuk melanjutkan ke layanan klinik.</p>
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Peran
          <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="patient">Pasien</option>
            <option value="doctor">Dokter</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Email
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="nama@email.com" />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="••••••••" />
        </label>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <button disabled={isLoading} className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
        <button type="button" onClick={loginAsGuest} className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">
          Lanjut sebagai Guest
        </button>
      </form>
    </main>
  );
}

export default Login;
