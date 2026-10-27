"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  categories,
  countries,
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
  EstimateResult,
  IconName,
  Location,
  LocationId,
  ProjectSizeId,
  QualityId,
  Stage,
} from "@/types";
import { Icon } from "@/components/common/Icon";
import { LocationSelect } from "@/components/common/LocationSelect";

export interface EstimatorProps {
  stage: Stage;
  activeStep: number;
  description: string;
  categoryId: CategoryId;
  locationId: LocationId;
  sizeId: ProjectSizeId;
  qualityId: QualityId;
  estimate: EstimateResult | null;
  // The AI's "needs_info" verdict (description too vague to estimate):
  // what it understood + the questions it wants answered.
  needsInfo: { understood: string; questions: string[] } | null;
  descriptionReady: boolean;
  selectedCategory: Category;
  selectedLocation: Location;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (id: CategoryId) => void;
  onLocationChange: (id: LocationId) => void;
  onSizeChange: (id: ProjectSizeId) => void;
  onQualityChange: (id: QualityId) => void;
  onSubmitDescription: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitDetails: (event: FormEvent<HTMLFormElement>) => void;
  onBackToDescription: () => void;
  isPreparingDetails: boolean;
  isGenerating: boolean;
  estimateError: string;
  onRetryEstimate: () => void;
  onViewEstimate: () => void;
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
`;

export function Estimator({
  stage,
  activeStep,
  description,
  categoryId,
  locationId,
  sizeId,
  qualityId,
  estimate,
  needsInfo,
  descriptionReady,
  selectedCategory,
  selectedLocation,
  onDescriptionChange,
  onCategoryChange,
  onLocationChange,
  onSizeChange,
  onQualityChange,
  onSubmitDescription,
  onSubmitDetails,
  onBackToDescription,
  isPreparingDetails,
  isGenerating,
  estimateError,
  onRetryEstimate,
  onViewEstimate,
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
    // Fallback: never leave the card hidden if the observer does not fire.
    const fallback = window.setTimeout(() => setRevealed(true), 500);
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return () => window.clearTimeout(fallback);
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
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
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
        className="estimator-card relative overflow-hidden rounded-[26px] border border-white/90 bg-white p-3 shadow-[0_30px_90px_rgba(45,38,74,0.14)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6754e7] via-[#9a7cf1] to-[#5cc8aa]" />
        <div className="px-2 pb-2 pt-2 sm:px-3 sm:pb-2.5 sm:pt-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#26232e]">
                {stage === "describe"
                  ? needsInfo
                    ? "A few quick details"
                    : "Describe your project"
                  : stage === "details"
                    ? "Confirm your project details"
                    : isGenerating
                      ? "Preparing your estimate"
                      : "Your estimate is ready"}
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
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Describe", "Details", "Estimate"].map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      index === activeStep
                        ? "bg-[#6d58e8]"
                        : index < activeStep
                          ? "bg-[#c9c0f5]"
                          : "bg-[#e9e6ee]"
                    }`}
                  />
                  <p
                    className={`mt-1 truncate text-[10px] font-semibold sm:text-[11px] ${
                      index === activeStep
                        ? "text-[#5b4abe]"
                        : index < activeStep
                          ? "text-[#8277bd]"
                          : "text-[#a29ea8]"
                    }`}
                    aria-current={index === activeStep ? "step" : undefined}
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
            className="rounded-[20px] border border-[#e8e5ed] bg-[#fcfbfd] p-3.5"
          >
            <label
              htmlFor="project-description"
              className="text-sm font-bold text-[#302d37]"
            >
              What do you want to build or improve?
            </label>
            <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative h-full">
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) =>
                    onDescriptionChange(event.target.value.slice(0, 500))
                  }
                  placeholder="For example: I need an ecommerce website for a clothing brand with payments, customer accounts and around 500 products..."
                  className="h-full min-h-[128px] w-full resize-none rounded-2xl border border-[#dedbe4] bg-white px-4 py-3 pr-11 text-[14px] leading-6 text-[#33303a] outline-none transition placeholder:text-[#aaa6b0] focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10 sm:min-h-[140px] sm:text-[15px]"
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-medium text-[#aaa6b1]">
                  {description.length}/500
                </span>
              </div>

              <aside className="flex flex-col rounded-2xl border border-[#e8e5ed] bg-white p-3">
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
                <div className="mt-2 flex w-full flex-1 flex-col gap-1.5 overflow-y-auto min-h-0">
                  {visibleExamples.map((example) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => onDescriptionChange(example.description)}
                      title={example.description}
                      className={`group flex w-full items-center gap-2 whitespace-normal rounded-xl border px-2 py-1 text-left text-[11px] font-semibold leading-4 transition ${
                        description === example.description
                          ? "border-[#7460e4] bg-[#f4f1ff] text-[#5b4abe]"
                          : "border-[#e9e6ee] bg-[#fcfbfd] text-[#5f5b66] hover:border-[#c9c3e8] hover:bg-[#f8f7fc] hover:text-[#5b4abe]"
                      }`}
                    >
                      <span className="flex-1">{example.label}</span>
                      <Icon
                        name="arrow-right"
                        className="h-3 w-3 shrink-0 text-[#b3aeba] transition group-hover:translate-x-0.5 group-hover:text-[#6a55d7]"
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-4 text-[#9a95a0]">
                  Tap one to fill the box — then edit it in your own words.
                </p>
              </aside>
            </div>

            <div className="mt-2.5 max-w-md">
              <div>
                <label className="block">
                  <span className="sr-only">Project category</span>
                  <span className="relative block">
                    <Icon
                      name={selectedCategory.icon as IconName}
                      className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#6d58db]"
                    />
                    <select
                      value={categoryId}
                      onChange={(event) => {
                        const value = event.target.value;
                        onCategoryChange(value as CategoryId);
                      }}
                      className="h-11 w-full appearance-none rounded-xl border border-[#dedbe4] bg-white pl-10 pr-9 text-sm font-semibold text-[#403c47] outline-none transition focus:border-[#7661e8] focus:ring-4 focus:ring-[#7661e8]/10"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.shortName}
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
            </div>

            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              {/* <button
                type="button"
                onClick={onNewEstimate}
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#ece9ef] px-4 py-2.5 text-sm font-bold text-[#3a3641] transition hover:bg-[#ddd8e2]"
              >
                <Icon name="plus" className="h-4 w-4" />
                New estimate
              </button> */}
              <button
                type="submit"
                disabled={!descriptionReady || isPreparingDetails}
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6754e7] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(103,84,231,0.25)] transition hover:bg-[#5946d3] disabled:cursor-not-allowed disabled:bg-[#c8c3d6] disabled:shadow-none"
              >
                {isPreparingDetails ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
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
                    Preparing details…
                  </>
                ) : (
                  <>
                    Continue to details
                    <Icon
                      name="arrow-right"
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] font-medium text-[#95919c]">
              {descriptionReady
                ? "Review and confirm the project size, quality and location before pricing."
                : "Add a few details above to continue."}
            </p>
            {estimateError && (
              <div
                role="alert"
                className="mt-3 flex flex-col gap-3 rounded-xl border border-[#f0c9cf] bg-[#fff5f6] p-3 text-sm text-[#8a2432] sm:flex-row sm:items-center sm:justify-between"
              >
                <p>{estimateError}</p>
                <button
                  type="button"
                  onClick={onRetryEstimate}
                  disabled={isGenerating}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d9aab1] bg-white px-3 text-xs font-bold text-[#8a2432] transition hover:bg-[#ffebee] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon name="rotate" className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}
          </form>
        )}

        {stage === "details" && (
          <form
            onSubmit={onSubmitDetails}
            className="rounded-[24px] border border-[#e4dff8] bg-gradient-to-br from-[#faf8ff] via-white to-[#f2faf7] p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-[#ede9ff] px-3 py-1 text-[11px] font-bold text-[#6652cc]">
                Final step
              </span>
              <span className="min-w-0 truncate text-xs font-medium text-[#8a8691]">
                {selectedCategory.shortName} · {description.trim()}
              </span>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-bold text-[#302d37]">
                How large is your project?
              </legend>
              <p className="mt-1 text-xs leading-5 text-[#817d88]">
                Size sets the team and time needed. Pick the closest scope.
              </p>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                {projectSizes.map((size) => {
                  const selected = sizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSizeChange(size.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7460e4]/20 ${
                        selected
                          ? "border-[#7460e4] bg-[#f4f1ff] shadow-[0_0_0_3px_rgba(116,96,228,0.08)]"
                          : "border-[#e3e0e7] bg-white hover:border-[#c9c3e8] hover:bg-[#fbfaff]"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          selected
                            ? "bg-[#6d58df] text-white"
                            : "bg-[#f0eef3] text-[#77727f]"
                        }`}
                      >
                        <Icon
                          name={selected ? "check" : "layers"}
                          className="h-4 w-4"
                        />
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
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-bold text-[#302d37]">
                What level of quality do you need?
              </legend>
              <p className="mt-1 text-xs leading-5 text-[#817d88]">
                Quality adjusts the finish and polish of the work.
              </p>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                {qualityOptions.map((quality) => {
                  const selected = qualityId === quality.id;
                  return (
                    <button
                      key={quality.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onQualityChange(quality.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7460e4]/20 ${
                        selected
                          ? "border-[#7460e4] bg-[#f4f1ff] shadow-[0_0_0_3px_rgba(116,96,228,0.08)]"
                          : "border-[#e3e0e7] bg-white hover:border-[#c9c3e8] hover:bg-[#fbfaff]"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          selected
                            ? "bg-[#6d58df] text-white"
                            : "bg-[#f0eef3] text-[#77727f]"
                        }`}
                      >
                        <Icon
                          name={selected ? "check" : "sparkles"}
                          className="h-4 w-4"
                        />
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
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5 sm:max-w-xs">
              <span className="mb-1.5 block text-sm font-bold text-[#302d37]">
                Project location
              </span>
              <LocationSelect
                countries={countries}
                locations={locations}
                value={locationId}
                onChange={onLocationChange}
                size="form"
                ariaLabel="Project location"
              />
              <p className="mt-1 text-xs leading-5 text-[#817d88]">
                Currency and local rates follow this choice.
              </p>
            </div>

            {estimateError && (
              <p role="alert" className="mt-4 rounded-xl bg-[#fff5f6] p-3 text-sm text-[#8a2432]">
                {estimateError}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onBackToDescription}
                disabled={isGenerating}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ddd9e3] bg-white px-5 text-sm font-bold text-[#5c5864] transition hover:bg-[#f7f6f8] disabled:opacity-50"
              >
                <Icon name="chevron-left" className="h-4 w-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6754e7] px-5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(103,84,231,0.22)] transition hover:bg-[#5946d3] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGenerating ? "Generating estimate…" : "Generate my estimate"}
                <Icon name="arrow-right" className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* The AI could not estimate this yet (name / vague input): show what
            it understood and ask its questions instead of guessing a price. */}
        {stage === "describe" && needsInfo && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[#e4dff8] bg-[#faf9ff] p-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#f0edff] text-[#6754e7]">
              <Icon name="sparkles" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#604fc6]">
                A little more detail
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-[#37333f]">
                {needsInfo.understood}
              </p>
              <ul className="mt-1.5 space-y-1">
                {needsInfo.questions.map((question) => (
                  <li
                    key={question}
                    className="flex items-start gap-2 text-xs leading-5 text-[#797581]"
                  >
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#c3b9f0]" />
                    {question}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] leading-4 text-[#9a95a0]">
                Add those details to your description, then submit it again.
              </p>
            </div>
          </div>
        )}

        {stage === "complete" && isGenerating && !estimate && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-[20px] border border-[#dcd6fa] bg-white p-8 text-center"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f0edff] text-[#6754e7]">
              <Icon name="rotate" className="h-6 w-6 animate-spin" />
            </span>
            <p className="mt-4 text-base font-bold text-[#302d37]">
              Generating your estimate
            </p>
            <p className="mt-1 text-sm text-[#77727e]">
              Your confirmed details are being priced securely.
            </p>
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

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2 pb-1 pt-3 text-[10px] font-semibold text-[#918c98]">
          <span className="flex items-center gap-1.5">
            <Icon name="check" className="h-3.5 w-3.5" />
            No sign-up needed
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
