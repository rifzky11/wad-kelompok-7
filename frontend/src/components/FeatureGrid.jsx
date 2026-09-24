import FeatureCard from "./FeatureCard";

function FeatureGrid({ data = [] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => (
        <FeatureCard
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
        />
      ))}
    </div>
  );
}

export default FeatureGrid;
