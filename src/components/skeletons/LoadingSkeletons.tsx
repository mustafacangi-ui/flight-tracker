/** Shared loading blocks — animate-pulse, rounded-3xl, glass border. */

const pulseBlock =
  "animate-pulse rounded-3xl border border-white/10 bg-white/5";

export function SkeletonLine({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`${pulseBlock} ${className}`.trim()}
      aria-hidden
    />
  );
}

export function AirportHeaderSkeleton() {
  return (
    <div className="mb-4 space-y-3" aria-busy aria-label="Loading airport">
      <div className="flex flex-wrap items-center gap-2">
        <SkeletonLine className="h-4 w-4 rounded-full" />
        <SkeletonLine className="h-4 w-48 max-w-[70%]" />
        <SkeletonLine className="h-5 w-5 rounded-full" />
      </div>
      <SkeletonLine className="h-3 w-40" />
      <SkeletonLine className="h-3 w-36 max-w-[55%]" />
    </div>
  );
}

export function FlightCardSkeleton() {
  return (
    <div
      className={`relative ${pulseBlock} p-4 pr-24 sm:p-6 sm:pr-[9.5rem]`}
      aria-hidden
    >
      <div className="absolute right-3 top-3 z-10 sm:right-6 sm:top-6">
        <SkeletonLine className="h-8 w-24" />
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonLine className="h-10 w-36" />
          <SkeletonLine className="h-6 w-44 max-w-full" />
          <SkeletonLine className="h-3 w-24" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-7 w-24 rounded-full" />
        </div>
      </div>
      <div className="my-3 border-t border-white/5" />
      <div className="grid min-[400px]:grid-cols-3 grid-cols-2 gap-3">
        <SkeletonLine className="h-14" />
        <SkeletonLine className="h-14" />
        <SkeletonLine className="col-span-2 h-14 min-[400px]:col-span-1" />
      </div>
    </div>
  );
}

export function FlightCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <ul
      className="flex flex-col space-y-3 sm:space-y-5"
      aria-busy
      aria-label="Loading flights"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="relative">
          <FlightCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

const BOARD_COLS_MOBILE =
  "grid grid-cols-[2.85rem_3.6rem_minmax(0,1.45fr)_1.85rem_2.85rem_minmax(4.25rem,1fr)] gap-x-1 gap-y-1 px-1.5 sm:grid-cols-[3.25rem_4rem_minmax(0,1.55fr)_2.1rem_3.1rem_minmax(5rem,1fr)] sm:px-2 md:grid-cols-[4.75rem_5.75rem_minmax(0,2.35fr)_3.25rem_4.25rem_minmax(7rem,1.1fr)] md:gap-x-2 md:px-4";

export function BoardRowSkeleton() {
  return (
    <div className={`${BOARD_COLS_MOBILE} py-1.5 md:py-3`} aria-hidden>
      {Array.from({ length: 6 }).map((__, c) => (
        <SkeletonLine key={c} className="h-7" />
      ))}
    </div>
  );
}

export function FlightBoardSkeleton({
  rows = 6,
  embedded = false,
}: {
  rows?: number;
  /** When true, omit outer board chrome (for use inside FlightBoard). */
  embedded?: boolean;
}) {
  const inner = (
    <div className="min-w-[26.5rem] space-y-1.5 sm:min-w-[28rem] md:min-w-[36rem]">
      <div className="space-y-2 px-2 pb-2 text-center md:pb-3">
        <SkeletonLine className="mx-auto h-6 w-64 max-w-[90%]" />
        <SkeletonLine className="mx-auto h-3 w-40" />
      </div>
      <div
        className={`${BOARD_COLS_MOBILE} sticky top-0 z-20 border-b border-amber-500/20 bg-[#0b0b0b]/95 pb-2 backdrop-blur-md`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLine key={i} className="h-8" />
        ))}
      </div>
      <div className="space-y-1.5 py-1.5 md:space-y-2.5 md:py-2">
        {Array.from({ length: rows }).map((_, r) => (
          <BoardRowSkeleton key={r} />
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="px-0 pb-2" aria-busy aria-label="Loading board">
        {inner}
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-5xl overflow-x-auto rounded-3xl border border-amber-500/25 bg-[#0b0b0b] py-4 shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]"
      aria-busy
      aria-label="Loading board"
    >
      {inner}
    </div>
  );
}

export function FlightDetailPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6"
      aria-busy
      aria-label="Loading flight"
    >
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <SkeletonLine className="h-4 w-32 rounded-xl" />
        <div className={`${pulseBlock} p-6 sm:p-8`}>
          <SkeletonLine className="h-12 w-48" />
          <SkeletonLine className="mt-4 h-5 w-64" />
          <SkeletonLine className="mt-6 h-8 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonLine className="h-40" />
          <SkeletonLine className="h-40" />
        </div>
        <SkeletonLine className="h-32 w-full" />
        <SkeletonLine className="h-48 w-full" />
      </div>
    </div>
  );
}

/** Alias for flight detail loading routes. */
export const FlightDetailSkeleton = FlightDetailPageSkeleton;

export function SavedFlightSkeleton() {
  return (
    <div className={`${pulseBlock} p-4`} aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-6 w-28" />
          <SkeletonLine className="h-3 w-40" />
          <SkeletonLine className="h-3 w-24" />
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <SkeletonLine className="h-9 w-16" />
          <SkeletonLine className="h-9 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SavedFlightSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-3" aria-busy aria-label="Loading saved flights">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <SavedFlightSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Premium label — same as {@link SavedFlightSkeletonList}. */
export function SavedFlightsSkeleton({ count = 3 }: { count?: number }) {
  return <SavedFlightSkeletonList count={count} />;
}

/** Family / share tracking view placeholder. */
export function FamilyTrackingSkeleton() {
  return (
    <div
      className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6"
      aria-busy
      aria-label="Loading family view"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <SkeletonLine className="h-8 w-40" />
        <div className={`${pulseBlock} h-36 w-full`} />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonLine className="h-24" />
          <SkeletonLine className="h-24" />
        </div>
        <SkeletonLine className="h-44 w-full" />
        <SkeletonLine className="h-32 w-full" />
      </div>
    </div>
  );
}
