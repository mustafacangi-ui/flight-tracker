/**
 * Adapter to convert AeroDataBox FlightDetail to legacy FlightDetail format
 * Used for compatibility with existing UI components
 */

import type { FlightDetail as AeroFlightDetail } from "./aerodatabox";
import type { FlightDetail as LegacyFlightDetail, FlightTimelineEvent, FlightBadgeItem, FlightMiniStats, DelayRiskLevel } from "./flightDetailsTypes";

export function adaptAeroFlightToLegacy(aero: AeroFlightDetail | null): LegacyFlightDetail | null {
  if (!aero) return null;

  const dep = aero.departure;
  const arr = aero.arrival;
  const depAirport = dep?.airport;
  const arrAirport = arr?.airport;

  // Build timeline events based on flight status
  const timelineEvents = buildTimelineEvents(aero);

  // Build badges from status
  const badges = buildBadges(aero);

  // Determine delay risk level
  const delayRiskLevel = calculateDelayRisk(aero.delayMinutes);

  // Build mini stats
  const stats: FlightMiniStats = {
    altitude: undefined, // Would need live tracking data
    speed: undefined,
    distance: undefined,
    duration: calculateDuration(aero.scheduledDeparture, aero.scheduledArrival),
  };

  return {
    flightNumber: aero.number,
    airlineName: aero.airline?.name ?? aero.airline?.iata ?? "Unknown",
    status: aero.status,
    statusTone: getStatusTone(aero.status),

    // Departure
    departureAirportCode: depAirport?.iata ?? depAirport?.icao ?? "—",
    departureAirportName: depAirport?.shortName ?? depAirport?.name ?? "—",
    departureCity: depAirport?.municipalityName ?? undefined,
    departureTime: aero.scheduledDeparture ?? undefined,
    estimatedDepartureTime: aero.estimatedDeparture ?? undefined,
    actualDepartureTime: aero.actualDeparture ?? undefined,
    departureTimeZone: depAirport?.timeZone ?? depAirport?.ianaTimeZone ?? undefined,

    // Arrival
    arrivalAirportCode: arrAirport?.iata ?? arrAirport?.icao ?? "—",
    arrivalAirportName: arrAirport?.shortName ?? arrAirport?.name ?? "—",
    arrivalCity: arrAirport?.municipalityName ?? undefined,
    arrivalTime: aero.scheduledArrival ?? undefined,
    estimatedArrivalTime: aero.estimatedArrival ?? undefined,
    actualArrivalTime: aero.actualArrival ?? undefined,
    arrivalTimeZone: arrAirport?.timeZone ?? arrAirport?.ianaTimeZone ?? undefined,

    // Gates and terminals
    gate: dep?.gate ?? undefined,
    terminal: dep?.terminal ?? undefined,
    departureTerminal: dep?.terminal ?? undefined,
    arrivalTerminal: arr?.terminal ?? undefined,
    arrivalGate: arr?.gate ?? undefined,

    // Aircraft
    aircraftType: aero.aircraft?.model ?? aero.aircraft?.modelCode ?? undefined,
    tailNumber: aero.aircraft?.reg ?? undefined,
    aircraftAgeYears: undefined, // Not available from AeroDataBox
    seatLayout: undefined,
    seatCount: undefined,
    registrationCountry: undefined,

    // Progress
    progressPercent: calculateProgress(aero),
    livePhase: getLivePhase(aero.status),
    liveStatusPhrase: buildLiveStatusPhrase(aero),
    liveStatusLines: buildLiveStatusLines(aero),
    routePhaseLabel: undefined,
    routeSublabel: undefined,
    estimatedArrivalCaption: aero.estimatedArrival 
      ? `Estimated arrival ${formatTimeRemaining(aero.estimatedArrival)}`
      : undefined,

    // Timeline and related
    timelineEvents,
    history: undefined,
    nextFlight: undefined,

    // Risk
    delayRiskLevel,
    delayRiskFactors: aero.delayMinutes > 0 
      ? [`Flight is delayed by ${aero.delayMinutes} minutes`] 
      : undefined,

    // Badges and stats
    badges,
    stats,

    // Aircraft tail tracking - not available from basic AeroDataBox
    aircraftTailTracking: undefined,
  };
}

