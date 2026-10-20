"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { FacebookLogo, LinkSimple, ShareNetwork } from "@/components/icons";
import { ShareButtons } from "@/components/news/ShareButtons";
import { useCopyLink } from "@/components/news/use-copy-link";

interface PostShareProps {
  /** URL tuyệt đối canonical của bài. Thiếu (chưa cấu hình URL gốc) thì chỉ còn sao chép liên kết trang hiện tại. */
  url?: string;
  title: string;
}

const BUTTON_CLASS =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-sm border border-border px-4 text-small font-semibold text-text hover:border-input-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function facebookHref(encodedUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
}
function zaloHref(encodedUrl: string) {
  return `https://sp.zalo.me/plugins/share?dl=${encodedUrl}&type=link`;
}

/** Người dùng đóng hộp chia sẻ hệ thống → không phải lỗi, không cần menu dự phòng. So `name` thay vì `instanceof Error`: `DOMException` có thể khác realm. */
function isUserCancel(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

/**
 * Chia sẻ của Đăng tin BĐS (S09), đặt ngay sau ngày đăng trong khối Tổng quan:
 * - < sm: một nút "Chia sẻ" gọi `navigator.share` (tiêu đề + URL canonical). Không có API, hoặc lỗi khác ngoài huỷ → mở menu
 *   dự phòng (Facebook, Zalo, sao chép) ngay dưới nút: `aria-expanded`/`aria-controls`, Esc đóng và trả focus về nút, bấm ra ngoài
 *   đóng; không bẫy focus (menu nằm liền sau nút trong DOM nên Tab đi vào tự nhiên).
 * - ≥ sm: hàng ngang tái dùng `ShareButtons` (markup/hành vi của tin tức giữ nguyên).
 * Mỗi mốc chỉ một cụm hiển thị (`hidden` = display none nên không lặp trong cây trợ năng).
 */
export function PostShare({ url, title }: PostShareProps) {
  return (
    <div className="flex flex-col gap-2">
      <CompactShare url={url} title={title} />
      <div data-share-variant="row" className="hidden sm:block">
        <ShareButtons title={title} {...(url ? { url } : {})} />
      </div>
    </div>
  );
}

function CompactShare({ url, title }: PostShareProps) {
  const t = useTranslations("page.news.share");
  const tPosts = useTranslations("page.posts.share");
  const { copyState, copyLink } = useCopyLink(url);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  async function share() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (!("share" in navigator)) {
      setMenuOpen(true);
      return;
    }
    try {
      await navigator.share({ title, url: url ?? window.location.href });
    } catch (error) {
      if (!isUserCancel(error)) setMenuOpen(true);
    }
  }

  function closeOnEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !menuOpen) return;
    event.stopPropagation();
    setMenuOpen(false);
    buttonRef.current?.focus();
  }

  const encoded = url ? encodeURIComponent(url) : null;
  return (
    <div ref={rootRef} data-share-variant="compact" className="flex flex-col gap-2 sm:hidden" onKeyDown={closeOnEscape}>
      <button ref={buttonRef} type="button" aria-expanded={menuOpen} aria-controls={menuId} onClick={share} className={`${BUTTON_CLASS} w-fit`}>
        <ShareNetwork size={18} aria-hidden="true" />
        {tPosts("button")}
      </button>
      <div id={menuId} hidden={!menuOpen} role="group" aria-label={tPosts("menu")} className="flex flex-col gap-2">
        {encoded && (
          <>
            <a href={facebookHref(encoded)} target="_blank" rel="noopener noreferrer" aria-label={t("facebook")} title={t("facebook")} className={BUTTON_CLASS}>
              <FacebookLogo size={18} aria-hidden="true" />
              <span>Facebook</span>
            </a>
            <a href={zaloHref(encoded)} target="_blank" rel="noopener noreferrer" aria-label={t("zalo")} title={t("zalo")} className={BUTTON_CLASS}>
              <span>Zalo</span>
            </a>
          </>
        )}
        <button type="button" onClick={copyLink} className={BUTTON_CLASS}>
          <LinkSimple size={18} aria-hidden="true" />
          {t("copy")}
        </button>
        <span role="status" aria-live="polite" className="text-small text-text-secondary">
          {copyState === "copied" ? t("copied") : copyState === "failed" ? t("copyFailed") : ""}
        </span>
      </div>
    </div>
  );
}
