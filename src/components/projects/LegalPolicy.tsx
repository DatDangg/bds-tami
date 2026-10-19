"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { CaretDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface PolicyBlock {
  /** `id` của khối: đích của thanh mục con. */
  id: string;
  title: string;
  /** Nội dung richText đã render ở server. */
  content: ReactNode;
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
    <section id={block.id} tabIndex={-1} aria-labelledby={headingId} className="scroll-mt-[calc(var(--header-offset)+4.5rem)] min-w-0 focus:outline-none">
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
    const ids = blocks.map((block) => block.id);
    function openBlockFromHash() {
      let hashId: string;
      try {
        hashId = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!ids.includes(hashId)) return;
      setOpenIds((current) => (current.has(hashId) ? current : new Set(current).add(hashId)));
    }
    openBlockFromHash();
    window.addEventListener("hashchange", openBlockFromHash);
    return () => window.removeEventListener("hashchange", openBlockFromHash);
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
