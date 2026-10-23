import { categories } from "@/constants";
import { Reveal } from "@/components/common/Reveal";
import { ServiceCard } from "./ServiceCard";

export function ServicesSection() {
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
              <ServiceCard category={category} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
