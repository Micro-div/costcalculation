import type { IconName } from "@/types";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { BannerVideo } from "./BannerVideo";

// Both banner videos share this poster so the section always shows a frame
// immediately, even before the video itself is requested.
const BANNER_POSTER = "/cost.png";

// ---------------------------------------------------------------
// BANNER VIDEO (one per device, played once when scrolled into view)
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// WATCH BANNER (image slider + text + animated wave strip)
// Images go in public/ (web.png, uiux.png, ecommerce.png, cost.png).
// ---------------------------------------------------------------
const watchImages = [
  { src: "/web.png", alt: "Web development" },
  { src: "/uiux.png", alt: "UI/UX design" },
  { src: "/ecommerce.png", alt: "E-commerce" },
  { src: "/cost.png", alt: "Cost estimation" },
];

const watchText = {
  badge: "PROJECT SHOWCASE",
  title: "Plan Your Project With Confidence",
  text: "Get instant, localized project cost estimates with clear scope and professional quotations. From web apps to AI solutions, know the investment before you commit.",
  button: "Get Estimate",
  buttonHref: "#estimator",
  strip: "Know your project cost before you build.",
};

const watchCss = `
.wb { --wb-h: 225px; --wb-gap: 10px; --wb-speed: 16s; --wb-cycle: 5s; }
.wb * { box-sizing: border-box; }

/* banner row */
.wb-row { max-width: 1200px; margin: 0 auto; padding: 56px 20px 40px;
          display: flex; align-items: center; gap: 33px; }
.wb-slider { flex: 0 0 616px; max-width: 100%; height: calc(var(--wb-h) + 2px);
             overflow: hidden; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; }
.wb-track { display: flex; width: max-content; gap: var(--wb-gap);
            animation: wb-scroll var(--wb-speed) linear infinite; }
.wb-slider:hover .wb-track { animation-play-state: paused; }
.wb-track img { height: var(--wb-h); width: 156px; object-fit: cover; border-radius: 14px;
                flex: none; display: block; }
@keyframes wb-scroll { to { transform: translateX(calc(-50% - var(--wb-gap) / 2)); } }

.wb-badge { display: inline-block; background: #000; color: #fff; height: 26px; line-height: 26px;
            padding: 0 14px; border-radius: 13px; font-size: 10px; font-weight: 800;
            letter-spacing: 2.2px; text-transform: uppercase; }
.wb-title { margin: 14px 0 12px; font-size: 29px; line-height: 1.2; font-weight: 700;
            letter-spacing: .4px; color: #6954df; }
.wb-text { margin: 0 0 22px; max-width: 385px; font-size: 13.5px; line-height: 1.7; color: #444; }
.wb-btn { display: inline-flex; align-items: center; gap: 8px; background: #211e29; color: #fff; text-decoration: none;
          border-radius: 12px; padding: 14px 20px; font-size: 14px; font-weight: 700;
          transition: background-color 0.2s; }
.wb-btn:hover { background: #35313e; }

/* wave section: full width */
.wb-outlet { position: relative; }
.wb-body { position: relative; background: #000; height: 40px; z-index: 2; }
.wb-wave { position: relative; display: block; width: 100%; overflow: hidden;
           height: clamp(42px, 5.6vw, 72px); }
.wb-wave.top { margin-bottom: -1px; }
.wb-wave.bottom { margin-top: -1px; transform: scaleY(-1); }

/* each layer is its own element, moved on the GPU */
@keyframes wb-slide { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
.wb-layer { position: absolute; left: 0; top: 0; width: 200%; height: 100%; display: block;
            animation: wb-slide linear infinite; will-change: transform; backface-visibility: hidden; }
.wb-layer.wb-rev { animation-direction: reverse; }
.wb-layer path { shape-rendering: geometricPrecision; }
/* Speeds matched to the footer waves: 10s / 8s / 6s */
.wb-l1 { animation-duration: 10s; fill: rgba(0,0,0,.18); }
.wb-l2 { animation-duration: 8s; fill: rgba(0,0,0,.27); }
.wb-l3 { animation-duration: 6s; fill: #000; }
.wb-wave.bottom .wb-l1 { animation-delay: -9s; }
.wb-wave.bottom .wb-l2 { animation-delay: -4s; }

.wb-strip { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%);
            height: 34px; line-height: 34px; text-align: center; color: #fff;
            font-weight: 600; font-size: 14.5px; white-space: nowrap;
            background: #262626; animation: wb-stripFade var(--wb-cycle) ease-in-out infinite; }
.wb-strip::before { content: ""; position: absolute; left: 0; right: 0; bottom: 100%; height: 10px;
                    background: linear-gradient(to top, rgba(110,110,110,.6), transparent);
                    animation: wb-shadowFade var(--wb-cycle) ease-in-out infinite; }
@keyframes wb-stripFade { 0%,20% { background:#262626; } 40%,72% { background:#050505; } 92%,100% { background:#262626; } }
@keyframes wb-shadowFade { 0%,20% { opacity:1; } 40%,72% { opacity:0; } 92%,100% { opacity:1; } }

@media (max-width: 860px) {
  .wb-row { flex-direction: column; align-items: flex-start; padding-top: 36px; }
  .wb-slider { flex-basis: auto; width: 100%; }
  .wb-title { font-size: 24px; }
}
@media (max-width: 640px) {
  .wb-body { height: 56px; }
  .wb-strip { white-space: normal; height: auto; min-height: 34px; line-height: 1.35;
              padding: 6px 14px; font-size: 11.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .wb-track, .wb-layer, .wb-strip, .wb-strip::before { animation: none; }
}
`;

