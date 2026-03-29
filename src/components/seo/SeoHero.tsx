type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
};

export default function SeoHero({
  eyebrow,
  title,
  description,
  className = "",
}: Props) {
  return (
    <header
      className={`relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-blue-500/10 backdrop-blur-md sm:p-8 ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-600/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-48 bg-sky-500/10 blur-2xl"
        aria-hidden
      />
      <div className="relative max-w-3xl">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400/90">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
          {description}
        </p>
      </div>
    </header>
  );
}
