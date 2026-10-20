"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { type KeyboardEvent, type MouseEvent, type TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, CaretLeft, CaretRight, Pause, Play } from "@/components/icons";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { Button } from "@/components/ui/button";
import type { HeroSlideView } from "@/lib/home/home-view";
import { cn } from "@/lib/utils";
import { useMediaQuery, usePageVisible, useSaveData } from "@/components/layout/use-environment";

/** Khớp `--slider-interval` (globals.css). */
export const SLIDE_INTERVAL_MS = 6000;
/** Chờ sau khi trang tải xong mới tải ảnh slide kế: ảnh LCP (slide 1) không phải tranh băng thông. */
const PRELOAD_NEXT_DELAY_MS = 1500;
const SWIPE_MIN_PX = 50;
/** Điều khiển carousel (chấm, Dừng/Phát, trước/sau): chỉ phím mũi tên từ các phần tử này mới đổi slide. */
const CONTROL_SELECTOR = "[data-carousel-control]";

const CONTROL_BUTTON =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-dark transition-colors duration-(--duration-fast) hover:bg-dark/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
/** Nút tròn viền mảnh (mũi tên Trước/Sau, cuộn xuống) như mockup BL-044. */
const RING_BUTTON = "border border-on-dark/40";

/** Số thứ tự slide 2 chữ số (`01 / 03`) như mockup. */
const twoDigits = (value: number) => String(value).padStart(2, "0");

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

interface HeroSliderProps {
  slides: HeroSlideView[];
  /** Chữ nhỏ trên tiêu đề (viết hoa giãn chữ) và chú thích góc dưới phải — CHUNG mọi slide (BL-044 Q4). */
  eyebrow?: string | null;
  caption?: string | null;
  /** Ô tìm kiếm đè đáy hero từ md: chừa chỗ dưới nội dung và nâng nhóm điều khiển/nút cuộn lên trên ô. */
  overlapsSearch?: boolean;
}

/**
 * Hero trang chủ (SPECIFICATIONS F1 "Bố cục theo mockup mới" BL-044; cơ chế carousel BL-020): 1-8 slide, ảnh slide 1 là ảnh LCP (`priority`), các slide sau chỉ tải sau khi trang tải xong.
 * Bố cục: chữ canh TRÁI trong khung container (eyebrow → tiêu đề + dòng vàng → phụ đề → nút); góc dưới trái: nút Dừng/Phát + bộ đếm `01 / 03` + thanh tiến trình
 * (mỗi đoạn là nút chuyển slide, thay chấm giữa); góc dưới phải: chú thích + nút cuộn xuống; mũi tên tròn hai mép giữa (≥ lg).
 * Video (tuỳ chọn) chỉ dựng ở client khi ≥ 1024px, không reduced-motion, không Save-Data nên HTML server không kèm video.
 * A11y: `region` + `aria-roledescription`, nút Dừng/Phát (cả khi 1 slide có video tự chạy, WCAG 2.2.2), autoplay dừng khi hover/focus/tab ẩn/reduced-motion,
 * phím mũi tên chỉ khi focus ở điều khiển carousel (không cướp phím của nút CTA trong slide), vuốt ngang trên cảm ứng.
 * Tiêu đề slide là `p`: `h1` của trang nằm ngoài carousel (HomeBlocks) để không bị `aria-hidden`/`inert` theo slide.
 */
