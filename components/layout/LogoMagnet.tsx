"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Brand } from "./Brand";

export function LogoMagnet() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip on touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    // Skip on reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);

      gsap.to(el, {
        x: offsetX * 0.3,
        y: offsetY * 0.3,
        duration: 1,
        ease: "power3.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 1.2,
        ease: "elastic.out(1, 0.4)",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, []);

  return (
    <div ref={ref} className="logo-magnet inline-flex items-center relative">
      <Brand />
    </div>
  );
}
