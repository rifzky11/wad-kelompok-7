import "./App.css";
import { useState } from "react";
import About from "./pages/About";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Services from "./pages/Services";
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
    return saved ? JSON.parse(saved) : null;
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
    ) :
    path === "/about" ? (
      <About />
    ) : path === "/services" ? (
      <Services />
    ) : path === "/pricing" ? (
      <Pricing session={session} />
    ) : (
      <Home features={featureData} />
    );
  return (
    <>
      <Header navigate={navigate} session={session} onLogout={logout} />
      {page}
      <Footer />
    </>
  );
}

export default App;
