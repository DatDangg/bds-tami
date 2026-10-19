"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { type KeyboardEvent, type TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import type { HeroSlideView } from "@/lib/home/home-view";
import { cn } from "@/lib/utils";
import { useMediaQuery, usePageVisible, useSaveData } from "./use-environment";

/** Khớp `--slider-interval` (globals.css). */
export const SLIDE_INTERVAL_MS = 6000;
/** Chờ sau khi trang tải xong mới tải ảnh slide kế: ảnh LCP (slide 1) không phải tranh băng thông. */
const PRELOAD_NEXT_DELAY_MS = 1500;
const SWIPE_MIN_PX = 50;
/** Điều khiển carousel (chấm, Dừng/Phát, trước/sau): chỉ phím mũi tên từ các phần tử này mới đổi slide. */
const CONTROL_SELECTOR = "[data-carousel-control]";

const CONTROL_BUTTON =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-dark transition-colors duration-(--duration-fast) hover:bg-dark/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function HeroVideo({ src, paused }: { src: string; paused: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (paused) video.pause();
    // `play()` bị từ chối khi trình duyệt chặn autoplay: ảnh poster bên dưới vẫn hiện, không phải lỗi.
    else void video.play()?.catch(() => undefined);
  }, [paused]);
  return <video ref={ref} src={src} muted loop playsInline autoPlay preload="metadata" aria-hidden="true" tabIndex={-1} className="absolute inset-0 size-full object-cover" />;
}

/**
 * Hero trang chủ (design-spec S01.1, §1.4): carousel 1-8 slide, ảnh slide 1 là ảnh LCP (`priority`), các slide sau chỉ tải sau khi trang tải xong.
 * Video (tuỳ chọn) chỉ dựng ở client khi ≥ 1024px, không reduced-motion, không Save-Data nên HTML server không kèm video.
 * A11y: `region` + `aria-roledescription`, nút Dừng/Phát (cả khi 1 slide có video tự chạy, WCAG 2.2.2), autoplay dừng khi hover/focus/tab ẩn/reduced-motion,
 * phím mũi tên chỉ khi focus ở điều khiển carousel (không cướp phím của nút CTA trong slide), vuốt ngang trên cảm ứng.
 * Tiêu đề slide là `p`: `h1` của trang nằm ngoài carousel (HomeBlocks) để không bị `aria-hidden`/`inert` theo slide.
 */
