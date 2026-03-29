import Link from "next/link";

export type SeoRelatedLink = { href: string; label: string; hint?: string };

type Props = {
  title: string;
  links: SeoRelatedLink[];
  className?: string;
};

const card =
  "flex flex-col gap-1 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition hover:border-blue-500/35 hover:bg-slate-900/60 hover:shadow-[0_0_28px_rgba(59,130,246,0.12)] sm:p-4";

export default function SeoRelatedLinks({
  title,
  links,
  className = "",
}: Props) {
  if (links.length === 0) return null;
  return (
    <nav
      className={`rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 ring-1 ring-blue-500/5 backdrop-blur-md sm:p-6 ${className}`.trim()}
      aria-label={title}
    >
      <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={card}>
              <span className="text-sm font-semibold text-white">{l.label}</span>
              {l.hint ? (
                <span className="text-xs text-slate-500">{l.hint}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
