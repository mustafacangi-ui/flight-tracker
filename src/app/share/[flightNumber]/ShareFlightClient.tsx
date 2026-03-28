"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import SectionHeader from "../../../components/SectionHeader";
import FamilyArrivalHelpers from "../../../components/family/FamilyArrivalHelpers";
import FamilyFlightHeader from "../../../components/family/FamilyFlightHeader";
import FamilyMapCard from "../../../components/family/FamilyMapCard";
import FamilyProgressCard from "../../../components/family/FamilyProgressCard";
import FamilyShareActions from "../../../components/family/FamilyShareActions";
import FamilyStatusCard from "../../../components/family/FamilyStatusCard";
import FlightMilestones from "../../../components/family/FlightMilestones";
import type { FlightDetail } from "../../../lib/flightDetailsTypes";
import {
  buildFlightStatusCopyText,
  buildWhatsAppFamilyMessage,
  familyMilestoneCurrentIndex,
  familyMilestoneSteps,
} from "../../../lib/familyShareView";
import { trackEvent } from "../../../lib/localAnalytics";

const FAMILY_MODE_KEY = "familyShareFamilyMode";

type Props = {
  flightNumberParam: string;
  detail: FlightDetail;
};

export default function ShareFlightClient({
  flightNumberParam,
  detail,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [familyMode, setFamilyMode] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(FAMILY_MODE_KEY);
      if (v === "1") setFamilyMode(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    trackEvent("family_share_view", {
      path: `/share/${flightNumberParam}`,
    });
  }, [flightNumberParam]);

  useEffect(() => {
    setPageUrl(
      `${window.location.origin}/share/${encodeURIComponent(flightNumberParam)}`
    );
  }, [flightNumberParam]);

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      setIsNight(h >= 20 || h < 6);
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const toggleFamilyMode = useCallback(() => {
    setFamilyMode((f) => {
      const n = !f;
      try {
        sessionStorage.setItem(FAMILY_MODE_KEY, n ? "1" : "0");
      } catch {
        /* ignore */
      }
      return n;
    });
  }, []);

  const pct = Math.min(100, Math.max(0, detail.progressPercent ?? 0));
  const steps = familyMilestoneSteps();
  const currentIdx = familyMilestoneCurrentIndex(detail);
  const depCity =
    detail.departureCity || detail.departureAirportName || "";
  const arrCity = detail.arrivalCity || detail.arrivalAirportName || "";

  const waText = useMemo(
    () => buildWhatsAppFamilyMessage(detail, pageUrl || "…"),
    [detail, pageUrl]
  );

  const wa =
    pageUrl.length > 0
      ? `https://wa.me/?text=${encodeURIComponent(waText)}`
      : "#";

  const copyLink = useCallback(async () => {
    const url =
      pageUrl ||
      `${typeof window !== "undefined" ? window.location.origin : ""}/share/${encodeURIComponent(flightNumberParam)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [pageUrl, flightNumberParam]);

  const copyStatus = useCallback(async () => {
    const url =
      pageUrl ||
      `${typeof window !== "undefined" ? window.location.origin : ""}/share/${encodeURIComponent(flightNumberParam)}`;
    try {
      await navigator.clipboard.writeText(
        buildFlightStatusCopyText(detail, url)
      );
      setCopiedStatus(true);
      window.setTimeout(() => setCopiedStatus(false), 2500);
    } catch {
      /* ignore */
    }
  }, [detail, pageUrl, flightNumberParam]);

  const foot = familyMode ? "text-base" : "text-sm";

  return (
    <motion.div
      className={`min-h-screen bg-[#0c0c0f] px-4 py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-white sm:px-6 md:pb-24 ${familyMode ? "text-lg" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-lg min-w-0 flex-col gap-8 sm:gap-10">
        <FamilyFlightHeader
          detail={detail}
          familyMode={familyMode}
          onToggleFamilyMode={toggleFamilyMode}
        />

        <section className="space-y-3">
          <SectionHeader
            title="Family tracking"
            subtitle="Large type and simple steps for relatives following along."
          />
          <FamilyProgressCard detail={detail} familyMode={familyMode} />
        </section>

        <FamilyMapCard
          departureCity={depCity || "Departure"}
          arrivalCity={arrCity || "Arrival"}
          progressPercent={pct}
          familyMode={familyMode}
          isNight={isNight}
        />

        <FamilyStatusCard detail={detail} familyMode={familyMode} />

        <FlightMilestones
          steps={steps}
          currentIdx={currentIdx}
          familyMode={familyMode}
        />

        <FamilyArrivalHelpers detail={detail} familyMode={familyMode} />

        <FamilyShareActions
          familyMode={familyMode}
          copiedLink={copied}
          copiedStatus={copiedStatus}
          whatsAppHref={wa}
          onCopyLink={() => void copyLink()}
          onCopyStatus={() => void copyStatus()}
        />

        <p className={`text-center text-gray-600 ${foot}`}>
          Information is illustrative for demo flights. Always confirm with{" "}
          {detail.airlineName ?? "the airline"}.
        </p>
      </div>
    </motion.div>
  );
}
