"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  categories,
  exampleProjects,
  locations,
  projectSizes,
  qualityOptions,
} from "@/constants";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDurationRange,
  scrollToSection,
} from "@/lib";
import type {
  Category,
  CategoryId,
  CustomProjectType,
  EstimateResult,
  IconName,
  Location,
  LocationId,
  ProjectSizeId,
  QualityId,
  Stage,
} from "@/types";
import { Icon } from "@/components/common/Icon";

export interface EstimatorProps {
  stage: Stage;
  activeStep: number;
  description: string;
  categoryId: CategoryId;
  locationId: LocationId;
  sizeId: ProjectSizeId;
  qualityId: QualityId;
  questionStep: number;
  estimate: EstimateResult | null;
  descriptionReady: boolean;
  selectedCategory: Category;
  selectedLocation: Location;
  onDescriptionChange: (value: string) => void;
  autoCategoryHint?: string | null;
  aiCategoryLabel?: string | null;
  onCategoryChange: (id: CategoryId) => void;
  onLocationChange: (id: LocationId) => void;
  onSizeChange: (id: ProjectSizeId) => void;
  onQualityChange: (id: QualityId) => void;
  onSubmitDescription: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onContinueQuestions: () => void;
  isGenerating: boolean;
  onViewEstimate: () => void;
  onNewEstimate: () => void;
  customDescription: string;
  onCustomDescriptionChange: (value: string) => void;
  onAnalyzeCustom: () => void;
  analyzing: boolean;
  customProjectTypes: CustomProjectType[];
  selectedCustom: CustomProjectType | null;
  onSelectCustomType: (name: string) => void;
  onRemoveCustomType: (name: string) => void;
  customSummary: string;
}

/* Entrance animation: desktop slides in from the right, mobile slides up from the bottom.
   The negative delay makes the motion already "in progress" at first paint (no pause). */
const slideInCss = `
  :root {
    --estimator-slide-distance: 160px;
    --estimator-slide-duration: 1.6s;
    --estimator-slide-delay: -0.25s;
  }

  @keyframes estimatorSlideInRight {
    from {
      opacity: 0;
      transform: translate3d(var(--estimator-slide-distance), 0, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes estimatorSlideInUp {
    from {
      opacity: 0;
      transform: translate3d(0, var(--estimator-slide-distance), 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .estimator-card {
      animation: estimatorSlideInRight var(--estimator-slide-duration)
        cubic-bezier(0.22, 1, 0.36, 1) var(--estimator-slide-delay) both;
      will-change: transform, opacity;
    }
  }

  /* Mobile: stay hidden until scrolled into view, then slide up from the bottom */
  @media (max-width: 767px) {
    :root {
      --estimator-slide-distance: 90px;
      --estimator-slide-duration: 1.2s;
    }
    @media (prefers-reduced-motion: no-preference) {
      .estimator-card {
        animation: none;
      }
      .estimator-card[data-revealed="false"] {
        opacity: 0;
        transform: translate3d(0, var(--estimator-slide-distance), 0);
      }
      .estimator-card[data-revealed="true"] {
        animation: estimatorSlideInUp var(--estimator-slide-duration)
          cubic-bezier(0.22, 1, 0.36, 1) 0s both;
      }
    }
  }

  html,
  body {
    overflow-x: clip;
  }
`;

