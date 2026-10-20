"use client";

import { useRef, type MouseEvent } from "react";
import type { TocHeading } from "@/lib/content/section-headings";
import { cn } from "@/lib/utils";

const LINK_BASE =
  "flex min-h-11 items-center border-l-2 border-transparent py-2 pr-2 text-small text-text-secondary break-words [overflow-wrap:anywhere] transition-colors duration-(--duration-fast) hover:text-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

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

/**
 * Mục lục bài viết (BL-045, Q3): `<details>` gốc đóng mặc định, thẻ viền bo 20px đặt đầu bài (sau ảnh bìa, trước nội dung) ở MỌI breakpoint; bấm một mục thì cuộn tới
 * heading và gập lại. `ol` link `#id` thật (chạy cả khi chưa có JS); heading cấp 3 thụt vào. Ẩn khi in. Thay mục lục dính cột trái của BL-033.
 */
export function NewsTocDisclosure({ headings, label }: TocProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function handleJump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (detailsRef.current) detailsRef.current.open = false;
    if (scrollToHeading(id)) event.preventDefault();
  }

  return (
    <details ref={detailsRef} className="mb-6 rounded-[20px] border border-border bg-surface print:hidden">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 font-semibold">{label}</summary>
      <nav aria-label={label} className="px-2 pb-3">
        <ol className="flex flex-col">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a href={`#${heading.id}`} onClick={(event) => handleJump(event, heading.id)} className={cn(LINK_BASE, heading.level === 3 ? "pl-6" : "pl-3")}>
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
