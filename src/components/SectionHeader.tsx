import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  id?: string;
  className?: string;
  /** When set, replaces the default title typography (e.g. uppercase section labels). */
  titleClassName?: string;
};

export default function SectionHeader({
  title,
  subtitle,
  action,
  id,
  className = "",
  titleClassName,
}: Props) {
  const headingClass =
    titleClassName?.trim() ||
    "text-xs font-semibold uppercase tracking-[0.2em] text-gray-500";

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-2 ${className}`.trim()}
    >
      <div className="min-w-0">
        <h2 id={id} className={headingClass}>
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
