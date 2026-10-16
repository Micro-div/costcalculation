import Link from "next/link";
import "./cta-banner.css";

type CtaBannerProps = {
  eyebrow?: string;
  titleLine1?: string;
  titleLine2?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  /** Leave secondaryLabel empty ("") to hide the secondary link. */
  secondaryLabel?: string;
  secondaryHref?: string;
};

export default function CtaBanner({
  eyebrow = "Free · No account needed",
  titleLine1 = "Your next project",
  titleLine2 = "starts with a number.",
  description = "Get a clear localized estimate and see what it takes to bring your project to life.",
  primaryLabel = "Start my free estimate",
  primaryHref = "/estimate",
  secondaryLabel = "See how it works",
  secondaryHref = "#how-it-works",
}: CtaBannerProps) {
  return (
    <section className="cc-cta" aria-labelledby="cc-cta-title">
      <div className="cc-cta__glow cc-cta__glow--one" aria-hidden="true" />
      <div className="cc-cta__glow cc-cta__glow--two" aria-hidden="true" />
      <div className="cc-cta__noise" aria-hidden="true" />

      <div className="cc-cta__content">
        <p className="cc-cta__eyebrow">
          <span aria-hidden="true" />
          {eyebrow}
        </p>

        <h2 id="cc-cta-title" className="cc-cta__title">
          {titleLine1}
          <br />
          {titleLine2}
        </h2>

        <p className="cc-cta__description">{description}</p>

        <div className="cc-cta__actions">
          <Link href={primaryHref} className="cc-cta__primary">
            <span>{primaryLabel}</span>

            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>

          {secondaryLabel && secondaryHref ? (
            <Link href={secondaryHref} className="cc-cta__secondary">
              <span>{secondaryLabel}</span>

              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="cc-cta__visual" aria-hidden="true">
        <div className="cc-cta__halo" />

        <svg
          className="cc-cta__art"
          viewBox="0 0 560 300"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="ccLeftPanel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#dce5ff" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="ccMiddlePanel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8faff" stopOpacity="0.96" />
              <stop offset="58%" stopColor="#bfcaff" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#8394ff" stopOpacity="0.62" />
            </linearGradient>

            <linearGradient id="ccFrontPanel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#eef3ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#aebcff" stopOpacity="0.48" />
            </linearGradient>

            <linearGradient id="ccDeepPanel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5259ff" />
              <stop offset="100%" stopColor="#3036e9" />
            </linearGradient>

            <filter id="ccShapeShadow">
              <feDropShadow
                dx="0"
                dy="16"
                stdDeviation="12"
                floodColor="#18157b"
                floodOpacity="0.18"
              />
            </filter>

            <filter id="ccSoftGlow">
              <feGaussianBlur stdDeviation="8" />
            </filter>

            <clipPath id="ccArtClip">
              <rect x="0" y="0" width="560" height="300" rx="24" />
            </clipPath>
          </defs>

          <g clipPath="url(#ccArtClip)">
            <circle
              cx="355"
              cy="148"
              r="126"
              fill="none"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth="1.5"
            />

            <circle
              cx="355"
              cy="148"
              r="92"
              fill="rgba(255,255,255,0.025)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />

            <rect
              x="482"
              y="25"
              width="76"
              height="250"
              rx="0"
              fill="url(#ccDeepPanel)"
              opacity="0.94"
            />

            <g filter="url(#ccShapeShadow)">
              <polygon
                points="108,24 190,24 278,276 191,276 108,94"
                fill="url(#ccLeftPanel)"
              />

              <polygon
                points="232,24 315,24 362,145 408,24 491,24 410,276 331,276"
                fill="url(#ccMiddlePanel)"
              />

              <polygon
                points="421,15 489,34 428,276 349,276"
                fill="url(#ccFrontPanel)"
              />
            </g>

            <path
              className="cc-cta__shine"
              d="M140 -40 L190 -40 L370 340 L320 340 Z"
              fill="rgba(255,255,255,0.22)"
              filter="url(#ccSoftGlow)"
            />

            <circle cx="58" cy="72" r="4" fill="rgba(255,255,255,0.55)" />
            <circle cx="454" cy="208" r="3" fill="#ffffff" opacity="0.92" />
            <circle cx="516" cy="100" r="2.7" fill="rgba(255,255,255,0.58)" />
          </g>
        </svg>

        <div className="cc-cta__square">
          <span />
        </div>

        <div className="cc-cta__circle">
          <span />
        </div>
      </div>
    </section>
  );
}
