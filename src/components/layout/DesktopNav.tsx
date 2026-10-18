"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CaretDown } from "@/components/icons";
import { cn } from "@/lib/utils";
import { NavAnchor, isActivePath } from "./NavAnchor";
import type { NavItemView } from "./shell-data";

/**
 * Menu ngang, chỉ hiện từ xl (design-spec §2.1). Mục có con theo mẫu disclosure: link cha giữ nguyên (điều hướng) + nút caret riêng
 * (`aria-expanded`, `aria-controls`, ≥ 44px) mở bằng Enter/Space/chạm. Chuột rê vào cả nhóm cũng mở (chỉ `pointerType=mouse`:
 * trên cảm ứng, tap sinh `mouseenter` rồi `click` sẽ mở rồi đóng ngay). Đóng bằng Esc (trả focus về nút), click ra ngoài hoặc focus
 * rời nhóm. Nội dung xổ nằm trong nhóm nên rê chuột vào đó không làm nó biến mất; Esc đóng được (WCAG 1.4.13).
 */
export function DesktopNav({ items }: { items: NavItemView[] }) {
  const t = useTranslations("layout.nav");
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const idPrefix = useId();
  // Chuột rê vào đã mở nhóm; click tiếp theo của chuột phải giữ mở (không toggle đóng). Chạm/bàn phím vẫn toggle.
  const lastPointerType = useRef("");

  useEffect(() => {
    if (openKey === null) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!listRef.current?.contains(event.target as Node)) setOpenKey(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openKey]);

  return (
    <nav aria-label={t("main")} className="hidden xl:block">
      {/* gap-4 ở xl: hàng header 1280px còn chỗ cho logo + 7 mục + tìm/VI|EN/CTA/Menu không tràn (BL-001); rộng hơn mới nới gap. */}
      <ul ref={listRef} className="flex items-center gap-4 2xl:gap-8">
        {items.map((item) => {
          const key = item.href + item.label;
          const hasChildren = item.children.length > 0;
          const isOpen = openKey === key;
          const submenuId = `${idPrefix}-${items.indexOf(item)}`;
          return (
            <li
              key={key}
              className="relative flex items-center"
              onPointerEnter={hasChildren ? (event) => event.pointerType === "mouse" && setOpenKey(key) : undefined}
              onPointerLeave={hasChildren ? (event) => event.pointerType === "mouse" && setOpenKey((current) => (current === key ? null : current)) : undefined}
              onBlur={hasChildren ? (event) => !event.currentTarget.contains(event.relatedTarget) && setOpenKey((current) => (current === key ? null : current)) : undefined}
              onKeyDown={
                hasChildren
                  ? (event) => {
                      if (event.key !== "Escape" || !isOpen) return;
                      event.stopPropagation();
                      setOpenKey(null);
                      event.currentTarget.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus();
                    }
                  : undefined
              }
            >
              <NavAnchor
                link={item}
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                className="inline-flex min-h-11 items-center border-b-2 border-transparent text-small font-semibold tracking-[0.08em] whitespace-nowrap text-text uppercase hover:text-accent-text aria-[current=page]:border-accent-text"
              />
              {hasChildren && (
                <>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={submenuId}
                    aria-label={t("openSubmenu", { label: item.label })}
                    onPointerDown={(event) => {
                      lastPointerType.current = event.pointerType;
                    }}
                    onClick={() => {
                      const keepOpen = isOpen && lastPointerType.current === "mouse";
                      lastPointerType.current = "";
                      setOpenKey(isOpen && !keepOpen ? null : key);
                    }}
                    className="inline-flex size-11 cursor-pointer items-center justify-center rounded-sm text-text hover:text-accent-text"
                  >
                    <CaretDown size={16} aria-hidden="true" className={cn("transition-transform duration-(--duration-fast)", isOpen && "rotate-180")} />
                  </button>
                  <ul id={submenuId} hidden={!isOpen} className="absolute top-full left-0 z-(--z-header) min-w-48 bg-surface py-2 shadow-md">
                    {item.children.map((child) => (
                      <li key={child.href + child.label}>
                        <NavAnchor
                          link={child}
                          onClick={() => setOpenKey(null)}
                          className="flex min-h-11 items-center px-4 text-small text-text hover:bg-surface-muted hover:text-accent-text"
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
