import type { FlightDetail } from "./flightDetailsTypes";
import { parseHmToMinutes } from "./flightDetailFallbacks";

export const FAMILY_MILESTONE_STEPS = [
  "Boarding complete",
  "Pushback",
  "Takeoff",
  "Cruising",
  "Descending",
  "Landed",
  "Arrived at gate",
] as const;

export type FamilyMilestoneStep = (typeof FAMILY_MILESTONE_STEPS)[number];

export function familyMilestoneSteps(): readonly FamilyMilestoneStep[] {
  return FAMILY_MILESTONE_STEPS;
}

/** Active milestone index 0..6 */
export function familyMilestoneCurrentIndex(d: FlightDetail): number {
  const p = d.livePhase;
  const pct = Math.min(100, Math.max(0, d.progressPercent ?? 0));
  if (pct >= 99 || (p === "landed" && pct >= 92)) return 6;
  if (p === "landed") return 5;
  if (p === "landing") return 4;
  if (p === "in_air") {
    if (pct >= 82) return 4;
    return 3;
  }
  if (p === "taxiing") return 1;
  if (p === "boarding") return 0;
  if (pct >= 6 && pct < 22) return 2;
  if (pct >= 22 && pct < 82) return 3;
  if (pct >= 82) return 4;
  return 0;
}

function minutesRemainingFromSchedule(d: FlightDetail): number | null {
  const dep =
    parseHmToMinutes(d.actualDepartureTime) ??
    parseHmToMinutes(d.estimatedDepartureTime) ??
    parseHmToMinutes(d.departureTime);
  const arr =
    parseHmToMinutes(d.actualArrivalTime) ??
    parseHmToMinutes(d.estimatedArrivalTime) ??
    parseHmToMinutes(d.arrivalTime);
  if (dep == null || arr == null) return null;
  let arrT = arr;
  if (arrT <= dep) arrT += 24 * 60;
  const now = new Date();
  let nt = now.getHours() * 60 + now.getMinutes();
  if (nt < dep - 3 * 60) nt += 24 * 60;
  const remain = arrT - nt;
  if (remain < 0 || remain > 24 * 60) return null;
  return Math.max(1, Math.round(remain));
}

export function familyShareMinutesRemaining(d: FlightDetail): number | null {
  const candidates = [
    d.routeSublabel,
    d.estimatedArrivalCaption,
    d.liveStatusPhrase,
  ].filter(Boolean) as string[];
  for (const s of candidates) {
    const m = s.match(/(\d+)\s*min(?:ute)?s?/i);
    if (m) return parseInt(m[1], 10);
  }
  if (
    d.livePhase === "in_air" ||
    d.livePhase === "landing" ||
    (d.progressPercent ?? 0) > 10
  ) {
    return minutesRemainingFromSchedule(d);
  }
  return null;
}

export function formatFamilyFlightTitle(raw: string): string {
  const t = raw.trim().toUpperCase();
  const m = t.match(/^([A-Z]{1,3})(\d[\dA-Z]*)$/);
  if (m) return `${m[1]} ${m[2]}`;
  return t;
}

export function familyCityLine(d: FlightDetail): string {
  const dep = simplifyAirportName(
    d.departureCity || d.departureAirportName || ""
  );
  const arr = simplifyAirportName(
    d.arrivalCity || d.arrivalAirportName || ""
  );
  if (!dep && !arr) return "";
  return `${dep} → ${arr}`;
}

function simplifyAirportName(s: string): string {
  return s
    .replace(/\s+International/gi, "")
    .replace(/\s+Airport/gi, "")
    .trim();
}

export function familyRouteCodes(d: FlightDetail): {
  dep: string;
  arr: string;
} {
  return {
    dep: d.departureAirportCode?.trim().toUpperCase() || "—",
    arr: d.arrivalAirportCode?.trim().toUpperCase() || "—",
  };
}

