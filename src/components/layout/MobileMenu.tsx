"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import { List, X } from "@/components/icons";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavAnchor, isActivePath } from "./NavAnchor";
import type { FooterContactView, NavItemView } from "./shell-data";

/** Từ breakpoint này menu ngang thay menu toàn màn hình (Tailwind `xl`, 80rem). */
const DESKTOP_QUERY = "(min-width: 80rem)";

/** Tự đóng khi cửa sổ rộng ra tới cỡ có menu ngang: nút Menu đã ẩn, lớp phủ không được kẹt lại. */
function useCloseOnDesktop(close: () => void) {
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [close]);
}

/**
 * Menu toàn màn hình cho < xl (design-spec §2.2). Radix Dialog lo bẫy focus, Esc đóng, khoá cuộn nền, trả focus về nút mở
 * và `aria-expanded`/`aria-controls` trên nút. Đóng thì nội dung không còn trong DOM (không có link ẩn bị focus).
 * Bấm một link thì đóng: layout không dựng lại khi điều hướng nên dialog sẽ kẹt nếu không tự đóng.
 */
export function MobileMenu({ items, contact }: { items: NavItemView[]; contact: FooterContactView }) {
  const t = useTranslations("layout");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useCloseOnDesktop(close);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-sm px-2 text-small font-semibold tracking-[0.08em] text-text uppercase xl:hidden">
        <List size={24} aria-hidden="true" />
        <span className="hidden sm:inline">{t("header.menu")}</span>
        <span className="sr-only sm:hidden">{t("header.openMenu")}</span>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        {/* Overlay là nơi Radix gắn khoá cuộn nền (react-remove-scroll): thiếu nó thì trang phía sau vẫn cuộn được. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-(--z-overlay) bg-dark-deep" />
        <DialogPrimitive.Content
          data-slot="mobile-menu"
          // `.theme-dark-block` (CSS không nằm trong layer) đặt nền là --color-dark; spec §2.2 cần --color-dark-deep nên ghi đè bằng token.
          style={{ backgroundColor: "var(--color-dark-deep)" }}
          className="theme-dark-block fixed inset-0 z-(--z-overlay) flex flex-col overflow-y-auto data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
        >
          <DialogPrimitive.Title className="sr-only">{t("header.menu")}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t("nav.mobileDescription")}</DialogPrimitive.Description>
          <div className="mx-auto flex h-16 w-full max-w-container shrink-0 items-center justify-between px-gutter lg:h-18">
            <BrandLogo tone="on-dark" />
            <DialogPrimitive.Close
              aria-label={t("header.closeMenu")}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm text-text"
            >
              <X size={24} aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className="mx-auto grid w-full max-w-container flex-1 content-start gap-10 px-gutter pt-6 pb-section-tight lg:grid-cols-[2fr_1fr] lg:gap-16">
            <nav aria-label={t("nav.mobile")}>
              <ul className="flex flex-col">
                {items.map((item) => (
                  <li key={item.href + item.label} className="border-b border-border">
                    <NavAnchor
                      link={item}
                      onClick={close}
                      aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                      className="flex min-h-14 items-center font-display text-h2 uppercase hover:text-accent-text aria-[current=page]:text-accent-text"
                    />
                    {item.children.length > 0 && (
                      <ul className="pb-3 pl-4">
                        {item.children.map((child) => (
                          <li key={child.href + child.label}>
                            <NavAnchor
                              link={child}
                              onClick={close}
                              className="flex min-h-11 items-center text-body text-text-secondary hover:text-accent-text"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-6">
              <LanguageSwitcher />
              <MenuContact contact={contact} />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function MenuContact({ contact }: { contact: FooterContactView }) {
  const t = useTranslations("layout.footer");
  return (
    <ul className="flex flex-col gap-3 text-body text-text-secondary">
      {contact.hotline && (
        <li>
          {t("hotline")}:{" "}
          <a href={contact.hotline.telHref} className="inline-flex min-h-11 items-center text-text hover:text-accent-text">
            {contact.hotline.label}
          </a>
        </li>
      )}
      {contact.email && (
        <li>
          <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center break-all text-text hover:text-accent-text">
            {contact.email}
          </a>
        </li>
      )}
      {contact.address && <li>{contact.address}</li>}
    </ul>
  );
}
