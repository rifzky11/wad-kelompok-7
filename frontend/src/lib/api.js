const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiRequest(path, options = {}) {
  const savedSession = localStorage.getItem("sehatin-session");
  const accessToken = savedSession
    ? JSON.parse(savedSession)?.session?.access_token
    : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Terjadi kesalahan pada server.");
    error.status = response.status;
    error.code = body.code;
    throw error;
  }
  return body;
}

export { API_URL };
