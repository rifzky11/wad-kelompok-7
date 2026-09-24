function FeatureCard({ icon, title, subtitle }) {
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

export default FeatureCard;
