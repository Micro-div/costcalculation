"use client";

import { categories } from "@/constants";
import type { CategoryId, IconName } from "@/types";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";

interface ServicesSectionProps {
  onChooseCategory: (id: CategoryId) => void;
}

export function ServicesSection({ onChooseCategory }: ServicesSectionProps) {
  return (
    <section
      id="services"
      className="scroll-mt-20 bg-[#f8f8fb] py-12 sm:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b56d8]">
                Popular categories
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-3">
              <h2 className="max-w-xl text-3xl font-bold tracking-[-0.045em] text-[#201d27] sm:text-4xl">
                Start with the project you have in mind.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={240}>
            <p className="max-w-md text-sm leading-6 text-[#77727e]">
              Choose a category to prefill your project. You can change it at any
              time.
            </p>
          </Reveal>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, i) => (
            <Reveal key={category.id} delay={i * 120}>
              <button
              type="button"
              onClick={() => onChooseCategory(category.id)}
              className="group h-full w-full rounded-[20px] border border-[#e7e4eb] bg-white p-5 text-left shadow-[0_7px_25px_rgba(34,29,49,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#cec7ec] hover:shadow-[0_16px_36px_rgba(46,38,77,0.09)]"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f0edff] text-[#6551d3] transition group-hover:bg-[#6b56df] group-hover:text-white">
                  <Icon name={category.icon as IconName} />
                </span>
                <Icon
                  name="arrow-right"
                  className="h-4 w-4 text-[#b3aeba] transition group-hover:translate-x-0.5 group-hover:text-[#6a55d7]"
                />
              </div>
              <h3 className="mt-5 text-base font-bold tracking-[-0.025em] text-[#302c37]">
                {category.shortName}
              </h3>
              <p className="mt-2 min-h-10 text-xs leading-5 text-[#807b87]">
                {category.description}
              </p>
              <p className="mt-4 text-xs font-bold text-[#6a55d6]">
                Typical range {category.range}
              </p>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