export function familyShareStatusLine(d: FlightDetail): {
  status: string;
  sub?: string;
} {
  const status = d.routePhaseLabel || d.status || "Scheduled";
  const sub =
    d.routeSublabel || d.estimatedArrivalCaption || undefined;
  return { status, sub };
}

/** Large emotional headline for the progress hero */
export function familyShareProgressHeadline(d: FlightDetail): string {
  const sub = d.routeSublabel?.trim() ?? "";
  if (d.livePhase === "boarding") return "Boarding now";
  if (d.livePhase === "taxiing") return "Taxiing to the runway";
  if (d.livePhase === "in_air") {
    if (/landing in/i.test(sub)) return sub;
    return "In the air";
  }
  if (d.livePhase === "landing") {
    if (sub) return sub;
    return "Getting ready to land";
  }
  if (d.livePhase === "landed") return "Landed safely";
  if (/landing in/i.test(sub)) return sub;
  if (d.liveStatusPhrase) return d.liveStatusPhrase;
  return "Following your flight";
}

export function familyShareCountdownLine(d: FlightDetail): string | null {
  const mins = familyShareMinutesRemaining(d);
  if (mins != null && (d.livePhase === "in_air" || d.livePhase === "landing")) {
    return `Landing in ${mins} minutes`;
  }
  const sub = d.routeSublabel?.trim();
  if (sub && /landing in|depart|min ago|arriv/i.test(sub)) return sub;
  if (d.livePhase === "landed") {
    return "Passenger should be out in around 25 minutes";
  }
  const arr = d.estimatedArrivalTime ?? d.arrivalTime;
  if (arr) return `Arriving today at ${arr} local`;
  return d.estimatedArrivalCaption ?? null;
}

export function familyFriendlyStatusMessages(
  d: FlightDetail,
  familyMode: boolean
): string[] {
  const lines: string[] = [];
  const delayed =
    d.badges?.some((b) => b.text.toLowerCase().includes("delay")) ?? false;
  const mins = familyShareMinutesRemaining(d);

  if (familyMode) {
    if (d.livePhase === "landed") {
      lines.push(
        "Flight landed safely. Your family member should be leaving the aircraft soon."
      );
      lines.push(
        "Passenger should be out in around 25 minutes — meet them at arrivals when ready."
      );
    } else if (d.livePhase === "landing") {
      lines.push(
        mins != null
          ? `Landing soon — about ${mins} minutes to touchdown.`
          : "Landing soon — everything looks calm from here."
      );
    } else if (d.livePhase === "in_air") {
      lines.push("Your family member is safely in the air.");
      lines.push("Aircraft is cruising normally.");
      if (mins != null) {
        lines.push(`Expected to land in about ${mins} minutes.`);
      }
    } else if (d.livePhase === "boarding" || d.livePhase === "taxiing") {
      lines.push("Flight departed safely — or is about to — from the gate.");
      lines.push("We’ll update this page as the journey continues.");
    } else {
      lines.push("We’re tracking this flight for you.");
    }
    if (delayed) {
      lines.push(
        "There’s a small delay — airlines often make up time in the air."
      );
    }
    return [...new Set(lines)].slice(0, 6);
  }

  if (d.livePhase === "landed") {
    lines.push("Flight landed safely.");
    lines.push("They’re on the ground — allow time to reach the terminal.");
  } else if (d.livePhase === "in_air") {
    lines.push("Flight departed safely.");
    lines.push("Aircraft is cruising normally.");
    if (mins != null) {
      lines.push(`Landing in ${mins} minutes.`);
    }
  } else if (d.livePhase === "landing") {
    lines.push("Landing soon.");
    lines.push("Aircraft is descending — stay near your phone for updates.");
  } else if (d.livePhase === "boarding") {
    lines.push("Boarding is underway.");
  }

  if (delayed) {
    lines.push("There’s a delay — we’ll keep this page updated.");
  }

  const arr = d.estimatedArrivalTime ?? d.arrivalTime;
  if (arr && d.livePhase !== "landed") {
    lines.push(`Estimated arrival: ${arr} local time.`);
  }

  return [...new Set(lines)].slice(0, 6);
}

