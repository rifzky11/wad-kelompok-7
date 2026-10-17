import "./App.css";
import { useState } from "react";
import About from "./pages/About";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { featureData } from "./data/features";
import { usePath } from "./hooks/usePath";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [path, navigate] = usePath();
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("sehatin-session");
    const parsed = saved ? JSON.parse(saved) : null;
    return ["guest", "patient", "doctor", "admin"].includes(parsed?.role)
      ? parsed
      : null;
  });

  const login = (nextSession) => {
    setSession(nextSession);
    localStorage.setItem("sehatin-session", JSON.stringify(nextSession));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("sehatin-session");
    navigate("/");
  };

  const page =
    path === "/login" ? (
      <Login navigate={navigate} onLogin={login} />
    ) : path === "/dashboard" && session && session.role !== "guest" ? (
      <Dashboard session={session} onLogout={logout} />
    ) : path === "/dashboard" && session?.role === "guest" ? (
      <Home features={featureData} />
    ) : path === "/dashboard" ? (
      <Login navigate={navigate} onLogin={login} />
    ) : path === "/about" ? (
      <About navigate={navigate} />
    ) : path === "/pricing" ? (
      <Pricing navigate={navigate} session={session} />
    ) : (
      <Home features={featureData} navigate={navigate} />
    );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      <Header
        navigate={navigate}
        session={session}
        onLogout={logout}
        currentPath={path}
      />
      <main className="flex-1">
        {page}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

export default App;