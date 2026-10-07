import { Icon } from "@/components/common/Icon";
import { Estimator, type EstimatorProps } from "./Estimator";

const title = "Know what your project should cost.";

// Two colors: words 1, 3, 5 are BLUE and words 2, 4, 6 are GREY.
const GREY = "#b5b3bb";
const BLUE = "#6954df"; // same blue as your sparkles icon
const wordColor = (i: number) => (i % 2 === 0 ? BLUE : GREY);

const words = title.split(" ");
// index of each word's first letter, so the delay keeps counting across words
const offsets = words.map((_, i) => words.slice(0, i).join("").length);

const heroCss = `
@keyframes heroLetterIn {
  from { opacity: 0; transform: translateX(-10px); }
}
.hero-word { display: inline-block; white-space: nowrap; }
.hero-letter {
  display: inline-block;
  animation: heroLetterIn 0.25s ease-out both;
}
@media (prefers-reduced-motion: reduce) {
  .hero-letter { animation: none; }
}
`;

export function Hero(props: EstimatorProps) {
  return (
    <section className="hero-surface relative">
      <style>{heroCss}</style>
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="relative mx-auto grid min-w-0 max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-12 px-5 pb-12 pt-14 sm:px-7 sm:pb-20 sm:pt-20 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
        <div className="min-w-0 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ded9f4] bg-white/80 px-3 py-1.5 text-xs font-bold text-[#5d50a3] shadow-sm backdrop-blur">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ece8ff]">
              <Icon name="sparkles" className="h-3.5 w-3.5 text-[#6954df]" />
            </span>
            AI-powered project costing
          </div>

          <h1
            aria-label={title}
            className="mt-6 text-[2.75rem] font-bold leading-[1.04] tracking-[-0.055em] text-[#19171f] sm:text-[3.6rem] lg:text-[4.15rem]"
          >
            {words.map((word, w) => (
              <span key={w} className="inline">
                <span
                  aria-hidden="true"
                  className="hero-word"
                  style={{ color: wordColor(w) }}
                >
                  {word.split("").map((char, c) => (
                    <span
                      key={c}
                      className="hero-letter"
                      style={{ animationDelay: `${(offsets[w] + c) * 90}ms` }}
                    
                    >
                      {char}
                    </span>
                  ))}
                </span>
                {w < words.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-[#6b6773] sm:text-lg sm:leading-8">
            Describe your project and get a localized cost range, clear scope
            and professional quotation in minutes not days.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-[#5f5b66]">
            {["No credit card", "Instant estimate", "Localized pricing"].map(
              (label) => (
                <span key={label} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e5f6ed] text-[#198454]">
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  {label}
                </span>
              ),
            )}
          </div>

          <div className="mt-10 flex items-center gap-4 border-t border-[#e5e2ea] pt-6">
            <div className="flex -space-x-2">
              {["JM", "AR", "SK"].map((initials, index) => (
                <span
                  key={initials}
                  className={`grid h-9 w-9 place-items-center rounded-full border-2 border-[#f8f8fb] text-[10px] font-bold text-white ${
                    ["bg-[#5c6ac4]", "bg-[#bf6d8b]", "bg-[#398b7d]"][index]
                  }`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-xs leading-5 text-[#77727e]">
              <span className="font-bold text-[#3c3943]">
                Built for smarter planning
              </span>
              <br />
              Clear numbers before you commit.
            </p>
          </div>
        </div>

        <div id="estimator" className="min-w-0 scroll-mt-24">
          <Estimator {...props} />
        </div>
      </div>
    </section>
  );
}
