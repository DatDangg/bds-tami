"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { CaretDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface PolicyBlock {
  /** `id` của khối: đích của thanh mục con. */
  id: string;
  /** Neo phụ cũng mở khối này (vd `#documents` nằm trong khối Pháp lý). */
  anchorIds?: string[];
  title: string;
  /** Dòng nhỏ vàng trên tiêu đề (kiểu thẻ BL-045); thiếu thì không dựng. */
  eyebrow?: string;
  /** Nội dung richText đã render ở server. */
  content: ReactNode;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const LG_QUERY = "(min-width: 1024px)";

function subscribeLg(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(LG_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Mặc định (SSR, không có matchMedia) là mobile-first; CSS `max-lg:hidden` lo phần ẩn/hiện nội dung nên HTML đầu không nháy ở desktop. */
function useIsLg() {
  return useSyncExternalStore(
    subscribeLg,
    () => (typeof window.matchMedia === "function" ? window.matchMedia(LG_QUERY).matches : false),
    () => false,
  );
}

function PolicyBlockView({ block, open, onToggle, isLg }: { block: PolicyBlock; open: boolean; onToggle: () => void; isLg: boolean }) {
  const headingId = useId();
  const panelId = useId();
  return (
    <section id={block.id} tabIndex={-1} aria-labelledby={headingId} className="scroll-mt-[calc(var(--sticky-top)+4.5rem)] min-w-0 focus:outline-none">
      {block.eyebrow && <p className="mb-1.5 text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{block.eyebrow}</p>}
      <h2 id={headingId} className="font-display text-h2">
        {isLg ? (
          block.title
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
            className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 border-b border-border py-3 text-left"
          >
            <span>{block.title}</span>
            <CaretDown size={20} aria-hidden="true" className={cn("shrink-0 transition-transform duration-(--duration-fast)", open && "rotate-180")} />
          </button>
        )}
      </h2>
      {/* Không dùng thuộc tính `hidden`: Tailwind v4 đặt `[hidden]{display:none!important}` nên thắng mọi lớp `lg:` và desktop mất cột tới khi hydrate.
          `max-lg:hidden` chỉ ẩn dưới lg (display:none nên cũng ra khỏi cây truy cập); ≥ lg luôn hiện ngay từ HTML server. */}
      <div id={panelId} className={cn("pt-6", !open && "max-lg:hidden")}>
        {block.content}
      </div>
    </section>
  );
}

/**
 * Pháp lý + Chính sách bán hàng (S03 khối 8): ≥ lg hai cột cạnh nhau, luôn mở; < lg là accordion, mở sẵn mục đầu. Phần chữ tiêu đề là
 * `h2` ở cả hai chế độ (ở mobile `h2` bọc nút bấm) nên thanh mục con và người đọc màn hình đều điều hướng theo heading như nhau.
 * Đi tới `#<id>` của một khối (mở trang kèm hash, hoặc bấm thanh mục con, thanh này phát `hashchange`) thì mở đúng khối đó.
 */
export function LegalPolicy({ blocks }: { blocks: PolicyBlock[] }) {
  const isLg = useIsLg();
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set(blocks.slice(0, 1).map((block) => block.id)));

  useEffect(() => {
    function openBlockFromHash() {
      let hashId: string;
      try {
        hashId = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      const target = blocks.find((block) => block.id === hashId || block.anchorIds?.includes(hashId));
      if (!target) return;
      setOpenIds((current) => (current.has(target.id) ? current : new Set(current).add(target.id)));
      // Neo phụ (`#documents`) nằm trong khối có thể đang `display:none`: chỉ cuộn được sau khi khối mở và đã render lại.
      if (target.anchorIds?.includes(hashId)) {
        requestAnimationFrame(() => document.getElementById(hashId)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }));
      }
    }
    // Bấm lại link cùng hash không phát `hashchange` và trình duyệt cuộn tới phần tử còn ẩn: tự mở + cuộn.
    function onAnchorClick(event: MouseEvent) {
      // Ctrl/Cmd/Shift/Alt hoặc nút chuột khác: để trình duyệt xử lý (mở tab mới…).
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
      const hashId = link?.getAttribute("href")?.slice(1);
      if (!hashId || !blocks.some((block) => block.anchorIds?.includes(hashId))) return;
      event.preventDefault();
      window.history.replaceState(null, "", `#${hashId}`);
      openBlockFromHash();
    }
    openBlockFromHash();
    window.addEventListener("hashchange", openBlockFromHash);
    document.addEventListener("click", onAnchorClick);
    return () => {
      window.removeEventListener("hashchange", openBlockFromHash);
      document.removeEventListener("click", onAnchorClick);
    };
  }, [blocks]);

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-2 xl:gap-12">
      {blocks.map((block) => (
        <PolicyBlockView key={block.id} block={block} open={openIds.has(block.id)} onToggle={() => toggle(block.id)} isLg={isLg} />
      ))}
    </div>
  );
}
