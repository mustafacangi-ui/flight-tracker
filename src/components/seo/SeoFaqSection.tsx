import { faqPageSchema, type FaqItem } from "../../lib/seo/schemas";
import JsonLd from "./JsonLd";

type Props = {
  title?: string;
  items: FaqItem[];
  className?: string;
};

const shell =
  "rounded-3xl border border-slate-800/90 bg-slate-900/35 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] ring-1 ring-sky-500/10 backdrop-blur-md sm:p-6";

export default function SeoFaqSection({
  title = "Frequently asked questions",
  items,
  className = "",
}: Props) {
  if (items.length === 0) return null;
  return (
    <>
      <JsonLd data={faqPageSchema(items)} />
      <section
        className={`${shell} ${className}`.trim()}
        aria-labelledby="seo-faq-heading"
      >
        <h2
          id="seo-faq-heading"
          className="text-lg font-bold tracking-tight text-white sm:text-xl"
        >
          {title}
        </h2>
        <dl className="mt-5 space-y-5">
          {items.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 sm:p-5"
            >
              <dt className="text-sm font-semibold text-sky-100/95">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
