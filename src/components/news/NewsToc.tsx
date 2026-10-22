"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { TocHeading } from "@/lib/content/section-headings";
import { cn } from "@/lib/utils";

// Vạch "đang đọc": heading cuối cùng có mép trên đã lên tới vạch này là mục active. Heading vừa được cuộn tới neo nằm ở `scroll-mt` = --sticky-top + 1rem
// (trang này không có `data-detail-page` nên --sticky-top = --header-offset 64/72px → 80/88px); vạch thấp hơn một chút để mục vừa bấm luôn tính là đã qua.
const ACTIVE_LINE_PX = 112;
// Sau khi bấm một mục, cuộn mượt đi ngang nhiều heading: bỏ qua cập nhật theo cuộn trong lúc đó để mục vừa bấm không nhảy qua các heading ở giữa.
const SCROLL_LOCK_MS = 1000;

const LINK_BASE =
  "flex min-h-11 items-center border-l-2 py-2 pr-2 text-small break-words [overflow-wrap:anywhere] transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface TocProps {
  headings: TocHeading[];
  /** Nhãn (đã dịch) của `nav` và tiêu đề mục lục. */
  label: string;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cuộn tới heading (mượt, tức thì khi giảm chuyển động) rồi chuyển focus vào đó; false khi không thấy heading (để link neo `#id` chạy mặc định). */
function scrollToHeading(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  history.replaceState(null, "", `#${id}`);
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  target.focus({ preventScroll: true });
  return true;
}

/** `ol` link `#id` thật (chạy cả khi chưa có JS); heading cấp 3 thụt vào. `activeId` chỉ có ở bản dính ≥ lg (vạch trái tô màu nhấn + chữ đậm). */
function TocLinks({ headings, activeId, onJump }: { headings: TocHeading[]; activeId?: string; onJump: (event: MouseEvent<HTMLAnchorElement>, id: string) => void }) {
  return (
    <ol className="flex flex-col">
      {headings.map((heading) => {
        const current = heading.id === activeId;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={current ? "location" : undefined}
              onClick={(event) => onJump(event, heading.id)}
              className={cn(
                LINK_BASE,
                heading.level === 3 ? "pl-6" : "pl-3",
                current ? "border-primary-deep font-semibold text-text" : "border-border text-text-secondary hover:text-text hover:underline",
              )}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Heading CUỐI CÙNG đã qua vạch; phía trên heading đầu → "" (không mục nào); qua heading cuối vẫn giữ mục cuối. */
function findActiveId(ids: string[]): string {
  let active = "";
  for (const id of ids) {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top !== undefined && top <= ACTIVE_LINE_PX) active = id;
  }
  return active;
}

/**
 * Mục lục cột trái ≥ lg (design `chi-tiet-tin-tuc.webp`, BL-054; khôi phục bản dính BL-033): nhãn "Mục lục" chữ hoa + danh sách có vạch trái, mục đang đọc
 * (`aria-current="location"`) vạch màu nhấn + chữ đậm theo cuộn trang (rAF-throttled, đo mép trên heading) và tự cuộn vào giữa khung (chỉ khung, không cuộn trang).
 * Việc DÍNH do cột chứa (`NewsArticleSidebar`) lo; khung tự giới hạn cao theo viewport và cuộn riêng. Ẩn dưới lg (bản gập `NewsTocDisclosure` thay) và khi in.
 */
export function NewsTocSidebar({ headings, label }: TocProps) {
  const [activeId, setActiveId] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const scrollLocked = useRef(false);
  const unlockTimer = useRef<number | undefined>(undefined);

  // Bỏ hẹn mở khoá cuộn khi rời trang (không đặt state sau unmount).
  useEffect(() => () => window.clearTimeout(unlockTimer.current), []);
  const idsKey = headings.map((heading) => heading.id).join("|");

  useEffect(() => {
    const ids = idsKey.split("|");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!scrollLocked.current) setActiveId(findActiveId(ids));
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [idsKey]);

  // Chỉ cuộn khung mục lục (đặt `scrollTop` của nav), không `scrollIntoView` để trang không bị kéo theo. `nav` là `relative` nên là offsetParent của link.
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !link || nav.scrollHeight <= nav.clientHeight) return;
    nav.scrollTop = link.offsetTop - (nav.clientHeight - link.offsetHeight) / 2;
  }, [activeId]);

  function handleJump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (!scrollToHeading(id)) return;
    event.preventDefault();
    scrollLocked.current = true;
    window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      scrollLocked.current = false;
    }, SCROLL_LOCK_MS);
    setActiveId(id);
  }

  return (
    <nav ref={navRef} aria-label={label} className="relative hidden max-h-[45dvh] overflow-y-auto overscroll-contain lg:block print:hidden">
      <p className="mb-3 text-eyebrow font-semibold tracking-[0.12em] text-text-muted uppercase">{label}</p>
      <TocLinks headings={headings} activeId={activeId} onJump={handleJump} />
    </nav>
  );
}

/**
 * Mục lục gập < lg (BL-054: mobile / tablet không có design): `<details>` gốc đóng mặc định, thẻ viền bo 20px đầu bài (sau ảnh bìa, trước nội dung);
 * bấm một mục thì cuộn tới heading và gập lại. Không có active (khung nhỏ, danh sách đóng). Ẩn từ lg (bản cột trái `NewsTocSidebar` thay) và khi in.
 */
export function NewsTocDisclosure({ headings, label }: TocProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function handleJump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (detailsRef.current) detailsRef.current.open = false;
    if (scrollToHeading(id)) event.preventDefault();
  }

  return (
    <details ref={detailsRef} className="mb-8 rounded-[20px] border border-border bg-surface lg:hidden print:hidden">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 font-semibold">{label}</summary>
      <nav aria-label={label} className="px-2 pb-3">
        <TocLinks headings={headings} onJump={handleJump} />
      </nav>
    </details>
  );
}
