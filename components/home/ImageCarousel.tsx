"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Reveal } from "@/components/common/Reveal";
import { Icon } from "@/components/common/Icon";

interface CarouselImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  description: string;
}

const carouselImages: CarouselImage[] = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=960&q=75",
    alt: "Web development project",
    title: "Web Applications",
    description: "Custom web apps with modern frameworks and scalable architecture.",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=960&q=75",
    alt: "Mobile app development",
    title: "Mobile Apps",
    description: "Native and cross-platform mobile applications for iOS and Android.",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=960&q=75",
    alt: "E-commerce platform",
    title: "E-commerce Solutions",
    description: "Complete online stores with payment integration and inventory management.",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=960&q=75",
    alt: "SaaS platform dashboard",
    title: "SaaS Platforms",
    description: "Multi-tenant SaaS applications with subscription billing and analytics.",
  },
];

// Duplicate images for seamless infinite scroll
const stripImages = [...carouselImages, ...carouselImages];

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  // Auto-advance carousel (skipped when the visitor prefers reduced motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section
      id="image-carousel"
      className="scroll-mt-20 bg-white py-16 sm:py-24"
    >
      <Reveal>
        <div className="mx-auto max-w-[1200px] px-5 sm:px-7">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b56d8]">
              Project Showcase
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-3">
            <h2 className="text-3xl font-bold tracking-[-0.045em] text-[#1d1b24] sm:text-4xl lg:text-5xl">
              Real projects, real results.
            </h2>
          </Reveal>
          <Reveal delay={240} className="mt-4 max-w-2xl mx-auto">
            <p className="text-base leading-7 text-[#6b6773] sm:text-lg">
              Explore a curated selection of project types we help estimate.
              Each category represents real-world development work with localized pricing.
            </p>
          </Reveal>
          <Reveal delay={300} className="mt-6">
            <p className="text-center text-lg font-semibold text-[#3c3943] tracking-[-0.01em]">
              Every great project starts with clear numbers.
            </p>
          </Reveal>
        </div>

        {/* Carousel Container */}
        <Reveal delay={360}>
          <div className="relative">
            {/* Main Carousel */}
            <div className="relative overflow-hidden rounded-[24px] bg-[#f8f8fb]">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {carouselImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative w-full flex-shrink-0 min-h-[380px] sm:min-h-[480px]"
                  >
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 960px"
                        loading="lazy"
                        className="object-cover opacity-80 transition duration-1000 ease-out group-hover:opacity-100 group-hover:scale-110"
                      />
                      {/* Gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>

                    {/* Content Overlay */}
                    <div className="relative z-10 flex h-full items-end p-8 sm:p-12">
                      <div className="max-w-xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                          <Icon name="star" className="h-3.5 w-3.5 text-yellow-400" />
                          Featured Category
                        </span>
                        <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl">
                          {image.title}
                        </h3>
                        <p className="mt-3 text-base leading-6 text-white/80 sm:text-lg">
                          {image.description}
                        </p>
                        <div className="mt-6 flex items-center gap-4 text-white/70">
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            <Icon name="arrow-right" className="h-4 w-4" />
                            View estimate range
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              disabled={isAnimating}
              className="absolute left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[#3c3943] shadow-lg transition-all duration-300 hover:bg-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-20 sm:left-6"
              aria-label="Previous slide"
            >
              <Icon name="chevron-left" className="h-6 w-6" />
            </button>

            <button
              onClick={nextSlide}
              disabled={isAnimating}
              className="absolute right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[#3c3943] shadow-lg transition-all duration-300 hover:bg-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-20 sm:right-6"
              aria-label="Next slide"
            >
              <Icon name="chevron-right" className="h-6 w-6" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isAnimating}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-[#6954df] w-6 shadow-md"
                      : "bg-white/60 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* Image Strip - Horizontal scrolling with auto-scroll */}
        <Reveal delay={480} className="mt-16">
          <div className="image-strip">
            <div className="image-strip-track">
              {stripImages.map((image, i) => (
                <div
                  key={`${image.id}-${i}`}
                  className="image-strip-card"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="156px"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
      </Reveal>
    </section>
  );
}