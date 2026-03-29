"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState, type ReactNode } from "react";

import OnboardingStepIndicator from "./OnboardingStepIndicator";

export type OnboardingCarouselSlide = {
  key: string;
  content: ReactNode;
};

type Props = {
  slides: readonly OnboardingCarouselSlide[];
  onComplete: () => void;
  completeLabel?: string;
  nextLabel?: string;
  skipLabel?: string;
};

export default function OnboardingCarousel({
  slides,
  onComplete,
  completeLabel = "Get started",
  nextLabel = "Next",
  skipLabel = "Skip",
}: Props) {
  const [index, setIndex] = useState(0);
  const last = index >= slides.length - 1;

  const goNext = useCallback(() => {
    if (last) onComplete();
    else setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [last, onComplete, slides.length]);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 justify-end px-5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        <button
          type="button"
          onClick={skip}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-300"
        >
          {skipLabel}
        </button>
      </div>

      <OnboardingStepIndicator
        total={slides.length}
        current={index}
        className="shrink-0 py-4"
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={slides[index]?.key ?? index}
            className="absolute inset-0 flex flex-col overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {slides[index]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="shrink-0 border-t border-white/10 bg-[#060a12]/90 px-5 py-4 backdrop-blur-md sm:px-8"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mx-auto flex max-w-lg gap-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Back
            </button>
          ) : (
            <span className="w-[88px]" aria-hidden />
          )}
          <button
            type="button"
            onClick={goNext}
            className="min-w-0 flex-1 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(37,99,235,0.35)] transition hover:brightness-110"
          >
            {last ? completeLabel : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
