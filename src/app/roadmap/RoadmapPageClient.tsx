"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  FEATURE_REQUESTS_UPDATED_EVENT,
  addFeatureRequest,
  loadFeatureRequests,
  type FeatureRequest,
} from "../../lib/featureRequestsStorage";
import { I18N_LANGUAGES, I18N_ROLLOUT_PHASES } from "../../lib/i18nRoadmap";
import {
  FREE_FEATURES,
  PREMIUM_FEATURES,
} from "../../lib/premiumTier";
import {
  addWaitlistEmail,
  waitlistCount,
} from "../../lib/waitlistStorage";
import {
  buildReferralShareUrl,
  referralInviteMessage,
} from "../../lib/referralStorage";
import { getAnalyticsSnapshot, topKeys } from "../../lib/localAnalytics";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
      {children}
    </h2>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-gray-300">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function RoadmapPageClient() {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [waitEmail, setWaitEmail] = useState("");
  const [waitOk, setWaitOk] = useState(false);
  const [waitErr, setWaitErr] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const refreshRequests = useCallback(() => {
    setRequests(loadFeatureRequests());
  }, []);

  useEffect(() => {
    refreshRequests();
    const on = () => refreshRequests();
    window.addEventListener(FEATURE_REQUESTS_UPDATED_EVENT, on);
    return () => window.removeEventListener(FEATURE_REQUESTS_UPDATED_EVENT, on);
  }, [refreshRequests]);

  const submitFeedback = (e: FormEvent) => {
    e.preventDefault();
    const t = feedbackText.trim();
    if (t.length < 3) return;
    addFeatureRequest(t);
    setFeedbackText("");
    setFeedbackSent(true);
    window.setTimeout(() => setFeedbackSent(false), 2500);
  };

  const submitWaitlist = (e: FormEvent) => {
    e.preventDefault();
    setWaitErr(false);
    const ok = addWaitlistEmail(waitEmail);
    if (!ok) {
      setWaitErr(true);
      return;
    }
    setWaitOk(true);
    setWaitEmail("");
  };

  const waitlistTotal = waitOk ? waitlistCount() : 0;

  const copyReferral = async () => {
    const msg = referralInviteMessage();
    try {
      await navigator.clipboard.writeText(msg);
      setReferralCopied(true);
      window.setTimeout(() => setReferralCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const snap = typeof window !== "undefined" ? getAnalyticsSnapshot() : null;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-xl space-y-10">
        <header className="space-y-2">
          <Link
            href="/"
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← Back to tracker
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product roadmap
          </h1>
          <p className="text-sm leading-relaxed text-gray-400">
            What we are building next, how free vs Pro lines up, and how to
            shape the product.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Free vs Pro</SectionTitle>
          <p className="mt-2 text-xs text-gray-500">
            Current structure (billing integration planned).
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-200/80">
                Free
              </p>
              <BulletList items={[...FREE_FEATURES]} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-200/80">
                Pro
              </p>
              <BulletList items={[...PREMIUM_FEATURES]} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Referral</SectionTitle>
          <p className="mt-3 text-sm leading-relaxed text-gray-300">
            Invite friends and unlock 1 month of premium. (Campaign rules will
            ship with accounts — for now, share your link and we will honor
            referrals when billing goes live.)
          </p>
          <p className="mt-2 break-all font-mono text-xs text-gray-500">
            {typeof window !== "undefined" ? buildReferralShareUrl() : ""}
          </p>
          <button
            type="button"
            onClick={() => void copyReferral()}
            className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-white/[0.1]"
          >
            {referralCopied ? "Copied invite message" : "Copy invite message"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Mobile app waitlist</SectionTitle>
          <p className="mt-3 text-sm text-gray-300">
            Get notified when the iOS / Android app launches.
          </p>
          <form onSubmit={submitWaitlist} className="mt-4 flex flex-col gap-2">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={waitEmail}
              onChange={(e) => setWaitEmail(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-gray-600"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Join waitlist
            </button>
            {waitErr ? (
              <p className="text-xs text-red-300/90">Enter a valid email.</p>
            ) : null}
            {waitOk ? (
              <p className="text-xs text-emerald-300/90">
                You are on the list. ({waitlistTotal} signups stored locally in
                this browser.)
              </p>
            ) : null}
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Local analytics snapshot</SectionTitle>
          <p className="mt-2 text-xs text-gray-500">
            Privacy-first counts in this browser only — replace with server
            analytics later.
          </p>
          {snap ? (
            <div className="mt-4 space-y-4 text-xs text-gray-400">
              <div>
                <p className="font-semibold text-gray-300">Top pages</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {topKeys(snap.pageViews, 6).map(({ key, count }) => (
                    <li key={key}>
                      {key} — {count}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300">Airport searches</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {topKeys(snap.airportSearches, 6).map(({ key, count }) => (
                    <li key={key}>
                      {key} — {count}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300">Saved flights</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {topKeys(snap.savedFlights, 6).map(({ key, count }) => (
                    <li key={key}>
                      {key} — {count}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300">Favorite airports</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {topKeys(snap.favoriteAirports, 6).map(({ key, count }) => (
                    <li key={key}>
                      {key} — {count}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300">Alert kinds</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {topKeys(snap.alertKinds, 8).map(({ key, count }) => (
                    <li key={key}>
                      {key} — {count}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300">Modes / toggles</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {topKeys(snap.modes, 12).map(({ key, count }) => (
                    <li key={key}>
                      {key} — {count}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Account & settings (planned)</SectionTitle>
          <BulletList
            items={[
              "Profile — display name, home airport, avatar",
              "Subscription — Pro status, invoices, referral credits",
              "Settings — units, language, quiet hours",
              "Connected devices — push targets, PWA installs",
              "Notification history — timeline of delivered alerts",
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Languages (planned)</SectionTitle>
          <p className="mt-2 text-sm text-gray-400">
            {I18N_LANGUAGES.map((l) => l.native).join(" · ")}
          </p>
          <BulletList items={[...I18N_ROLLOUT_PHASES]} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Coming soon</SectionTitle>
          <BulletList
            items={[
              "Stripe checkout & real Pro entitlements",
              "Family live mode (server-backed presence)",
              "Push notifications on native apps",
              "Premium board themes pack",
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Planned features</SectionTitle>
          <BulletList
            items={[
              "Historical flight data exports (Pro)",
              "Airport traffic intelligence v2",
              "Delay prediction model refresh",
              "Multi-leg connections planner",
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Recently added</SectionTitle>
          <BulletList
            items={[
              "Local Pro preview & upgrade modal",
              "Roadmap, referrals, and mobile waitlist (local storage)",
              "Client-side usage aggregates for product insight",
              "Premium badges on intelligence surfaces",
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <SectionTitle>Feedback requests</SectionTitle>
          <p className="mt-2 text-sm text-gray-400">
            Stored in this browser under{" "}
            <span className="font-mono text-gray-500">featureRequests</span>.
          </p>
          <form onSubmit={submitFeedback} className="mt-4 space-y-2">
            <label htmlFor="roadmap-feedback" className="sr-only">
              Suggest a feature
            </label>
            <textarea
              id="roadmap-feedback"
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Suggest a feature"
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={feedbackText.trim().length < 3}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              Submit
            </button>
            {feedbackSent ? (
              <p className="text-xs text-emerald-300/90">Thanks — saved locally.</p>
            ) : null}
          </form>
          {requests.length > 0 ? (
            <ul className="mt-5 space-y-3 border-t border-white/10 pt-4">
              {requests.slice(0, 12).map((r) => (
                <li key={r.id} className="text-sm text-gray-300">
                  <span className="text-xs text-gray-600">
                    {new Date(r.at).toLocaleString()}
                  </span>
                  <p className="mt-0.5">{r.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No requests yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
