export type FlightLivePhase =
  | "boarding"
  | "taxiing"
  | "in_air"
  | "landing"
  | "landed";

export type FlightTimelineEventState = "completed" | "active" | "upcoming";

export interface FlightTimelineEvent {
  time: string;
  label: string;
  state: FlightTimelineEventState;
}

export type DelayRiskLevel = "low" | "medium" | "high";

export interface RelatedFlight {
  flightNumber: string;
  from: string;
  to: string;
  departureTime?: string;
}

export interface FlightBadgeItem {
  text: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export interface FlightMiniStats {
  /** e.g. "1,247 nm" */
  distance?: string;
  /** e.g. "2h 20m" */
  duration?: string;
  /** e.g. "452 kts" */
  speed?: string;
  /** e.g. "36,000 ft" */
  altitude?: string;
  /** Placeholder / optional */
  destinationWeather?: string;
}

export type AircraftHistoryDayGroup = "today" | "yesterday" | "earlier";

/** Aircraft / route history row */
export interface AircraftHistoryItem {
  flightNumber: string;
  from: string;
  to: string;
  /** Shown as leading time on timeline row, e.g. "07:10" */
  departureTime?: string;
  arrivalTime?: string;
  status?: string;
  delayed?: boolean;
  /** false = show on-time style */
  onTime?: boolean;
  /** Minutes from previous segment arrival to this departure */
  turnaroundFromPrevMinutes?: number;
  /** Group under timeline section headings */
  dayGroup?: AircraftHistoryDayGroup;
  /** Row is the flight the user is viewing on this page */
  isCurrent?: boolean;
}

export interface AircraftTurnaroundInfo {
  /** One-line summary, e.g. "Aircraft arrived at SAW from FRA at 12:05" */
  narrativeLine?: string;
  groundTimeBeforeNextDeparture?: string;
  /** Full sentence when inbound was late */
  lateInboundMessage?: string;
}

export interface AircraftUsageStats {
  flightsToday?: number;
  airportsVisitedToday?: number;
  totalFlightTimeToday?: string;
  longestRouteToday?: string;
  /** Average ground time between same-day legs, minutes */
  averageTurnaroundMinutes?: number;
  /** Count of delayed segments today (illustrative) */
  delaysToday?: number;
}

export type AircraftReadinessState =
  | "ready"
  | "cleaning"
  | "refueling"
  | "crew_boarding"
  | "delayed_inbound"
  | "awaiting_gate";

export interface PreviousFlightSummary {
  flightNumber: string;
  from: string;
  to: string;
  landedAgo?: string;
}

export interface InboundAircraftWarning {
  message: string;
  estimatedReadiness?: string;
}

/** Rich tail / rotation context for the aircraft activity UI */
export interface AircraftTailTracking {
  currentLocationLine?: string;
  turnaround?: AircraftTurnaroundInfo;
  usageStats?: AircraftUsageStats;
  /** Ordered stops, e.g. IST → FRA → IST → SAW → DUS */
  routeMapAirports?: string[];
  /** Start index of active leg (leg is airports[i] → airports[i+1]) */
  activeRouteLegStartIndex?: number;
  previousFlight?: PreviousFlightSummary;
  inboundWarning?: InboundAircraftWarning;
  /** Ground / gate readiness for this departure */
  readinessState?: AircraftReadinessState;
  /** Override label; otherwise derived from readinessState */
  readinessLabel?: string;
  /** Prominent delay callout (e.g. late inbound) */
  inboundDelayBadge?: {
    title: string;
    detail?: string;
  };
}

export interface FlightDetail {
  flightNumber: string;
  airlineName?: string;
  status?: string;
  statusTone?: "green" | "yellow" | "red" | "gray";

  departureAirportCode?: string;
  departureAirportName?: string;
  departureCity?: string;
  departureTime?: string;
  estimatedDepartureTime?: string;
  /** Actual off-block / wheels-up local time when known */
  actualDepartureTime?: string;
  /** IANA timezone for departure airport wall times */
  departureTimeZone?: string;

  arrivalAirportCode?: string;
  arrivalAirportName?: string;
  arrivalCity?: string;
  arrivalTime?: string;
  estimatedArrivalTime?: string;
  /** Actual touchdown / in-block local time when known */
  actualArrivalTime?: string;
  /** IANA timezone for arrival airport wall times */
  arrivalTimeZone?: string;

  gate?: string;
  /** Departure terminal */
  terminal?: string;
  departureTerminal?: string;
  /** Arrival terminal when known */
  arrivalTerminal?: string;
  /** Arrival gate when known */
  arrivalGate?: string;

  aircraftType?: string;
  tailNumber?: string;
  aircraftAgeYears?: number;
  seatLayout?: string;
  /** e.g. "186 seats" or just number handled in UI */
  seatCount?: number;
  registrationCountry?: string;

  progressPercent?: number;
  livePhase?: FlightLivePhase;

  /** Short headline for current phase, e.g. "Cruising at 36,000 ft" */
  liveStatusPhrase?: string;
  /** Extra lines for the live status card (e.g. "Boarding", "Final call") */
  liveStatusLines?: string[];
  routePhaseLabel?: string;
  routeSublabel?: string;
  /** Under bar, e.g. "Estimated arrival in 1h 42m" */
  estimatedArrivalCaption?: string;

  timelineEvents?: FlightTimelineEvent[];
  history?: AircraftHistoryItem[];
  nextFlight?: RelatedFlight;

  delayRiskLevel?: DelayRiskLevel;
  /** Bullet points for "Possible delay risk factors" */
  delayRiskFactors?: string[];

  badges?: FlightBadgeItem[];
  stats?: FlightMiniStats;

  /** Location line, stats, map, warnings — aircraft-centric context */
  aircraftTailTracking?: AircraftTailTracking;
}
