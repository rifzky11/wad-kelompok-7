import { useState } from "react";
import { apiRequest } from "../lib/api";

function Login({ navigate, onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({
    nama_lengkap: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await apiRequest(
        isRegistering ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            isRegistering
              ? form
              : { email: form.email, password: form.password },
          ),
        },
      );

      if (isRegistering) {
        if (result.data?.session) {
          onLogin(result.data);
          navigate("/dashboard");
        } else {
          setSuccess(
            "Akun berhasil dibuat. Cek email Anda dan klik tautan konfirmasi sebelum masuk.",
          );
          setIsRegistering(false);
          setForm((current) => ({ ...current, nama_lengkap: "" }));
        }
      } else {
        onLogin(result.data);
        navigate("/dashboard");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ role: "guest" }),
      });
      onLogin(result.data);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Sehatin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {isRegistering ? "Buat akun baru" : "Masuk ke akun"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isRegistering
            ? "Daftar untuk mulai menggunakan layanan klinik."
            : "Masuk untuk melanjutkan ke layanan klinik."}
        </p>

        {isRegistering && (
          <label className="mt-6 block text-sm font-medium text-slate-700">
            Nama lengkap
            <input
              required
              type="text"
              autoComplete="name"
              value={form.nama_lengkap}
              onChange={(event) =>
                setForm({ ...form, nama_lengkap: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Nama lengkap"
            />
          </label>
        )}

        <label
          className={`${isRegistering ? "mt-4" : "mt-6"} block text-sm font-medium text-slate-700`}
        >
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="nama@email.com"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            required
            type="password"
            autoComplete={
              isRegistering ? "new-password" : "current-password"
            }
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </p>
        )}

        <button
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isLoading ? "Memproses..." : isRegistering ? "Daftar" : "Masuk"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          {isRegistering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
              setSuccess("");
            }}
            className="font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
          >
            {isRegistering ? "Masuk" : "Daftar"}
          </button>
        </p>

        {!isRegistering && (
          <button
            type="button"
            disabled={isLoading}
            onClick={loginAsGuest}
            className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Lanjut sebagai Guest
          </button>
        )}
      </form>
    </main>
  );
}

export default Login;
