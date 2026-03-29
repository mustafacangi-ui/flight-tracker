"use client";

import { motion } from "framer-motion";

type Props = {
  onClick: () => void;
  visible: boolean;
  onDismiss: () => void;
};

export default function PwaFloatingInstallButton({
  onClick,
  visible,
  onDismiss,
}: Props) {
  if (!visible) return null;

  return (
    <motion.div
      className="pointer-events-auto fixed bottom-[calc(6.125rem+env(safe-area-inset-bottom,0px))] right-4 z-[85] flex flex-col items-end gap-2 md:hidden"
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full border border-white/15 bg-slate-950/80 px-2 py-0.5 text-[10px] font-medium text-slate-500 backdrop-blur-md transition hover:text-slate-300"
        aria-label="Hide install button"
      >
        Hide
      </button>
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.94 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-600/90 to-slate-950/95 text-xl text-white shadow-[0_0_28px_rgba(37,99,235,0.45),0_12px_32px_rgba(0,0,0,0.45)] ring-1 ring-sky-400/25 backdrop-blur-md"
        aria-label="Install RouteWings app"
        title="Install app"
      >
        <span aria-hidden>✈</span>
      </motion.button>
    </motion.div>
  );
}
