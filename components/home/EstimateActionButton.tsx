"use client";

import { Icon } from "@/components/common/Icon";

interface EstimateActionButtonProps {
  label: string;
  className: string;
}

/**
 * Focuses/scolls to the estimator. A DOM event keeps the parent section a
 * server component (no callback needs to cross the server/client boundary).
 */
export function EstimateActionButton({
  label,
  className,
}: EstimateActionButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event("costcalc:focus-estimator"))
      }
      className={className}
    >
      {label}
      <Icon
        name="arrow-right"
        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}
