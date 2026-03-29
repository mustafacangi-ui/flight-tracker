"use client";

import { motion } from "framer-motion";

import type { FlightDetail } from "../../lib/flightDetailsTypes";

type Props = { flight: FlightDetail };

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function FamilyAirportCard({ flight }: Props) {
  const depCode = flight.departureAirportCode ?? "—";
  const arrCode = flight.arrivalAirportCode ?? "—";
  const depName = flight.departureAirportName ?? flight.departureCity ?? "Departure";
  const arrName = flight.arrivalAirportName ?? flight.arrivalCity ?? "Arrival";
  const depSched = flight.departureTime ?? "—";
  const arrSched = flight.arrivalTime ?? "—";
  const depEst = flight.estimatedDepartureTime ?? depSched;
  const arrEst = flight.estimatedArrivalTime ?? arrSched;
  const depTerm = flight.departureTerminal ?? flight.terminal ?? "—";
  const depGate = flight.gate ?? "—";
  const arrTerm = flight.arrivalTerminal ?? "—";
  const arrGate = flight.arrivalGate ?? "—";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.4)] ring-1 ring-blue-500/10 backdrop-blur-xl sm:rounded-3xl sm:p-6"
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Route
      </h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4 ring-1 ring-blue-500/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300/90">
            Departure
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{depCode}</p>
          <p className="mt-1 text-xs text-slate-400">{depName}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Scheduled" value={depSched} />
            <Field label="Estimated" value={depEst} />
            <Field label="Terminal" value={depTerm} />
            <Field label="Gate" value={depGate} />
          </div>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-4 ring-1 ring-sky-500/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300/90">
            Arrival
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{arrCode}</p>
          <p className="mt-1 text-xs text-slate-400">{arrName}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Scheduled" value={arrSched} />
            <Field label="Estimated" value={arrEst} />
            <Field label="Terminal" value={arrTerm} />
            <Field label="Gate" value={arrGate} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4 ring-1 ring-indigo-500/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/90">
          Aircraft
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Type"
            value={flight.aircraftType?.trim() || "—"}
          />
          <Field
            label="Tail / reg"
            value={flight.tailNumber?.trim() || "—"}
          />
        </div>
      </div>
    </motion.section>
  );
}
