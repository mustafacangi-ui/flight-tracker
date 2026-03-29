"use client";

import { useCallback, useEffect, useState } from "react";

import EnablePushNotificationsCard from "./EnablePushNotificationsCard";
import { ROUTE_WINGS_FLIGHT_SAVED_EVENT } from "../lib/pushEvents";

/**
 * After the user saves a flight, surfaces the push CTA once until dismissed (session).
 */
export default function PushPromotionHost() {
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem("rw_push_promo_dismissed", "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onSaved = () => {
      try {
        if (sessionStorage.getItem("rw_push_promo_dismissed")) return;
      } catch {
        /* ignore */
      }
      setVisible(true);
    };
    window.addEventListener(ROUTE_WINGS_FLIGHT_SAVED_EVENT, onSaved);
    return () =>
      window.removeEventListener(ROUTE_WINGS_FLIGHT_SAVED_EVENT, onSaved);
  }, []);

  if (!visible) return null;

  return (
    <EnablePushNotificationsCard
      variant="floating"
      onDismiss={dismiss}
      className="pointer-events-auto"
    />
  );
}
