import type { ReactNode } from "react";

type Props = {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
};

const shell =
  "rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/5 backdrop-blur-md sm:p-6";

export default function SeoContentSection({
  id,
  title,
  children,
  className = "",
}: Props) {
  return (
    <section id={id} className={`${shell} ${className}`.trim()} aria-labelledby={id ? `${id}-h` : undefined}>
      <h2
        id={id ? `${id}-h` : undefined}
        className="text-lg font-bold tracking-tight text-white sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400 sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}
