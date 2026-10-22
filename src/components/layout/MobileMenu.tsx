"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useId, useState } from "react";
import { useMediaQuery } from "@/components/layout/use-environment";
import { CaretDown, List, X } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavAnchor, isActivePath } from "./NavAnchor";
import type { FooterContactView, LinkView, LogoView, NavItemView } from "./shell-data";

/** Từ xl header là một hàng có menu ngang, không có nút Menu (BL-019). Phải khớp breakpoint `xl` của Tailwind. */
const XL_QUERY = "(min-width: 1280px)";

interface MobileMenuProps {
  items: NavItemView[];
  contact: FooterContactView;
  logo: LogoView;
  cta?: LinkView;
}

/**
 * Menu toàn màn hình CHỈ ở < xl, mở từ nút Menu trong header (design-spec §2.2). Từ xl nút Menu bị ẩn (`xl:hidden`, display:none nên
 * không nhận focus) vì đã có menu ngang; đang mở mà cửa sổ rộng lên ≥ xl thì tự đóng để Radix nhả khoá cuộn nền (BL-019).
 * Radix Dialog lo bẫy focus, Esc đóng, khoá cuộn nền, trả focus về nút mở và `aria-expanded`/`aria-controls` trên nút.
 * Đóng thì nội dung không còn trong DOM (không có link ẩn bị focus). Bấm một link thì đóng: layout không dựng lại khi điều hướng
 * nên dialog sẽ kẹt nếu không tự đóng. Mục có con → accordion (`MenuItem`).
 */
export function MobileMenu({ items, contact, logo, cta }: MobileMenuProps) {
  const t = useTranslations("layout");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const isDesktop = useMediaQuery(XL_QUERY);

  // Điều chỉnh state ngay lúc render (không dùng effect): rộng lên ≥ xl thì đóng, quay lại < xl không tự mở lại.
  if (isDesktop && open) setOpen(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-small font-semibold tracking-[0.08em] text-text uppercase xl:hidden">
        <List size={24} aria-hidden="true" />
        {/* Có CTA: ở md–lg cụm phải (VI|EN + CTA + Menu) phải ≤ nửa hàng để logo vẫn ở giữa → chỉ icon, nhãn sr-only. */}
        <span className={cn("hidden sm:inline", cta && "md:hidden lg:inline")}>{t("header.menu")}</span>
        <span className={cn("sr-only sm:hidden", cta && "md:inline lg:hidden")}>{t("header.openMenu")}</span>
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
            <BrandLogo tone="on-dark" image={logo.onDark} />
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
                  <MenuItem key={item.href + item.label} item={item} active={isActivePath(pathname, item.href)} onNavigate={close} />
                ))}
              </ul>
            </nav>
            <div className="flex flex-col items-start gap-6">
              {cta && <NavAnchor link={cta} onClick={close} className={cn(buttonVariants(), "min-h-11")} />}
              <LanguageSwitcher tone="on-dark" />
              <MenuContact contact={contact} />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Một mục menu (spec §2.2). Mục có con: link cha vẫn điều hướng, nút caret riêng bên cạnh mở/đóng menu con (đóng mặc định).
 * Menu con trượt bằng `grid-template-rows 0fr→1fr` theo `--duration-base`, tắt khi reduced motion. Khi đóng, khung mang `inert`
 * nên link con không nhận focus/không có trong cây truy cập (nội dung vẫn trong DOM để chuyển động được).
 */
function MenuItem({ item, active, onNavigate }: { item: NavItemView; active: boolean; onNavigate: () => void }) {
  const t = useTranslations("layout.nav");
  const [open, setOpen] = useState(false);
  const submenuId = useId();
  const hasChildren = item.children.length > 0;
  return (
    <li className="border-b border-border">
      <div className="flex items-center justify-between gap-2">
        <NavAnchor
          link={item}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className="flex min-h-14 min-w-0 flex-1 items-center font-display text-h3 uppercase hover:text-accent-text aria-[current=page]:text-accent-text"
        />
        {hasChildren && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={submenuId}
            aria-label={t("openSubmenu", { label: item.label })}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text hover:text-accent-text"
          >
            <CaretDown size={20} aria-hidden="true" className={cn("transition-transform duration-(--duration-fast) motion-reduce:transition-none", open && "rotate-180")} />
          </button>
        )}
      </div>
      {hasChildren && (
        <div
          id={submenuId}
          // `aria-hidden` kèm `inert` như HeroSlider: trình duyệt cũ không có `inert` vẫn ẩn khỏi AT.
          aria-hidden={!open}
          inert={!open}
          className={cn(
            "grid transition-[grid-template-rows] duration-(--duration-base) ease-out motion-reduce:transition-none",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <ul className="overflow-hidden pl-4">
            {item.children.map((child) => (
              <li key={child.href + child.label} className="last:pb-3">
                <NavAnchor link={child} onClick={onNavigate} className="flex min-h-11 items-center text-body text-text-secondary hover:text-accent-text" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
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
