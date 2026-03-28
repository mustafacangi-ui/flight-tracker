import {
  loadAlertTimeline,
  saveAlertTimeline,
  type AlertTimelineItem,
} from "./alertHistoryStorage";

/**
 * Populate the in-app alert timeline once with realistic demo rows
 * so notification UI always has content before live tracking fires.
 */
export function seedAlertTimelineIfEmpty(): void {
  if (typeof window === "undefined") return;
  if (loadAlertTimeline().length > 0) return;

  const now = Date.now();
  const mk = (
    id: string,
    atOffsetMin: number,
    flightNumber: string,
    kind: AlertTimelineItem["kind"],
    text: string,
    extra?: Partial<AlertTimelineItem>
  ): AlertTimelineItem => ({
    id,
    at: now - atOffsetMin * 60_000,
    flightNumber,
    kind,
    text,
    ...extra,
  });

  const items: AlertTimelineItem[] = [
    mk(
      "seed-tk-delay",
      6,
      "TK1234",
      "delayed",
      "Delayed by 20 min — new ETD posted",
      { title: "Delayed" }
    ),
    mk(
      "seed-lh-gate",
      14,
      "LH2029",
      "gate",
      "Gate changed to B16",
      { title: "Gate changed" }
    ),
    mk(
      "seed-tk-group",
      22,
      "TK1234",
      "grouped",
      "TK1234 — 3 updates",
      {
        title: "TK1234 updates",
        detailLines: [
          "Boarding started",
          "Gate changed to B16",
          "Delayed by 15 min",
        ],
      }
    ),
    mk(
      "seed-pc-delay",
      95,
      "PC2092",
      "delayed",
      "Delayed by 15 min — new ETD posted",
      { title: "Delayed" }
    ),
    mk(
      "seed-tk-board",
      140,
      "TK1234",
      "boarding",
      "Final boarding — gate A12",
      { title: "Boarding" }
    ),
    mk(
      "seed-yesterday",
      26 * 60,
      "LH2029",
      "departed",
      "Departed on time from DUS",
      { title: "Departed" }
    ),
    mk(
      "seed-older",
      52 * 60,
      "TK1587",
      "landed",
      "Landed at FRA",
      { title: "Landed" }
    ),
  ];

  saveAlertTimeline(items);
}
