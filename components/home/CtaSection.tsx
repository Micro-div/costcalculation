"use client";

import { scrollToSection } from "@/lib";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";

interface CtaSectionProps {
  onEstimateClick: () => void;
}

export function CtaSection({ onEstimateClick }: CtaSectionProps) {
  return (
    <section className="px-5 pb-12 sm:px-7 sm:pb-20">
      <Reveal>
        <div className="cta-surface relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-[#211e29] px-5 py-10 text-center text-white shadow-[0_24px_60px_rgba(31,27,40,0.18)] sm:px-10 sm:py-16">
        <div className="cta-orb cta-orb-one" />
        <div className="cta-orb cta-orb-two" />
        <div className="relative mx-auto max-w-2xl">
          <Reveal>
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#c4b7ff] ring-1 ring-white/10">
              <Icon name="sparkles" />
            </span>
          </Reveal>
          <Reveal delay={120} className="mt-6">
            <h2 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
              Your next project starts with a number.
            </h2>
          </Reveal>
          <Reveal delay={240} className="mt-4">
            <p className="mx-auto max-w-xl text-sm leading-6 text-[#bcb6c5] sm:text-base">
              Get a clear localized estimate and see what it takes to bring your
              project to life.
            </p>
          </Reveal>
          <Reveal delay={360} className="mt-7">
            <button
              type="button"
              onClick={onEstimateClick}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#292430] shadow-lg transition hover:bg-[#f3f0ff]"
            >
              Start my free estimate
              <Icon
                name="arrow-right"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </Reveal>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
