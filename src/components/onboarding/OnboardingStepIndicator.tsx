"use client";

type Props = {
  total: number;
  current: number;
  className?: string;
};

export default function OnboardingStepIndicator({
  total,
  current,
  className = "",
}: Props) {
  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      role="tablist"
      aria-label="Onboarding progress"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          role="tab"
          aria-selected={i === current}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current
              ? "w-8 bg-gradient-to-r from-sky-500 to-blue-600"
              : "w-2 bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}
