import LiveFlightSkeleton from "../../../components/live/LiveFlightSkeleton";

export default function LiveFlightLoading() {
  return (
    <div className="min-h-screen bg-[#04060d] px-4 py-[max(1rem,env(safe-area-inset-top))] pb-24 text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -15%, rgba(37,99,235,0.28), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-lg">
        <LiveFlightSkeleton />
      </div>
    </div>
  );
}
