"use client";

const btn =
  "flex w-full items-center justify-center gap-2 rounded-3xl border border-white/15 bg-white/[0.07] px-5 py-4 text-base font-semibold text-white transition hover:bg-white/[0.11] active:scale-[0.99] sm:py-5";

function cardPad(familyMode: boolean) {
  return familyMode ? "p-8 sm:p-10" : "p-6 sm:p-8";
}

type Props = {
  familyMode: boolean;
  copiedLink: boolean;
  copiedStatus: boolean;
  whatsAppHref: string;
  onCopyLink: () => void;
  onCopyStatus: () => void;
};

export default function FamilyShareActions({
  familyMode,
  copiedLink,
  copiedStatus,
  whatsAppHref,
  onCopyLink,
  onCopyStatus,
}: Props) {
  const small = familyMode ? "text-base sm:text-lg" : "text-sm sm:text-base";

  return (
    <section
      className={`rounded-3xl border border-white/[0.08] bg-white/[0.04] ${cardPad(familyMode)} shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-md`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        Share
      </h2>
      <p className={`mt-4 leading-relaxed text-gray-300 ${small}`}>
        {familyMode
          ? "Send this page to someone who’s waiting — no app needed."
          : "Copy a link, send on WhatsApp, or copy a full status message."}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <button type="button" onClick={onCopyLink} className={btn}>
          {copiedLink ? "Copied!" : "Copy link"}
        </button>
        <a
          href={whatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          Share on WhatsApp
        </a>
        <button type="button" onClick={onCopyStatus} className={btn}>
          {copiedStatus ? "Copied!" : "Copy status text"}
        </button>
      </div>
    </section>
  );
}
