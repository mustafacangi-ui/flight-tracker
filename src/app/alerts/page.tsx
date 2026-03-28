"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import AlertsTimeline from "../../components/AlertsTimeline";
import EmptyState from "../../components/EmptyState";
import QuietHoursCard from "../../components/QuietHoursCard";
import SectionHeader from "../../components/SectionHeader";
import SoundSettingsCard from "../../components/SoundSettingsCard";
import {
  GLOBAL_NOTIFICATION_SETTINGS_EVENT,
  loadGlobalNotificationSettings,
  saveGlobalNotificationSettings,
  type AlertSoundMode,
} from "../../lib/notificationGlobalSettings";
import {
  ALERT_TIMELINE_UPDATED_EVENT,
  loadAlertTimeline,
  type AlertTimelineItem,
} from "../../lib/alertHistoryStorage";
import { seedAlertTimelineIfEmpty } from "../../lib/mockNotificationSeed";

export default function AlertsPage() {
  const [items, setItems] = useState<AlertTimelineItem[]>([]);
  const [sound, setSound] = useState<AlertSoundMode>("soft");
  const [quietOn, setQuietOn] = useState(false);
  const [quietStart, setQuietStart] = useState("23:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [quietTravelOff, setQuietTravelOff] = useState(false);

  const refresh = useCallback(() => {
    setItems(loadAlertTimeline());
  }, []);

  useEffect(() => {
    seedAlertTimelineIfEmpty();
    refresh();
    const on = () => refresh();
    window.addEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
    return () => window.removeEventListener(ALERT_TIMELINE_UPDATED_EVENT, on);
  }, [refresh]);

  useEffect(() => {
    const g = loadGlobalNotificationSettings();
    setSound(g.sound);
    setQuietOn(g.quietHoursEnabled);
    setQuietStart(g.quietStart);
    setQuietEnd(g.quietEnd);
    setQuietTravelOff(g.quietHoursDisableDuringTravel);
    const on = () => {
      const n = loadGlobalNotificationSettings();
      setSound(n.sound);
      setQuietOn(n.quietHoursEnabled);
      setQuietStart(n.quietStart);
      setQuietEnd(n.quietEnd);
      setQuietTravelOff(n.quietHoursDisableDuringTravel);
    };
    window.addEventListener(GLOBAL_NOTIFICATION_SETTINGS_EVENT, on);
    return () =>
      window.removeEventListener(GLOBAL_NOTIFICATION_SETTINGS_EVENT, on);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-950 px-3 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-lg min-w-0">
        <Link
          href="/"
          className="text-sm text-gray-400 transition hover:text-white"
        >
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Notification center</h1>
        <p className="mt-1 text-xs text-gray-500">
          Live updates for flights you&apos;re tracking. Enable browser
          notifications in tracking preferences on any flight.
        </p>

        <section className="mt-8 space-y-4">
          <SectionHeader
            title="Sound & quiet hours"
            subtitle="Applies when this tab is open and an alert fires."
            className="mb-2"
          />
          <SoundSettingsCard
            value={sound}
            onChange={(v) => {
              setSound(v);
              saveGlobalNotificationSettings({ sound: v });
            }}
          />
          <QuietHoursCard
            enabled={quietOn}
            start={quietStart}
            end={quietEnd}
            disableDuringTravel={quietTravelOff}
            onEnabledChange={(v) => {
              setQuietOn(v);
              saveGlobalNotificationSettings({
                quietHoursEnabled: v,
                quietStart,
                quietEnd,
              });
            }}
            onStartChange={(v) => {
              setQuietStart(v);
              saveGlobalNotificationSettings({ quietStart: v });
            }}
            onEndChange={(v) => {
              setQuietEnd(v);
              saveGlobalNotificationSettings({ quietEnd: v });
            }}
            onDisableDuringTravelChange={(v) => {
              setQuietTravelOff(v);
              saveGlobalNotificationSettings({
                quietHoursDisableDuringTravel: v,
              });
            }}
          />
        </section>

        {items.length === 0 ? (
          <div className="mt-10 space-y-3">
            <SectionHeader title="Alerts" />
            <EmptyState
              title="No alerts yet"
              description="Tracked flight updates will appear here. Turn on Track Flight on a card to get started."
            />
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            <SectionHeader title="Alerts" />
            <AlertsTimeline items={items} />
          </div>
        )}
      </div>
    </div>
  );
}
