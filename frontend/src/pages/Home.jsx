import FeatureGrid from "../components/FeatureGrid";
import Hero from "../components/Hero";

function Home({ features }) {
  return (
    <>
      <h1 className="text-green-500">Home</h1>
      <section>
        <Hero />
      </section>
      <section>
        <FeatureGrid data={features} />
      </section>
    </>
  );
}

export default Home;