export function Estimator({
  stage,
  activeStep,
  description,
  categoryId,
  locationId,
  sizeId,
  qualityId,
  questionStep,
  estimate,
  descriptionReady,
  selectedCategory,
  selectedLocation,
  onDescriptionChange,
  autoCategoryHint,
  aiCategoryLabel,
  onCategoryChange,
  onLocationChange,
  onSizeChange,
  onQualityChange,
  onSubmitDescription,
  onBack,
  onContinueQuestions,
  isGenerating,
  onViewEstimate,
  onNewEstimate,
  customDescription,
  onCustomDescriptionChange,
  onAnalyzeCustom,
  analyzing,
  customProjectTypes,
  selectedCustom,
  onSelectCustomType,
  onRemoveCustomType,
  customSummary,
}: EstimatorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  // Random example pool: starts deterministic (SSR-safe), shuffles after mount.
  const [exampleOffset, setExampleOffset] = useState(0);
  const visibleExamples = Array.from(
    { length: 4 },
    (_, i) => exampleProjects[(exampleOffset + i) % exampleProjects.length],
  );
  const shuffleExamples = () =>
    setExampleOffset((current) => {
      // Pick a different random position so the list visibly changes.
      const next =
        1 + Math.floor(Math.random() * (exampleProjects.length - 1));
      return (current + next) % exampleProjects.length;
    });

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Shuffle the example suggestions once on mount (client-only, so the
  // server-rendered HTML matches the first render and hydration stays clean).
  useEffect(() => {
    setExampleOffset(Math.floor(Math.random() * exampleProjects.length));
  }, []);

  return (
    <>
      <style>{slideInCss}</style>
      <div
        ref={cardRef}
        data-revealed={revealed}
        className="estimator-card relative overflow-hidden rounded-[26px] border border-white/90 bg-white p-3 shadow-[0_30px_90px_rgba(45,38,74,0.14)] sm:p-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6754e7] via-[#9a7cf1] to-[#5cc8aa]" />
        <div className="px-2 pb-3 pt-2 sm:px-3 sm:pb-4 sm:pt-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#26232e]">
                {stage === "describe" && "Describe your project"}
                {stage === "questions" && "A few quick details"}
                {stage === "complete" && "Your estimate is ready"}
              </p>
              <p className="mt-0.5 text-xs text-[#85818c]">
                Free · No account needed
              </p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-[#f0edff] px-3 py-1.5 text-[11px] font-bold text-[#604fc6] sm:flex">
              <Icon name="zap" className="h-3.5 w-3.5" />
              Live estimate
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Describe", "Details", "Estimate"].map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      index <= activeStep ? "bg-[#6d58e8]" : "bg-[#e9e6ee]"
                    }`}
                  />
                  <p
                    className={`mt-1.5 truncate text-[10px] font-semibold sm:text-[11px] ${
                      index <= activeStep ? "text-[#5b4abe]" : "text-[#a29ea8]"
                    }`}
                  >
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {stage === "describe" && (
          <form
            onSubmit={onSubmitDescription}
            className="rounded-[20px] border border-[#e8e5ed] bg-[#fcfbfd] p-4 sm:p-5"
          >
            <label
              htmlFor="project-description"
              className="text-sm font-bold text-[#302d37]"
            >
              What do you want to build or improve?
            </label>
            <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_210px]">
              <div className="relative">
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) =>
                    onDescriptionChange(event.target.value.slice(0, 500))
                  }
                  placeholder="For example: I need an ecommerce website for a clothing brand with payments, customer accounts and around 500 products..."
                  className="min-h-[132px] w-full resize-none rounded-2xl border border-[#dedbe4] bg-white px-4 py-3.5 pr-11 text-[14px] leading-6 text-[#33303a] outline-none transition placeholder:text-[#aaa6b0] focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10 sm:min-h-[142px] sm:text-[15px] xl:min-h-[196px]"
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-medium text-[#aaa6b1]">
                  {description.length}/500
                </span>
              </div>

              <aside className="rounded-2xl border border-[#e8e5ed] bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a7582]">
                    <Icon name="sparkles" className="h-3.5 w-3.5 text-[#6954df]" />
                    Try an example
                  </p>
                  <button
                    type="button"
                    onClick={shuffleExamples}
                    aria-label="Show different examples"
                    title="Show different examples"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[#8a8590] transition hover:bg-[#f3f1f7] hover:text-[#6754e7]"
                  >
                    <Icon name="rotate" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                  {visibleExamples.map((example) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => onDescriptionChange(example.description)}
                      title={example.description}
                      className={`group flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] font-semibold leading-4 transition ${
                        description === example.description
                          ? "border-[#7460e4] bg-[#f4f1ff] text-[#5b4abe]"
                          : "border-[#e9e6ee] bg-[#fcfbfd] text-[#5f5b66] hover:border-[#c9c3e8] hover:bg-[#f8f7fc] hover:text-[#5b4abe]"
                      }`}
                    >
                      <span className="min-w-0 truncate">{example.label}</span>
                      <Icon
                        name="arrow-right"
                        className="h-3 w-3 shrink-0 text-[#b3aeba] transition group-hover:translate-x-0.5 group-hover:text-[#6a55d7]"
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 text-[10px] leading-4 text-[#9a95a0]">
                  Tap one to fill the box — then edit it in your own words.
                </p>
              </aside>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block">
                  <span className="sr-only">Project category</span>
                  <span className="relative block">
                    <Icon
                      name={selectedCategory.icon as IconName}
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#6d58db]"
                    />
                    <select
                      value={
                        selectedCustom
                          ? `custom:${selectedCustom.name}`
                          : aiCategoryLabel
                            ? `ai:${aiCategoryLabel}`
                            : categoryId
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value.startsWith("custom:")) {
                          onSelectCustomType(value.slice("custom:".length));
                        } else if (value.startsWith("ai:")) {
                          // AI-detected category — no preset categoryId change needed
                          // The AI's pricing and labels are used directly
                        } else {
                          onCategoryChange(value as CategoryId);
                        }
                      }}
                      className="h-11 w-full appearance-none rounded-xl border border-[#dedbe4] bg-white pl-10 pr-9 text-sm font-semibold text-[#403c47] outline-none transition focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.shortName}
                        </option>
                      ))}
                      {aiCategoryLabel && (
                        <option value={`ai:${aiCategoryLabel}`}>
                          {aiCategoryLabel}
                        </option>
                      )}
                      {customProjectTypes.length > 0 && (
                        <optgroup label="Your projects">
                          {customProjectTypes.map((custom) => (
                            <option
                              key={custom.name}
                              value={`custom:${custom.name}`}
                            >
                              {custom.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <Icon
                      name="chevron-down"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77727f]"
                    />
                  </span>
                </label>
                {autoCategoryHint && !selectedCustom && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#6d58db]">
                    <Icon name="sparkles" className="h-3 w-3" />
                    Auto-detected: {autoCategoryHint}
                  </p>
                )}
                {selectedCustom && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#f0edff] px-2.5 py-1.5">
                    <span className="truncate text-[11px] font-semibold text-[#604fc6]">
                      {selectedCustom.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveCustomType(selectedCustom.name)}
                      aria-label={`Remove ${selectedCustom.name}`}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#8a2432] transition hover:bg-[#f6c9cf]"
                    >
                      <Icon name="close" className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {/* <div className="mt-3 rounded-xl border border-[#e3e0e7] bg-white p-3">
                <label
                  htmlFor="custom-project-description"
                  className="text-xs font-bold text-[#5c5864]"
                >
                  Describe your own project
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="custom-project-description"
                    value={customDescription}
                    onChange={(event) =>
                      onCustomDescriptionChange(event.target.value.slice(0, 200))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAnalyzeCustom();
                      }
                    }}
                    placeholder="tyre shop with online booking and stock tracking"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-[#dedbe4] bg-white px-3 text-sm text-[#33303a] outline-none transition placeholder:text-[#aaa6b0] focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10"
                  />
                  <button
                    type="button"
                    onClick={onAnalyzeCustom}
                    disabled={!customDescription.trim() || analyzing}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#6754e7] px-3 text-xs font-bold text-white transition hover:bg-[#5946d3] disabled:cursor-not-allowed disabled:bg-[#c8c3d6]"
                  >
                    {analyzing ? (
                      <Icon name="rotate" className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon name="sparkles" className="h-3.5 w-3.5" />
                    )}
                    {analyzing ? "Analyzing" : "Analyze"}
                  </button>
                </div>
                {customSummary && (
                  <p className="mt-2 text-[11px] leading-5 text-[#797581]">
                    {customSummary}
                  </p>
                )}
              </div>
 */}
              </div>
              <label className="block">
                <span className="sr-only">Project location</span>
                <span className="relative block">
                  <Icon
                    name="globe"
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#6d58db]"
                  />
                  <select
                    value={locationId}
                    onChange={(event) =>
                      onLocationChange(event.target.value as LocationId)
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-[#dedbe4] bg-white pl-10 pr-9 text-sm font-semibold text-[#403c47] outline-none transition focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10"
                  >
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.city}, {location.country}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevron-down"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77727f]"
                  />
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onNewEstimate}
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#ece9ef] px-4 py-3 text-sm font-bold text-[#3a3641] transition hover:bg-[#ddd8e2]"
              >
                <Icon name="plus" className="h-4 w-4" />
                New estimate
              </button>
              <button
                type="submit"
                disabled={!descriptionReady}
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6754e7] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(103,84,231,0.25)] transition hover:bg-[#5946d3] disabled:cursor-not-allowed disabled:bg-[#c8c3d6] disabled:shadow-none"
              >
                Analyze my project
                <Icon
                  name="arrow-right"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] font-medium text-[#95919c]">
              {descriptionReady
                ? "Your description stays private and is never shared."
                : "Add a few details above to continue."}
            </p>
          </form>
        )}

        {stage === "questions" && (
          <div className="rounded-[20px] border border-[#e8e5ed] bg-[#fcfbfd] p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#ede9ff] px-3 py-1 text-[11px] font-bold text-[#6652cc]">
                Quick question {questionStep + 1} of 2
              </span>
              <span className="text-xs font-medium text-[#8a8691]">
                {selectedCustom?.name ?? selectedCategory.shortName} ·{" "}
                {selectedLocation.city}
              </span>
            </div>

            {questionStep === 0 ? (
              <div className="mt-5">
                <h2 className="text-xl font-bold tracking-[-0.035em] text-[#24212b]">
                  How large is your project?
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[#797581]">
                  This helps us estimate the team, time and overall investment.
                </p>
                <div className="mt-5 grid gap-2.5">
                  {projectSizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => onSizeChange(size.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition sm:p-4 ${
                        sizeId === size.id
                          ? "border-[#7460e4] bg-[#f4f1ff] shadow-[0_0_0_3px_rgba(116,96,228,0.08)]"
                          : "border-[#e3e0e7] bg-white hover:border-[#c9c3e8] hover:bg-[#fbfaff]"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          sizeId === size.id
                            ? "bg-[#6d58df] text-white"
                            : "bg-[#f0eef3] text-[#77727f]"
                        }`}
                      >
                        {sizeId === size.id ? (
                          <Icon name="check" className="h-4 w-4" />
                        ) : (
                          <Icon name="layers" className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#37333f]">
                          {size.name}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#817d88]">
                          {size.example}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <h2 className="text-xl font-bold tracking-[-0.035em] text-[#24212b]">
                  What level of quality do you need?
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[#797581]">
                  Pick the option that feels closest to your expectations.
                </p>
                <div className="mt-5 grid gap-2.5">
                  {qualityOptions.map((quality) => (
                    <button
                      key={quality.id}
                      type="button"
                      onClick={() => onQualityChange(quality.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition sm:p-4 ${
                        qualityId === quality.id
                          ? "border-[#7460e4] bg-[#f4f1ff] shadow-[0_0_0_3px_rgba(116,96,228,0.08)]"
                          : "border-[#e3e0e7] bg-white hover:border-[#c9c3e8] hover:bg-[#fbfaff]"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          qualityId === quality.id
                            ? "bg-[#6d58df] text-white"
                            : "bg-[#f0eef3] text-[#77727f]"
                        }`}
                      >
                        <Icon name="sparkles" className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#37333f]">
                          {quality.name}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#817d88]">
                          {quality.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-[#ddd9e3] bg-white px-4 py-3 text-sm font-bold text-[#5c5864] transition hover:bg-[#f7f6f8]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onContinueQuestions}
                disabled={isGenerating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6754e7] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(103,84,231,0.22)] transition hover:bg-[#5946d3] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    {questionStep === 0 ? "Continue" : "Generate my estimate"}
                    <Icon name="arrow-right" className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {stage === "complete" && estimate && (
          <div className="rounded-[20px] border border-[#dcd6fa] bg-gradient-to-br from-[#f7f4ff] via-white to-[#effbf7] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e5f6ed] text-[#198454] shadow-sm">
                <Icon name="check" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1f8a58]">
                  Estimate complete
                </p>
                <h2 className="mt-1.5 text-2xl font-bold tracking-[-0.04em] text-[#25212c]">
                  {formatCurrency(estimate.total, estimate.location)}
                </h2>
                <p className="mt-1 text-sm text-[#77727f]">
                  Typical investment for{" "}
                  {(estimate.projectTypeLabel ?? estimate.category.shortName)
                    .charAt(0)
                    .toLowerCase() +
                    (estimate.projectTypeLabel ?? estimate.category.shortName).slice(
                      1,
                    )}{" "}
                  in {estimate.location.city}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 divide-x divide-[#e3dfec] rounded-2xl border border-[#e4e0eb] bg-white/80 py-3 text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98939e]">
                  Confidence
                </p>
                <p className="mt-1 text-sm font-bold text-[#37333f]">
                  {estimate.confidence}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98939e]">
                  Timeline
                </p>
                <p className="mt-1 text-sm font-bold text-[#37333f]">
                  {formatDurationRange(
                    estimate.durationMin,
                    estimate.durationMax,
                    estimate.durationUnit,
                    true,
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98939e]">
                  Range
                </p>
                <p className="mt-1 text-sm font-bold text-[#37333f]">
                  {formatCompactCurrency(estimate.low, estimate.location)}
                  –
                  {formatCompactCurrency(estimate.high, estimate.location)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onViewEstimate}
              className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#211e29] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#34303d]"
            >
              View detailed estimate
              <Icon
                name="arrow-right"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2 pb-1 pt-4 text-[10px] font-semibold text-[#918c98]">
          <span className="flex items-center gap-1.5">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Private by default
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="calculator" className="h-3.5 w-3.5" />
            Transparent pricing
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="clock" className="h-3.5 w-3.5" />
            Takes under a minute
          </span>
        </div>
      </div>
    </>
  );
}