export function familyModeHeroLine(
  d: FlightDetail,
  minutes: number | null
): string {
  const dep = d.departureAirportCode ?? "origin";
  const arr = d.arrivalAirportCode ?? "destination";
  if (d.livePhase === "landed") {
    return "Your family member has landed safely and should be with you soon.";
  }
  if (d.livePhase === "landing" || (minutes != null && minutes <= 50)) {
    if (minutes != null) {
      return `Your family member is safely in the air and expected to land in about ${minutes} minutes.`;
    }
    return "Your family member is on approach — landing soon.";
  }
  if (d.livePhase === "in_air") {
    return `Your family member is in the air from ${dep} to ${arr}. Everything looks routine.`;
  }
  return `We’re watching ${formatFamilyFlightTitle(d.flightNumber)} from ${dep} to ${arr} for you.`;
}

export function buildWhatsAppFamilyMessage(
  d: FlightDetail,
  pageUrl: string
): string {
  const fn = formatFamilyFlightTitle(d.flightNumber);
  const { dep, arr } = familyRouteCodes(d);
  const mins = familyShareMinutesRemaining(d);
  let intro = "";
  let line2 = "";
  if (d.livePhase === "landed") {
    intro = `Flight ${fn} has landed (${dep} → ${arr}).`;
    line2 = "They should be leaving the aircraft soon.";
  } else if (!hasDeparted(d)) {
    intro = `Flight ${fn} is getting ready from ${dep} to ${arr}.`;
    line2 =
      d.estimatedDepartureTime || d.departureTime
        ? `Scheduled departure around ${d.estimatedDepartureTime ?? d.departureTime} local.`
        : "Follow the link for updates.";
  } else {
    intro = `Flight ${fn} is currently in the air from ${dep} to ${arr}.`;
    if (mins != null) {
      line2 = `Estimated landing in ${mins} minutes.`;
    } else {
      const cap = d.estimatedArrivalCaption ?? d.routeSublabel ?? "";
      line2 = cap || "Follow the link for live updates.";
    }
  }
  return `${intro}\n${line2}\nTrack live: ${pageUrl}`;
}

export type FamilyRelationshipOption =
  | "mother"
  | "father"
  | "wife"
  | "husband"
  | "child"
  | "friend";

export const FAMILY_RELATIONSHIP_CHOICES: {
  value: FamilyRelationshipOption;
  label: string;
}[] = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "wife", label: "Wife" },
  { value: "husband", label: "Husband" },
  { value: "child", label: "Child" },
  { value: "friend", label: "Friend" },
];

/** Warmer intro + standard flight lines + tracking URL (WhatsApp / SMS). */
export function buildPersonalizedFamilyShareMessage(
  d: FlightDetail,
  pageUrl: string,
  opts: { recipientName?: string; relationship?: FamilyRelationshipOption }
): string {
  const base = buildWhatsAppFamilyMessage(d, pageUrl);
  const name = opts.recipientName?.trim();
  const rel = opts.relationship;
  let warm = "";
  if (name) {
    warm = `Hi ${name} — `;
  }
  let heart = "";
  switch (rel) {
    case "mother":
    case "father":
      heart =
        "I wanted you to be able to follow my flight in real time.\n\n";
      break;
    case "wife":
    case "husband":
      heart = "Sharing my live route with you — see you soon.\n\n";
      break;
    case "child":
      heart = "You can watch my flight here.\n\n";
      break;
    case "friend":
      heart = "Sharing live tracking if you want to follow along.\n\n";
      break;
    default:
      heart = "";
  }
  return `${warm}${heart}${base}`;
}

