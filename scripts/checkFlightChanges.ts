/**
 * PM2 / long-running worker: polls tracked_flights, compares API state vs
 * last_status, sends web push when prefs allow, updates last_status JSON.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAPIDAPI_KEY,
 *      RAPIDAPI_HOST (optional), VAPID_* keys.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { fetchFlightDetailForTracked } from "../src/lib/push/fetchTrackedFlightDetail";
import {
  effectiveNotificationPrefs,
  parseLastStatus,
  resolvePushEvents,
  serializeSnapshot,
  snapshotFromDetail,
} from "../src/lib/push/flightPushEvents";
import { sendPushNotification } from "../src/lib/push/sendPushNotification";
import {
  captureWorkerError,
  initWorkerSentry,
} from "../src/lib/monitoring/workerSentry";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

initWorkerSentry();

const INTERVAL_MS = 300_000;

const LOG = "[push-worker]";

type TrackedRow = {
  id: string;
  user_id: string;
  flight_number: string;
  departure_airport: string | null;
  arrival_airport: string | null;
  last_status: string | null;
};

type PrefRow = {
  user_id: string;
  flight_delays: boolean | null;
  gate_changes: boolean | null;
  boarding_reminders: boolean | null;
  departures: boolean | null;
  arrivals: boolean | null;
  cancellations: boolean | null;
};

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`${LOG} missing required env: ${name}`);
  }
  return v;
}

async function runCycle(): Promise<void> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = requireEnv("RAPIDAPI_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`${LOG} checking tracked flights...`);

  const { data: rows, error: qErr } = await supabase
    .from("tracked_flights")
    .select(
      "id, user_id, flight_number, departure_airport, arrival_airport, last_status"
    );

  if (qErr) {
    console.error(`${LOG} tracked_flights query failed`, qErr.message);
    captureWorkerError(qErr, {
      area: "push_worker",
      tags: { phase: "query_tracked_flights" },
    });
    return;
  }

  const list = (rows ?? []) as TrackedRow[];
  if (list.length === 0) {
    console.log(`${LOG} no tracked flights`);
    return;
  }

  const userIds = [...new Set(list.map((r) => r.user_id))];
  const { data: prefRows } = await supabase
    .from("notification_preferences")
    .select(
      "user_id, flight_delays, gate_changes, boarding_reminders, departures, arrivals, cancellations"
    )
    .in("user_id", userIds);

  const prefMap = new Map<string, PrefRow>();
  for (const p of (prefRows ?? []) as PrefRow[]) {
    prefMap.set(p.user_id, p);
  }

  for (const row of list) {
    const fn = row.flight_number.trim().toUpperCase();
    try {
      const detail = await fetchFlightDetailForTracked({
        flightNumber: fn,
        departureAirport: row.departure_airport,
        arrivalAirport: row.arrival_airport,
        apiKey,
      });

      if (!detail) {
        console.log(`${LOG} flight not found in FIDS (skip) ${fn}`);
        continue;
      }

      const next = snapshotFromDetail(detail);
      const prev = parseLastStatus(row.last_status);
      const prefs = effectiveNotificationPrefs(prefMap.get(row.user_id));
      const events = resolvePushEvents({ prev, next, detail, prefs });

      if (events.length > 0) {
        console.log(`${LOG} status changed for ${fn}`);
      }

      const flightPath = `/flight/${encodeURIComponent(fn)}`;

      for (const ev of events) {
        const { sent, removed } = await sendPushNotification(
          supabase,
          row.user_id,
          {
            title: ev.title,
            body: ev.body,
            url: flightPath,
          }
        );
        if (sent > 0) {
          console.log(`${LOG} notification sent (${ev.kind}, ${sent} device(s))`);
        }
        if (removed > 0) {
          console.log(
            `${LOG} invalid subscription removed (${removed} row(s))`
          );
        }
      }

      const { error: upErr } = await supabase
        .from("tracked_flights")
        .update({ last_status: serializeSnapshot(next) })
        .eq("id", row.id);

      if (upErr) {
        console.error(`${LOG} failed to update last_status`, fn, upErr.message);
      }
    } catch (e) {
      console.error(`${LOG} row error`, fn, e);
    }
  }
}

async function main(): Promise<void> {
  console.log(`${LOG} worker started (interval ${INTERVAL_MS} ms)`);
  const tick = () => {
    void runCycle().catch((e) => {
      console.error(`${LOG} cycle failed`, e);
      captureWorkerError(e, {
        area: "push_worker",
        tags: { phase: "run_cycle" },
      });
    });
  };
  tick();
  setInterval(tick, INTERVAL_MS);
}

void main();
