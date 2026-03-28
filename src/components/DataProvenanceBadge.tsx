"use client";

import {
  DEV_DATA_LABEL,
  devDataLabelsEnabled,
  type DataProvenanceKind,
} from "../lib/dataProvenance";

type Props = {
  kind: DataProvenanceKind;
  className?: string;
};

export default function DataProvenanceBadge({ kind, className = "" }: Props) {
  if (!devDataLabelsEnabled()) return null;
  return (
    <span
      className={`inline-flex items-center rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100/95 ${className}`.trim()}
      title="Development-only data source indicator"
    >
      {DEV_DATA_LABEL[kind]}
    </span>
  );
}
