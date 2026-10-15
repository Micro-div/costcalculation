"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/common/Reveal";
import { useAppReady } from "@/components/common/useAppReady";
import { Icon } from "@/components/common/Icon";

interface AnimationFeature {
  id: number;
  icon: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  animationType: "float" | "pulse" | "rotate" | "slide" | "scale" | "glow";
}

const animationFeatures: AnimationFeature[] = [
  {
    id: 1,
    icon: "zap",
    title: "Instant Estimates",
    description: "Get accurate project costs in minutes, not days. AI-powered analysis delivers results instantly.",
    color: "text-[#6954df]",
    bgColor: "bg-[#f0edff]",
    animationType: "pulse",
  },
  {
    id: 2,
    icon: "globe",
    title: "Global Pricing",
    description: "Localized costs for 150+ countries and cities. Currency, labor rates, and market conditions included.",
    color: "text-[#398b7d]",
    bgColor: "bg-[#e8f8f1]",
    animationType: "float",
  },
  {
    id: 3,
    icon: "file-text",
    title: "Professional Quotes",
    description: "Generate polished PDF quotations with line items, terms, and branding. Ready to send to clients.",
    color: "text-[#a86b18]",
    bgColor: "bg-[#fff3df]",
    animationType: "rotate",
  },
  {
    id: 4,
    icon: "shield",
    title: "Confidence Scoring",
    description: "Know how complete your estimate is. AI flags missing info and suggests professional review where needed.",
    color: "text-[#376bb4]",
    bgColor: "bg-[#eaf2ff]",
    animationType: "scale",
  },
  {
    id: 5,
    icon: "users",
    title: "Team Collaboration",
    description: "Share estimates with stakeholders. Collect feedback, track changes, and approve together in real-time.",
    color: "text-[#bf6d8b]",
    bgColor: "bg-[#fdeef3]",
    animationType: "slide",
  },
  {
    id: 6,
    icon: "trending",
    title: "Smart Analytics",
    description: "Track estimate accuracy over time. Learn from past projects to improve future predictions.",
    color: "text-[#6954df]",
    bgColor: "bg-[#f0edff]",
    animationType: "glow",
  },
];

const animationStyles = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slide-in {
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes scale-pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(105, 84, 223, 0.2); }
  50% { box-shadow: 0 0 40px rgba(105, 84, 223, 0.4), 0 0 60px rgba(105, 84, 223, 0.2); }
}

.animate-float { animation: float 3s ease-in-out infinite; }
.animate-pulse-ring::before {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 2px solid currentColor;
  animation: pulse-ring 2s ease-out infinite;
}
.animate-rotate-slow { animation: rotate-slow 20s linear infinite; }
.animate-slide-in { animation: slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
.animate-scale-pop { animation: scale-pop 2.5s ease-in-out infinite; }
.animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-pulse-ring::before,
  .animate-rotate-slow,
  .animate-slide-in,
  .animate-scale-pop,
  .animate-glow-pulse {
    animation: none !important;
  }
}
`;

export function AnimationSection() {
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ready = useAppReady();

  useEffect(() => {
    if (!ready) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute("data-id"));
            setVisibleFeatures((prev) => new Set(prev).add(id));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (containerRef.current) {
      containerRef.current.querySelectorAll("[data-id]").forEach((el) => {
        observerRef.current?.observe(el);
      });
    }

    return () => observerRef.current?.disconnect();
  }, [ready]);

  const getAnimationClass = (type: AnimationFeature["animationType"]) => {
    switch (type) {
      case "float":
        return "animate-float";
      case "pulse":
        return "animate-pulse-ring relative";
      case "rotate":
        return "animate-rotate-slow";
      case "slide":
        return "animate-slide-in";
      case "scale":
        return "animate-scale-pop";
      case "glow":
        return "animate-glow-pulse";
      default:
        return "";
    }
  };

  return (
    <section
      id="animation-showcase"
      className="scroll-mt-20 bg-[#f8f8fb] py-16 sm:py-24"
    >
      <style>{animationStyles}</style>
      <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b56d8]">
              Why CostCalc
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-3">
            <h2 className="text-3xl font-bold tracking-[-0.045em] text-[#1d1b24] sm:text-4xl lg:text-5xl">
              Built for modern project planning.
            </h2>
          </Reveal>
          <Reveal delay={240} className="mt-4 max-w-2xl mx-auto">
            <p className="text-base leading-7 text-[#6b6773] sm:text-lg">
              Every feature is designed to give you clarity, confidence, and speed.
              Watch how they work together to transform your estimation workflow.
            </p>
          </Reveal>
        </div>

        {/* Animated Feature Cards */}
        <Reveal delay={360}>
          <div ref={containerRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {animationFeatures.map((feature, index) => (
              <div
                key={feature.id}
                data-id={feature.id}
                className={`group relative rounded-[24px] border border-[#e7e4eb] bg-white p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#cec7ec] hover:shadow-[0_20px_40px_rgba(34,29,49,0.08)] ${visibleFeatures.has(feature.id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  transitionDuration: "600ms",
                }}
              >
                {/* Animated Icon Container */}
                <div
                  className={`relative grid h-14 w-14 place-items-center rounded-2xl ${feature.bgColor} ${feature.color} ${getAnimationClass(feature.animationType)}`}
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  <Icon name={feature.icon as any} className="h-7 w-7" />
                  
                  {/* Pulse ring effect for pulse animation */}
                  {feature.animationType === "pulse" && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-current opacity-0 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                  )}
                </div>

                {/* Feature Content */}
                <div className="mt-5">
                  <h3 className="text-lg font-bold tracking-[-0.025em] text-[#1d1b24]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#77727e]">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative accent line */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: feature.color.replace("text-", "") }}
                />

                {/* Floating particles effect */}
                <div className="absolute top-4 right-4 pointer-events-none overflow-hidden" style={{ width: 60, height: 60 }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-current/20"
                      style={{
                        width: `${8 + i * 4}px`,
                        height: `${8 + i * 4}px`,
                        top: `${10 + i * 10}%`,
                        left: `${10 + i * 15}%`,
                        animation: `float ${3 + i}s ease-in-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}