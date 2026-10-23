"use client";

import { Icon } from "@/components/common/Icon";
import type { Category } from "@/types";

/**
 * A service card that asks the estimator to prefill this category. Uses a DOM
 * event so the surrounding section can stay a server component.
 */
export function ServiceCard({ category }: { category: Category }) {
  const choose = () => {
    window.dispatchEvent(
      new CustomEvent("costcalc:choose-category", {
        detail: category.id,
      }),
    );
  };

  return (
    <button
      type="button"
      onClick={choose}
      className="group h-full w-full rounded-[20px] border border-[#e7e4eb] bg-white p-5 text-left shadow-[0_7px_25px_rgba(34,29,49,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#cec7ec] hover:shadow-[0_16px_36px_rgba(46,38,77,0.09)]"
    >
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f0edff] text-[#6551d3] transition group-hover:bg-[#6b56df] group-hover:text-white">
          <Icon name={category.icon} />
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
  );
}
