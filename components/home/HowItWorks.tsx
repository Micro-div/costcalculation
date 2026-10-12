"use client";

import { useEffect, useRef } from "react";
import type { IconName } from "@/types";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";

export function HowItWorks() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play the banner video once, the first time it is scrolled into view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Respect "reduce motion": keep showing the poster image only
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          observer.disconnect(); // never triggers again on later scrolls
        }
      },
      { threshold: 0.4 } // starts when 40% of the banner is visible
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-[#e8e5ed] bg-white pb-20 sm:pb-28"
    >
      {/* Banner video: full width, 1980x500, plays once when scrolled into view */}
      <video
        ref={videoRef}
        src="/banner.mp4"
        poster="/banner.png"
        muted
        playsInline
        preload="auto"
        aria-label="CostCalc — Know the cost before you build! Get your project price in minutes."
        className="block aspect-[1980/500] h-auto w-full object-cover"
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
    </section>
  );
}