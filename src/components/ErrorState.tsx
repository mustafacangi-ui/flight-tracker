"use client";

type Props = {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export default function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-3xl border border-red-500/30 bg-red-500/[0.07] px-4 py-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.2)] sm:px-6 ${className}`.trim()}
      role="alert"
    >
      <p className="text-sm font-semibold text-red-50">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-red-200/85">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl border border-red-400/45 bg-red-500/25 px-4 py-2.5 text-sm font-medium text-red-50 transition duration-200 hover:border-red-300/50 hover:bg-red-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