function buildTimelineEvents(aero: AeroFlightDetail): FlightTimelineEvent[] {
  const events: FlightTimelineEvent[] = [];
  const dep = aero.departure;
  const arr = aero.arrival;

  // Check-in event
  if (aero.scheduledDeparture) {
    const checkInTime = new Date(new Date(aero.scheduledDeparture).getTime() - 2 * 60 * 60 * 1000);
    events.push({
      time: checkInTime.toISOString(),
      label: "Check-in opens",
      state: new Date() > checkInTime ? "completed" : "upcoming",
    });
  }

  // Boarding event (estimated 30-45 min before departure)
  if (aero.scheduledDeparture) {
    const boardingTime = new Date(new Date(aero.scheduledDeparture).getTime() - 40 * 60 * 1000);
    const isBoarding = aero.status?.toLowerCase().includes("board");
    events.push({
      time: boardingTime.toISOString(),
      label: "Boarding",
      state: isBoarding ? "active" : new Date() > boardingTime ? "completed" : "upcoming",
    });
  }

  // Departure
  if (aero.actualDeparture || aero.estimatedDeparture || aero.scheduledDeparture) {
    const depTime = aero.actualDeparture ?? aero.estimatedDeparture ?? aero.scheduledDeparture;
    const hasDeparted = aero.actualDeparture || aero.status?.toLowerCase().includes("depart");
    events.push({
      time: depTime!,
      label: "Departure",
      state: hasDeparted ? "completed" : "upcoming",
    });
  }

  // Arrival
  if (aero.actualArrival || aero.estimatedArrival || aero.scheduledArrival) {
    const arrTime = aero.actualArrival ?? aero.estimatedArrival ?? aero.scheduledArrival;
    const hasArrived = aero.actualArrival || aero.status?.toLowerCase().includes("land") || aero.status?.toLowerCase().includes("arriv");
    events.push({
      time: arrTime!,
      label: "Arrival",
      state: hasArrived ? "completed" : "upcoming",
    });
  }

  return events;
}

function buildBadges(aero: AeroFlightDetail): FlightBadgeItem[] {
  const badges: FlightBadgeItem[] = [];
  const status = aero.status?.toLowerCase() ?? "";

  if (status.includes("delay")) {
    badges.push({ text: `Delayed ${aero.delayMinutes}m`, variant: "warning" });
  }
  if (status.includes("cancel")) {
    badges.push({ text: "Cancelled", variant: "danger" });
  }
  if (status.includes("board")) {
    badges.push({ text: "Boarding", variant: "info" });
  }
  if (status.includes("gate")) {
    const gate = aero.departure?.gate;
    if (gate) badges.push({ text: `Gate ${gate}`, variant: "neutral" });
  }
  if (status.includes("depart") || status.includes("airborne")) {
    badges.push({ text: "Departed", variant: "success" });
  }
  if (status.includes("land") || status.includes("arriv")) {
    badges.push({ text: "Arrived", variant: "success" });
  }

  return badges;
}

function getStatusTone(status: string): "green" | "yellow" | "red" | "gray" {
  const s = status.toLowerCase();
  if (s.includes("delay") || s.includes("cancel")) return "red";
  if (s.includes("board") || s.includes("gate")) return "yellow";
  if (s.includes("depart") || s.includes("airborne") || s.includes("land") || s.includes("arriv")) return "green";
  return "gray";
}

function getLivePhase(status: string): import("./flightDetailsTypes").FlightLivePhase | undefined {
  const s = status.toLowerCase();
  if (s.includes("board")) return "boarding";
  if (s.includes("depart") || s.includes("airborne")) return "in_air";
  if (s.includes("land")) return "landing";
  if (s.includes("arriv")) return "landed";
  return undefined;
}

function buildLiveStatusPhrase(aero: AeroFlightDetail): string | undefined {
  const status = aero.status?.toLowerCase() ?? "";
  
  if (status.includes("board")) return "Now Boarding";
  if (status.includes("gate")) return "Gate Open";
  if (status.includes("depart") || status.includes("airborne")) return "In Flight";
  if (status.includes("land")) return "Just Landed";
  if (status.includes("arriv")) return "Arrived";
  if (status.includes("delay")) return "Delayed";
  if (status.includes("cancel")) return "Cancelled";
  
  return "Scheduled";
}

function buildLiveStatusLines(aero: AeroFlightDetail): string[] | undefined {
  const lines: string[] = [];
  const dep = aero.departure;
  const arr = aero.arrival;

  if (dep?.gate) lines.push(`Gate ${dep.gate}`);
  if (dep?.terminal) lines.push(`Terminal ${dep.terminal}`);
  if (arr?.gate) lines.push(`Arrival Gate ${arr.gate}`);
  if (aero.delayMinutes > 0) lines.push(`${aero.delayMinutes} minutes delay`);

  return lines.length > 0 ? lines : undefined;
}

function calculateDelayRisk(delayMinutes: number): DelayRiskLevel {
  if (delayMinutes > 60) return "high";
  if (delayMinutes > 15) return "medium";
  return "low";
}

function calculateProgress(aero: AeroFlightDetail): number | undefined {
  if (!aero.scheduledDeparture || !aero.scheduledArrival) return undefined;
  
  const dep = new Date(aero.actualDeparture ?? aero.estimatedDeparture ?? aero.scheduledDeparture).getTime();
  const arr = new Date(aero.actualArrival ?? aero.estimatedArrival ?? aero.scheduledArrival).getTime();
  const now = Date.now();
  
  if (now < dep) return 0;
  if (now > arr) return 100;
  
  return Math.round(((now - dep) / (arr - dep)) * 100);
}

function calculateDuration(dep: string | null, arr: string | null): string | undefined {
  if (!dep || !arr) return undefined;
  
  const depTime = new Date(dep).getTime();
  const arrTime = new Date(arr).getTime();
  const diffMs = arrTime - depTime;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatTimeRemaining(timeStr: string): string {
  const time = new Date(timeStr).getTime();
  const now = Date.now();
  const diffMs = time - now;
  
  if (diffMs < 0) return "soon";
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `in ${minutes}m`;
  return `in ${hours}h ${minutes}m`;
}
