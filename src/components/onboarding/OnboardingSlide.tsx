"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  bullets?: readonly string[];
  visual?: ReactNode;
  className?: string;
};

export default function OnboardingSlide({
  title,
  subtitle,
  bullets,
  visual,
  className = "",
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex h-full min-h-0 flex-col px-5 pb-6 pt-2 sm:px-8 ${className}`}
    >
      {visual ? (
        <div className="mb-6 flex min-h-[140px] flex-1 items-center justify-center sm:min-h-[180px]">
          {visual}
        </div>
      ) : null}
      <div className="mt-auto space-y-3 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="text-base leading-relaxed text-slate-400 sm:text-lg">
          {subtitle}
        </p>
        {bullets && bullets.length > 0 ? (
          <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-slate-300 sm:mx-0">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </motion.div>
  );
}
