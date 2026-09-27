"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroSlider, SlideItem, CtaButton } from "@/lib/homepage-types";

interface Props {
  hero: HeroSlider;
  locale: string;
}

function CtaLink({ cta, locale, variant }: { cta: CtaButton; locale: string; variant: "primary" | "secondary" }) {
  if (variant === "primary") {
    return (
      <Link href={`/${locale}${cta.destination}`}>
        <Button size="lg" className="gap-2 w-full sm:w-auto">
          {cta.label}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    );
  }
  return (
    <Link href={`/${locale}${cta.destination}`}>
      <Button
        size="lg"
        variant="outline"
        className="w-full sm:w-auto border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent"
      >
        {cta.label}
      </Button>
    </Link>
  );
}

export function HeroSliderClient({ hero, locale }: Props) {
  const activeSlides = hero.slides.filter((s) => s.enabled);
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPrefersReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);

  const go = useCallback(
    (next: number) => {
      if (isAnimating || activeSlides.length <= 1) return;
      setIsAnimating(true);
      setIndex(next);
      setTimeout(() => setIsAnimating(false), prefersReduced ? 0 : 360);
    },
    [isAnimating, activeSlides.length, prefersReduced]
  );

  const prev = useCallback(() => go((index - 1 + activeSlides.length) % activeSlides.length), [go, index, activeSlides.length]);
  const next = useCallback(() => go((index + 1) % activeSlides.length), [go, index, activeSlides.length]);

  // Autoplay
  const startAutoplay = useCallback(() => {
    if (!hero.autoplay || activeSlides.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % activeSlides.length);
    }, hero.autoplayInterval ?? 5000);
  }, [hero.autoplay, hero.autoplayInterval, activeSlides.length]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = null;
  }, []);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  // Keyboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { stopAutoplay(); prev(); }
      if (e.key === "ArrowRight") { stopAutoplay(); next(); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [prev, next, stopAutoplay]);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { stopAutoplay(); dx < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  if (activeSlides.length === 0) return null;

  const slide: SlideItem = activeSlides[index];
  const multi = activeSlides.length > 1;

  return (
    <section
      ref={containerRef}
      className="section-dark relative overflow-hidden"
      style={{ minHeight: "min(520px, 80svh)" }}
      aria-roledescription="carousel"
      aria-label="Hero slider"
      tabIndex={0}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      onFocus={stopAutoplay}
      onBlur={startAutoplay}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background images — all preloaded, shown/hidden via opacity */}
      {activeSlides.map((s, i) => (
        s.imageUrl ? (
          <div
            key={s.id}
            aria-hidden
            className="absolute inset-0 transition-opacity"
            style={{
              opacity: i === index ? 1 : 0,
              transitionDuration: prefersReduced ? "0ms" : "360ms",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
        ) : null
      ))}

      {/* Slide content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:py-28 flex items-center min-h-[inherit]">
        <div
          key={slide.id}
          className="max-w-xl"
          style={{
            animation: isAnimating && !prefersReduced
              ? "slideIn 360ms ease forwards"
              : undefined,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            {slide.headlineTr}
          </h1>
          {slide.descriptionTr && (
            <p className="mt-6 text-base sm:text-lg text-white/60 max-w-lg leading-relaxed">
              {slide.descriptionTr}
            </p>
          )}
          {(slide.primaryCta || slide.secondaryCta) && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {slide.primaryCta && <CtaLink cta={slide.primaryCta} locale={locale} variant="primary" />}
              {slide.secondaryCta && <CtaLink cta={slide.secondaryCta} locale={locale} variant="secondary" />}
            </div>
          )}
        </div>
      </div>

      {/* Controls — only when multi-slide */}
      {multi && (
        <>
          {/* Dots */}
          <div
            className="absolute bottom-6 left-4 sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-2 z-20"
            role="tablist"
            aria-label="Slaytlar"
          >
            {activeSlides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Slayt ${i + 1}`}
                onClick={() => { stopAutoplay(); go(i); }}
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
              >
                <span
                  className="block rounded-full transition-all"
                  style={{
                    width: i === index ? "2rem" : "0.5rem",
                    height: "0.375rem",
                    backgroundColor: i === index
                      ? "var(--color-primary)"
                      : "rgba(255,255,255,0.35)",
                    transitionDuration: "240ms",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Prev / Next */}
          <div className="absolute right-4 bottom-4 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 flex sm:flex-col gap-2 z-20">
            <button
              aria-label="Önceki slayt"
              onClick={() => { stopAutoplay(); prev(); }}
              className="w-9 h-9 rounded-full border border-white/20 bg-black/30 hover:bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Sonraki slayt"
              onClick={() => { stopAutoplay(); next(); }}
              className="w-9 h-9 rounded-full border border-white/20 bg-black/30 hover:bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes slideIn { from { opacity: 1; } to { opacity: 1; } }
        }
      `}</style>
    </section>
  );
}