export function HeroSlider({ slides }: { slides: HeroSlideView[] }) {
  const t = useTranslations("page.home.hero");
  const count = slides.length;
  const multiple = count > 1;
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const wide = useMediaQuery("(min-width: 1024px)");
  const saveData = useSaveData();
  const tabVisible = usePageVisible();

  const autoplayEnabled = multiple && !reducedMotion && !userPaused;
  const running = autoplayEnabled && !hovered && !focused && tabVisible;
  const videoAllowed = wide && !reducedMotion && !saveData;
  const videoPlaying = videoAllowed && Boolean(slides[index]?.videoUrl);
  const showPauseButton = !reducedMotion && (multiple || videoPlaying);

  const markVisited = useCallback((target: number) => setVisited((previous) => (previous.has(target) ? previous : new Set(previous).add(target))), []);
  const goTo = useCallback(
    (next: number) => {
      const target = (next + count) % count;
      setIndex(target);
      markVisited(target);
    },
    [count, markVisited],
  );

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => goTo(index + 1), SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [running, index, goTo]);

  useEffect(() => {
    if (!multiple) return;
    const timer = window.setTimeout(() => markVisited((index + 1) % count), PRELOAD_NEXT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [multiple, index, count, markVisited]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!multiple || !(event.target instanceof Element) || !event.target.closest(CONTROL_SELECTOR)) return;
    if (event.key === "ArrowLeft") goTo(index - 1);
    else if (event.key === "ArrowRight") goTo(index + 1);
  };
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    const end = event.changedTouches[0];
    touchStart.current = null;
    if (!multiple || !start || !end) return;
    const dx = end.clientX - start.x;
    // Cuộn dọc/chéo của trang không được đổi slide: chuyển động ngang phải trội hơn.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(end.clientY - start.y)) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("region")}
      data-header-hero=""
      className="theme-dark-block relative isolate -mt-16 h-svh max-h-[1080px] min-h-[560px] overflow-hidden lg:-mt-18"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Đang tự chạy thì không đọc lại mỗi lần đổi slide (WCAG 2.2.2); dừng rồi thì đọc lịch sự. */}
      <div aria-live={running ? "off" : "polite"} className="absolute inset-0">
        {slides.map((slide, position) => {
          const active = position === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slide", { index: position + 1, total: count })}
              aria-hidden={!active}
              inert={!active}
              className={cn("absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none", active ? "opacity-100" : "pointer-events-none opacity-0")}
            >
              {(position === 0 || visited.has(position)) && (
                <ResponsiveImage media={slide.image} sizes="100vw" priority={position === 0} decorative className="absolute inset-0" />
              )}
              {active && videoAllowed && slide.videoUrl && <HeroVideo src={slide.videoUrl} paused={userPaused} />}
              <div aria-hidden="true" className="absolute inset-0 bg-overlay" />
              <div
                className={cn(
                  "relative mx-auto flex h-full w-full max-w-container flex-col items-center justify-center gap-6 px-gutter pt-16 pb-40 text-center sm:pb-24 lg:pt-18 transition duration-(--duration-reveal) ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
                  active ? "translate-y-0 opacity-100 delay-200" : "translate-y-6 opacity-0",
                )}
              >
                {slide.title && <p className="max-w-[22ch] font-display text-display text-balance text-on-dark">{slide.title}</p>}
                {slide.subtitle && <p className="max-w-[48ch] text-lead text-on-dark-muted">{slide.subtitle}</p>}
                {slide.ctaHref && slide.ctaLabel && (
                  <Button asChild size="lg" className="w-full max-w-xs sm:w-auto">
                    <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dừng/Phát đứng ĐẦU thứ tự tab (WAI-ARIA carousel) và cùng nhóm với chấm: 375px xếp dọc, từ sm xếp ngang → không đè nhau (8 chấm × 44px = 352px). */}
      {(multiple || showPauseButton) && (
        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center sm:flex-row sm:justify-center">
          {showPauseButton && (
            <button type="button" data-carousel-control="" aria-label={userPaused ? t("play") : t("pause")} onClick={() => setUserPaused((paused) => !paused)} className={CONTROL_BUTTON}>
              {userPaused ? <Play size={20} weight="fill" aria-hidden="true" /> : <Pause size={20} weight="fill" aria-hidden="true" />}
            </button>
          )}
          {multiple && (
            <div role="group" aria-label={t("dots")} className="flex flex-wrap items-center justify-center px-2">
              {slides.map((slide, position) => (
                <button
                  key={slide.id}
                  type="button"
                  data-carousel-control=""
                  aria-label={t("goTo", { index: position + 1 })}
                  aria-current={position === index ? "true" : undefined}
                  onClick={() => goTo(position)}
                  className="group inline-flex size-11 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring"
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-2 rounded-full transition-all duration-(--duration-base) motion-reduce:transition-none", position === index ? "w-6 bg-primary" : "w-2 bg-on-dark/60 group-hover:bg-on-dark")}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {multiple && (
        <>
          <button type="button" data-carousel-control="" aria-label={t("previous")} onClick={() => goTo(index - 1)} className={cn(CONTROL_BUTTON, "absolute top-1/2 left-6 hidden size-12 -translate-y-1/2 lg:inline-flex")}>
            <CaretLeft size={28} aria-hidden="true" />
          </button>
          <button type="button" data-carousel-control="" aria-label={t("next")} onClick={() => goTo(index + 1)} className={cn(CONTROL_BUTTON, "absolute top-1/2 right-6 hidden size-12 -translate-y-1/2 lg:inline-flex")}>
            <CaretRight size={28} aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
}
