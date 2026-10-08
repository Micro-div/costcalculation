"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatCompactCurrency, formatCurrency, formatDurationRange } from "@/lib";
import type { EstimateResult } from "@/types";
import { Icon } from "@/components/common/Icon";

interface ShareModalProps {
  estimate: EstimateResult;
  /** Full link that rebuilds this estimate when opened (built in page.tsx). */
  shareUrl: string;
  onClose: () => void;
  notify: (message: string) => void;
  /** Opens the quotation editor, where the user can save the PDF. */
  onDownloadPdf: () => void;
}

interface Platform {
  id: string;
  label: string;
  color: string;
  icon: ReactNode;
  onClick: () => void;
}

/* Simple brand glyphs, drawn inline so no icon package is needed. */
const glyph = "h-6 w-6 text-white";

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20l1.3-4.2A8 8 0 1 1 8.3 18.8L4 20z" />
    <path d="M9.2 8.8c.2 2.6 3.2 5.4 5.8 5.8l1.1-1.2-2-1-.9.7c-.8-.4-1.7-1.3-2.1-2.1l.7-.9-1-2-1.6.7z" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = (
  <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7.5l8 6 8-6" />
  </svg>
);

const DiscordIcon = (
  <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 7.5c1.6-.8 3.2-1.2 5-1.2s3.4.4 5 1.2c1.4 2.4 2.2 5 2.4 8-1.2 1-2.6 1.7-4.1 2.1l-1-1.6c-.8.2-1.5.3-2.3.3s-1.5-.1-2.3-.3l-1 1.6C6.200 17.200 4.800 16.500 3.600 15.500c.2-3 1-5.600 2.400-8z" />
    <circle cx="9.500" cy="12.500" r="1.100" fill="currentColor" stroke="none" />
    <circle cx="14.500" cy="12.500" r="1.100" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedInIcon = (
  <svg viewBox="0 0 24 24" className={glyph} fill="currentColor" aria-hidden="true">
    <rect x="4" y="9.500" width="3.200" height="10" rx="0.600" />
    <circle cx="5.600" cy="5.800" r="1.900" />
    <path d="M10 9.500h3v1.500c.5-1 1.700-1.800 3.300-1.800 2.900 0 3.700 1.900 3.700 4.600v5.700h-3.200v-5c0-1.300-.2-2.400-1.700-2.400s-1.900 1.100-1.900 2.400v5H10V9.500z" />
  </svg>
);

const XIcon = (
  <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 4.500l14 15M19 4.500l-14 15" />
  </svg>
);

const FacebookIcon = (
  <svg viewBox="0 0 24 24" className={glyph} fill="currentColor" aria-hidden="true">
    <path d="M13.500 21v-7.500h2.500l.5-3h-3V8.700c0-.9.400-1.500 1.600-1.500h1.500V4.500c-.3 0-1.200-.1-2.300-.1-2.300 0-3.800 1.400-3.800 3.900v2.200H8v3h2.500V21h3z" />
  </svg>
);

const TelegramIcon = (
  <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 4L3 11l6 2.200L18 7l-7.500 7.500V19l3-2.800 4 3L21 4z" />
  </svg>
);

const CopyIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2.500" />
    <path d="M5 15V6.500A2.500 2.500 0 0 1 7.500 4H15" />
  </svg>
);

