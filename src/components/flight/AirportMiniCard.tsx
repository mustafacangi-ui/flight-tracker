function glassCard(className = ""): string {
  return `rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`;
}

type Props = {
  variant: "departure" | "arrival";
  airportCode: string;
  airportName: string;
  city?: string;
  scheduledTime?: string;
  estimatedTime?: string;
  actualTime?: string;
  terminal?: string;
  gate?: string;
};

export default function AirportMiniCard({
  variant,
  airportCode,
  airportName,
  city,
  scheduledTime,
  estimatedTime,
  actualTime,
  terminal,
  gate,
}: Props) {
  const title = variant === "departure" ? "Departure airport" : "Arrival airport";

  return (
    <section className={glassCard("p-5")}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
        {title}
      </h2>
      <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-white">
        {airportCode}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-200">{airportName}</p>
      {city ? <p className="mt-0.5 text-xs text-gray-500">{city}</p> : null}

      <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Scheduled</span>
          <span className="font-mono font-medium text-white">
            {scheduledTime ?? "—"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Estimated</span>
          <span className="font-mono font-medium text-amber-200/90">
            {estimatedTime ?? scheduledTime ?? "—"}
          </span>
        </div>
        {actualTime ? (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Actual</span>
            <span className="font-mono font-medium text-emerald-200/90">
              {actualTime}
            </span>
          </div>
        ) : null}
        {terminal ? (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Terminal</span>
            <span className="font-mono text-white">{terminal}</span>
          </div>
        ) : null}
        {gate ? (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Gate</span>
            <span className="font-mono text-white">{gate}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
