import "./App.css";
import About from "./pages/About";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Services from "./pages/Services";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { featureData } from "./data/features";
import { usePath } from "./hooks/usePath";

function App() {
  const [path, navigate] = usePath();
  const page =
    path === "/about" ? (
      <About />
    ) : path === "/services" ? (
      <Services />
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