export function HeroSlider({ slides, eyebrow = null, caption = null, overlapsSearch = false }: HeroSliderProps) {
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

  /**
   * Cuộn mượt (reduced-motion: nhảy ngay). Có ô tìm kiếm ngay sau hero (`data-hero-search`, đè đáy hero từ md) thì đưa ĐỈNH ô đó xuống ngay dưới header
   * (`scroll-mt-(--header-offset)` của nó) để tab không bị header che; không thì tới đáy hero trừ chiều cao header nổi.
   */
  const scrollToContent = (event: MouseEvent<HTMLButtonElement>) => {
    const hero = event.currentTarget.closest("section");
    if (!hero) return;
    const behavior = reducedMotion ? "auto" : "smooth";
    const search = hero.nextElementSibling;
    if (search instanceof HTMLElement && search.hasAttribute("data-hero-search")) {
      search.scrollIntoView({ behavior, block: "start" });
      return;
    }
    const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
    const top = hero.getBoundingClientRect().bottom + window.scrollY - headerHeight;
    window.scrollTo({ top, behavior });
  };
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
      className="theme-dark-block relative isolate -mt-(--header-offset) h-svh max-h-[1080px] min-h-[560px] overflow-hidden"
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
                  "relative mx-auto flex h-full w-full max-w-container flex-col items-start justify-center gap-4 px-gutter pt-(--header-offset) pb-40 text-left sm:pb-28 transition duration-(--duration-reveal) ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none lg:px-20",
                  overlapsSearch && "md:pb-52",
                  active ? "translate-y-0 opacity-100 delay-200" : "translate-y-6 opacity-0",
                )}
              >
                {eyebrow && <p className="text-eyebrow font-semibold uppercase text-on-dark">{eyebrow}</p>}
                {(slide.title || slide.titleAccent) && (
                  <p className="max-w-[22ch] font-display text-display text-balance text-on-dark">
                    {slide.title}
                    {slide.titleAccent && (
                      <>
                        {slide.title && <br />}
                        <span className="text-primary">{slide.titleAccent}</span>
                      </>
                    )}
                  </p>
                )}
                {slide.subtitle && <p className="max-w-[48ch] text-lead text-on-dark-muted">{slide.subtitle}</p>}
                {slide.ctaHref && slide.ctaLabel && (
                  <Button asChild className="mt-2">
                    <Link href={slide.ctaHref}>
                      {slide.ctaLabel}
                      <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cụm đáy: trái = Dừng/Phát (ĐẦU thứ tự tab, WAI-ARIA carousel) + bộ đếm + thanh tiến trình; phải = chú thích + nút cuộn (từ sm). Cùng khung container với chữ. */}
      <div className={cn("pointer-events-none absolute inset-x-0 bottom-4 sm:bottom-6", overlapsSearch && "md:bottom-28")}>
        <div className="mx-auto flex w-full max-w-container items-end justify-between gap-4 px-gutter lg:px-20">
          {/* DOM: Dừng/Phát trước (đầu thứ tự tab); hiển thị: bộ đếm sát mép trái chữ như mockup → thanh tiến trình → nút Dừng/Phát (`order`). Khi dồn dòng ở màn hẹp thanh xuống hàng riêng. */}
          <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-x-3">
            {showPauseButton && (
              <button type="button" data-carousel-control="" aria-label={userPaused ? t("play") : t("pause")} onClick={() => setUserPaused((paused) => !paused)} className={cn(CONTROL_BUTTON, "order-3")}>
                {userPaused ? <Play size={20} weight="fill" aria-hidden="true" /> : <Pause size={20} weight="fill" aria-hidden="true" />}
              </button>
            )}
            {/* Bộ đếm chỉ để nhìn: slide đang hiện đã được `aria-label` "Slide i / n" của nhóm slide nêu. Chỉ khi có > 1 slide. */}
            {multiple && (
              <span aria-hidden="true" className="order-1 shrink-0 text-small text-on-dark tabular-nums">
                <span className="font-semibold">{twoDigits(index + 1)}</span>
                <span className="text-on-dark-muted"> / {twoDigits(count)}</span>
              </span>
            )}
            {multiple && (
              // Mỗi đoạn tối thiểu 44px bề ngang (vùng chạm); vạch vẽ vẫn mảnh `h-0.5`. `minWidth` theo số slide để không bao giờ nhỏ hơn 44px/đoạn.
              <div role="group" aria-label={t("dots")} style={{ minWidth: `${count * 2.75}rem` }} className="order-2 flex w-40 max-w-full items-center overflow-x-auto sm:w-56">
                {slides.map((slide, position) => (
                  <button
                    key={slide.id}
                    type="button"
                    data-carousel-control=""
                    aria-label={t("goTo", { index: position + 1 })}
                    aria-current={position === index ? "true" : undefined}
                    onClick={() => goTo(position)}
                    className="group inline-flex h-11 min-w-11 flex-1 cursor-pointer items-center px-0.5 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("h-0.5 w-full rounded-full transition-colors duration-(--duration-base) motion-reduce:transition-none", position === index ? "bg-primary" : "bg-on-dark/40 group-hover:bg-on-dark")}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="pointer-events-auto hidden items-center gap-4 sm:flex">
            {caption && <p className="max-w-[28ch] text-right text-small text-on-dark line-clamp-2">{caption}</p>}
            <button type="button" aria-label={t("scrollDown")} onClick={scrollToContent} className={cn(CONTROL_BUTTON, RING_BUTTON)}>
              <ArrowDown size={20} aria-hidden="true" />
            </button>
            {/* Vạch dọc trang trí sát mép phải như mockup: viền dùng màu `on-dark` có sẵn. */}
            <span aria-hidden="true" className="h-12 border-l border-on-dark/40" />
          </div>
        </div>
      </div>
      {multiple && (
        <>
          <button type="button" data-carousel-control="" aria-label={t("previous")} onClick={() => goTo(index - 1)} className={cn(CONTROL_BUTTON, RING_BUTTON, "absolute top-1/2 left-6 hidden size-12 -translate-y-1/2 lg:inline-flex")}>
            <CaretLeft size={24} aria-hidden="true" />
          </button>
          <button type="button" data-carousel-control="" aria-label={t("next")} onClick={() => goTo(index + 1)} className={cn(CONTROL_BUTTON, RING_BUTTON, "absolute top-1/2 right-6 hidden size-12 -translate-y-1/2 lg:inline-flex")}>
            <CaretRight size={24} aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
}
