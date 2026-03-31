"use client";

import { motion } from "framer-motion";

function PlaceholderFrame({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-white/20 bg-gradient-to-br from-slate-900/90 to-slate-950/95 p-3 text-center shadow-inner backdrop-blur-sm ${className}`}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Placeholder
        </p>
        <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function AppStorePreviewGallery() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      aria-label="App Store preview assets"
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
        Store listing assets
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">
        Preview gallery for upcoming App Store and Google Play listings.
      </p>

      <div className="mt-6 space-y-8">
        <div>
          <p className="text-xs font-semibold text-sky-200/80">iPhone</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            <div className="w-[120px] shrink-0">
              <PlaceholderFrame
                label='6.7" screenshot 1'
                className="aspect-[9/19.5] w-full"
              />
            </div>
            <div className="w-[120px] shrink-0">
              <PlaceholderFrame
                label='6.7" screenshot 2'
                className="aspect-[9/19.5] w-full"
              />
            </div>
            <div className="w-[120px] shrink-0">
              <PlaceholderFrame
                label='6.7" screenshot 3'
                className="aspect-[9/19.5] w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-emerald-200/80">Android</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            <div className="w-[108px] shrink-0">
              <PlaceholderFrame
                label="Phone screenshot 1"
                className="aspect-[9/16] w-full"
              />
            </div>
            <div className="w-[108px] shrink-0">
              <PlaceholderFrame
                label="Phone screenshot 2"
                className="aspect-[9/16] w-full"
              />
            </div>
            <div className="w-[min(100%,220px)] shrink-0">
              <PlaceholderFrame
                label="Feature graphic 1024×500"
                className="aspect-[1024/500] w-full min-h-[72px]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div>
            <p className="text-xs font-semibold text-violet-200/80">App icon</p>
            <div className="mt-2">
              <PlaceholderFrame
                label="1024 × 1024"
                className="h-24 w-24 rounded-3xl"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-200/80">Splash</p>
            <div className="mt-2">
              <PlaceholderFrame
                label="Native splash (Capacitor)"
                className="h-24 w-40"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