export function ShareModal({
  estimate,
  shareUrl,
  onClose,
  notify,
  onDownloadPdf,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = formatCurrency(estimate.total, estimate.location);
  const range = `${formatCompactCurrency(estimate.low, estimate.location)}–${formatCompactCurrency(estimate.high, estimate.location)}`;
  const subject = `${estimate.projectTitle} estimate: ${total}`;
  const message = `${estimate.projectTitle}: estimated at ${total} (range ${range}), about ${formatDurationRange(estimate.durationMin, estimate.durationMax, estimate.durationUnit)} in ${estimate.location.city}. See the full estimate:`;
  const messageWithLink = `${message} ${shareUrl}`;

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const copyText = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for browsers or pages where the clipboard API is blocked.
      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const copyLink = async () => {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      notify("Estimate link copied");
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      inputRef.current?.select();
      notify("Press Ctrl+C to copy the link");
    }
  };

  const openWindow = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedMessage = encodeURIComponent(message);

  const platforms: Platform[] = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      color: "#25d366",
      icon: WhatsAppIcon,
      onClick: () =>
        openWindow(`https://wa.me/?text=${encodeURIComponent(messageWithLink)}`),
    },
    {
      id: "email",
      label: "Email",
      color: "#6754e7",
      icon: MailIcon,
      onClick: () => {
        // Opens the user's email app with the message already written.
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n${shareUrl}\n`)}`;
      },
    },
    {
      id: "discord",
      label: "Discord",
      color: "#5865f2",
      icon: DiscordIcon,
      onClick: async () => {
        // Discord has no share link, so copy the message and open Discord.
        const ok = await copyText(messageWithLink);
        notify(
          ok
            ? "Message copied. Paste it in Discord."
            : "Could not copy. Use Copy link instead.",
        );
        openWindow("https://discord.com/channels/@me");
      },
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      color: "#0a66c2",
      icon: LinkedInIcon,
      onClick: () =>
        openWindow(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        ),
    },
    {
      id: "x",
      label: "X",
      color: "#16141c",
      icon: XIcon,
      onClick: () =>
        openWindow(
          `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
        ),
    },
    {
      id: "facebook",
      label: "Facebook",
      color: "#1877f2",
      icon: FacebookIcon,
      onClick: () =>
        openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      id: "telegram",
      label: "Telegram",
      color: "#229ed9",
      icon: TelegramIcon,
      onClick: () =>
        openWindow(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
        ),
    },
  ];

  const nativeShare = async () => {
    try {
      await navigator.share({ title: subject, text: message, url: shareUrl });
    } catch {
      // The user closed the share sheet. Nothing to do.
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-[110] flex items-end justify-center bg-[#15131b]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="w-full max-w-md overflow-hidden rounded-t-[24px] border border-white/60 bg-white shadow-2xl sm:rounded-[24px]"
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2
              id="share-modal-title"
              className="text-lg font-bold tracking-[-0.03em] text-[#1d1b25]"
            >
              Share this estimate
            </h2>
            <p className="mt-1 truncate text-xs text-[#777381]">
              {estimate.projectTitle} · {total}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e8e6ec] text-[#5f5c68] transition hover:bg-[#f5f4f7]"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-5 sm:px-6">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={platform.onClick}
              className="group flex flex-col items-center gap-2 rounded-2xl p-1 outline-none focus-visible:ring-4 focus-visible:ring-[#6754e7]/20"
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl transition group-hover:scale-105 group-active:scale-95"
                style={{ backgroundColor: platform.color }}
              >
                {platform.icon}
              </span>
              <span className="text-[11px] font-semibold text-[#4f4a57]">
                {platform.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 px-5 sm:px-6">
          <label
            htmlFor="share-link"
            className="text-xs font-bold text-[#46424f]"
          >
            Estimate link
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="share-link"
              ref={inputRef}
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="h-11 min-w-0 flex-1 truncate rounded-xl border border-[#dedbe5] bg-[#faf9fb] px-3 text-xs text-[#5c5864] outline-none focus:border-[#6f57e8] focus:ring-4 focus:ring-[#6f57e8]/10"
            />
            <button
              type="button"
              onClick={copyLink}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#6754e7] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(103,84,231,0.22)] transition hover:bg-[#5946d3]"
            >
              {copied ? (
                <Icon name="check" className="h-4 w-4" />
              ) : (
                CopyIcon
              )}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#8a8590]">
            Anyone with this link can see your project details and estimate.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-[#ebe9f0] bg-[#faf9fb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDownloadPdf();
            }}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#dcd8e2] bg-white px-4 py-2.5 text-sm font-semibold text-[#3e3a46] transition hover:bg-[#f6f5f7]"
          >
            <Icon name="download" className="h-4 w-4" />
            Download PDF
          </button>
          {canNativeShare && (
            <button
              type="button"
              onClick={nativeShare}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#5b4abe] transition hover:bg-[#f0edff]"
            >
              <Icon name="share" className="h-4 w-4" />
              More apps
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