// Smooth wave shape: one period = 120 units, drawn twice (240) so it loops seamlessly
const wavePath = (m: number, n: number) =>
  `M0,${m} C30,${m} 30,${n} 60,${n} C90,${n} 90,${m} 120,${m} C150,${m} 150,${n} 180,${n} C210,${n} 210,${m} 240,${m} V80 H0 Z`;

function WaveLayers() {
  return (
    <>
      <svg className="wb-layer wb-l1 wb-rev" viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath(4, 36)} />
      </svg>
      <svg className="wb-layer wb-l2 wb-rev" viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath(12, 44)} />
      </svg>
      <svg className="wb-layer wb-l3" viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath(12, 54)} />
      </svg>
    </>
  );
}

function WatchBanner() {
  return (
    <div className="wb">
      <style>{watchCss}</style>

      <div className="wb-row">
        <div className="wb-slider">
          <div className="wb-track">
            {/* images are listed twice so the scroll loops with no jump */}
            {[...watchImages, ...watchImages].map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.src}
                alt={i < watchImages.length ? img.alt : ""}
                aria-hidden={i >= watchImages.length}
                loading="lazy"
              />
            ))}
          </div>
        </div>

        <div>
          <span className="wb-badge">{watchText.badge}</span>
          <h2 className="wb-title">{watchText.title}</h2>
          <p className="wb-text">{watchText.text}</p>
          <a className="wb-btn" href={watchText.buttonHref}>
            {watchText.button}
          </a>
        </div>
      </div>

      <div className="wb-outlet">
        <div className="wb-wave top">
          <WaveLayers />
        </div>

        <div className="wb-body">
          <div className="wb-strip">
            <Reveal>
              <span>{watchText.strip}</span>
            </Reveal>
          </div>
        </div>

        <div className="wb-wave bottom">
          <WaveLayers />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// HOW IT WORKS SECTION
// ---------------------------------------------------------------
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-[#e8e5ed] bg-white"
    >
      {/* One banner only: mobile (<640px) or desktop. */}
      <BannerVideo
        mobileSrc="/baner.mp4"
        desktopSrc="/banner.mp4"
        poster={BANNER_POSTER}
        ariaLabel="CostCalc â€” Know the cost before you build! Get your project price in minutes."
      />

      <div className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-7 sm:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b56d8]">
              How it works
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-3">
            <h2 className="text-3xl font-bold tracking-[-0.045em] text-[#201d27] sm:text-4xl">
              From an idea to a clear estimate in three steps.
            </h2>
          </Reveal>
          <Reveal delay={240} className="mt-4">
            <p className="text-sm leading-6 text-[#77727e] sm:text-base">
              No spreadsheets, phone calls or confusing price lists. Just a more
              informed way to plan.
            </p>
          </Reveal>
        </div>
        <div className="relative mt-14 grid gap-5 md:grid-cols-3">
          <div className="process-line absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed border-[#d9d3ee] md:block" />
          {[
            {
              icon: "sparkles" as IconName,
              number: "01",
              title: "Describe your project",
              text: "Write what you need in everyday language, or choose one of our service categories.",
            },
            {
              icon: "users" as IconName,
              number: "02",
              title: "Answer a few questions",
              text: "Confirm the project size, quality and location so the estimate can be more accurate.",
            },
            {
              icon: "file-text" as IconName,
              number: "03",
              title: "Get costs and a quote",
              text: "Review the full breakdown, scope and timeline, then create a client-ready quotation.",
            },
          ].map((step, i) => (
            <Reveal key={step.number} delay={i * 120}>
              <div className="relative h-full rounded-[22px] border border-[#e8e5ed] bg-[#fbfafc] p-6 text-center">
                <span className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl border-4 border-white bg-[#eeeaff] text-[#6651d3] shadow-[0_8px_20px_rgba(83,67,169,0.12)]">
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>
                <p className="mt-5 text-[11px] font-bold tracking-[0.16em] text-[#918b9b]">
                  STEP {step.number}
                </p>
                <h3 className="mt-2 text-lg font-bold tracking-[-0.03em] text-[#302c37]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#7b7682]">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Watch banner, full width, under the steps */}
      <div className="mt-16 sm:mt-20">
        <WatchBanner />
      </div>
    </section>
  );
}