export function buildFlightStatusCopyText(
  d: FlightDetail,
  pageUrl: string
): string {
  const fn = formatFamilyFlightTitle(d.flightNumber);
  const { dep, arr } = familyRouteCodes(d);
  const { status, sub } = familyShareStatusLine(d);
  const depT = d.estimatedDepartureTime ?? d.departureTime ?? "—";
  const arrT = d.estimatedArrivalTime ?? d.arrivalTime ?? "—";
  const pct = Math.round(Math.min(100, Math.max(0, d.progressPercent ?? 0)));
  const cd = familyShareCountdownLine(d);
  const lines = [
    `${fn} · ${d.airlineName ?? "Flight"}`,
    `${dep} → ${arr}`,
    `Status: ${status}`,
    sub ? `Note: ${sub}` : "",
    `Departure (local): ${depT}`,
    `Arrival (local): ${arrT}`,
    `Progress: ${pct}%`,
    cd ? cd : "",
    `Track: ${pageUrl}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export function hasDeparted(d: FlightDetail): boolean {
  const p = d.livePhase;
  if (p === "in_air" || p === "landing" || p === "landed" || p === "taxiing")
    return true;
  return (d.progressPercent ?? 0) >= 8;
}

export function estimatedArrivalDisplay(d: FlightDetail): string {
  return d.estimatedArrivalTime ?? d.arrivalTime ?? "—";
}

function shortTimeZoneLabel(iana?: string): string {
  if (!iana?.trim()) return "local";
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: iana.trim(),
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "local";
  } catch {
    return "local";
  }
}

/** Rough distance left from route progress (illustrative). */
export function familyDistanceRemainingDisplay(d: FlightDetail): string {
  const dist = d.stats?.distance?.trim();
  const pct = Math.min(100, Math.max(0, d.progressPercent ?? 0)) / 100;
  if (!dist) {
    const est = Math.round((1 - pct) * 420);
    return `~${est} nm remaining`;
  }
  const nm = dist.replace(/,/g, "").match(/([\d.]+)\s*nm/i);
  if (!nm) return dist;
  const total = parseFloat(nm[1]);
  const remaining = Math.max(0, Math.round(total * (1 - pct)));
  return `~${remaining} nm remaining`;
}

export function familyEtaLine(d: FlightDetail): string {
  const t = estimatedArrivalDisplay(d);
  if (t === "—") return "ETA — local";
  const z = shortTimeZoneLabel(d.arrivalTimeZone);
  return z !== "local" ? `ETA ${t} (${z})` : `ETA ${t} local`;
}

export function familyArrivalHelperLines(
  d: FlightDetail,
  familyMode: boolean
): string[] {
  const lines: string[] = [];
  const soft = (s: string) => s;

  if (d.livePhase === "landed") {
    lines.push(
      soft(
        familyMode
          ? "Estimated baggage claim in about 20 minutes."
          : "Baggage claim often starts within ~20 minutes."
      )
    );
    lines.push(
      soft(
        familyMode
          ? "They may be ready to leave the airport in around 35 minutes."
          : "Exit to meet & greet often ~35 minutes after landing."
      )
    );
    lines.push(
      soft(
        familyMode
          ? "Taxi queue at the airport looks moderate right now."
          : "Taxi queue: moderate (illustrative)."
      )
    );
  } else if (d.livePhase === "landing") {
    lines.push(
      soft(
        familyMode
          ? "After landing, allow a little time for taxi and disembarking."
          : "Post-landing: taxi to gate, then disembark."
      )
    );
  } else if (d.livePhase === "in_air") {
    lines.push(
      soft(
        familyMode
          ? "We’ll share baggage and exit tips again after landing."
          : "Arrival helpers appear after landing."
      )
    );
  } else {
    lines.push(
      soft(
        familyMode
          ? "We’ll show baggage and taxi tips once the flight is closer."
          : "Check back after departure for arrival tips."
      )
    );
  }

  return lines;
}
