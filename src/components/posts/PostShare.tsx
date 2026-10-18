"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Check, FacebookLogo, LinkSimple, ShareNetwork } from "@/components/icons";
import { ShareButtons } from "@/components/news/ShareButtons";
import { useCopyLink } from "@/components/news/use-copy-link";

interface PostShareProps {
  /** URL tuyệt đối canonical của bài. Thiếu (chưa cấu hình URL gốc) thì chỉ còn sao chép liên kết trang hiện tại. */
  url?: string;
  title: string;
}

const BUTTON_CLASS =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-sm border border-border px-4 text-small font-semibold text-text hover:border-input-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
const ICON_CLASS =
  "inline-flex size-11 cursor-pointer items-center justify-center rounded-sm text-text hover:bg-surface-muted hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

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
 * Chia sẻ đầu bài Đăng tin BĐS (S09), đặt ngay sau ngày đăng trong `<header>`:
 * - < sm: một nút "Chia sẻ" gọi `navigator.share` (tiêu đề + URL canonical). Không có API, hoặc lỗi khác ngoài huỷ → mở menu
 *   dự phòng (Facebook, Zalo, sao chép) ngay dưới nút: `aria-expanded`/`aria-controls`, Esc đóng và trả focus về nút, bấm ra ngoài
 *   đóng; không bẫy focus (menu nằm liền sau nút trong DOM nên Tab đi vào tự nhiên).
 * - sm–<xl: hàng ngang tái dùng `ShareButtons` (markup/hành vi của tin tức giữ nguyên).
 * Bản ≥ xl là `PostShareRail` (dính lề trái cột chữ). Mỗi mốc chỉ một cụm hiển thị (`hidden` = display none nên không lặp trong cây trợ năng).
 */
export function PostShare({ url, title }: PostShareProps) {
  return (
    <div className="flex flex-col gap-2 xl:hidden">
      <CompactShare url={url} title={title} />
      <div data-share-variant="row" className="hidden sm:block xl:hidden">
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

/**
 * Cụm dọc chỉ icon, chỉ hiện từ xl, dính (`sticky`, dưới header dính) ở lề trái cột chữ 768px. Cha đặt nó trong wrapper `relative`
 * bao đầu bài → hết nội dung/thư viện ảnh (`absolute inset-y-0`) nên rail chỉ dính trong vùng đó, không đè form lead/bài liên quan.
 * Ảnh bìa 1024px (rộng hơn cột chữ, positioned, đứng sau trong DOM) sẽ vẽ đè rail nếu cùng z → wrapper nâng `z-(--z-raised)`
 * (10, dưới `--z-header` 30 nên header dính vẫn che rail); rail có nền `bg-surface` để nổi trên mép ảnh. Wrapper cao suốt vùng bài
 * nên `pointer-events-none`, chỉ cụm nút `pointer-events-auto` — cột trống không chặn click ảnh. Sao chép báo qua status `sr-only`.
 * Trong DOM rail đứng SAU `<header>` để Tab gặp tiêu đề trước (vị trí hiển thị không đổi vì `absolute`).
 */
export function PostShareRail({ url }: Pick<PostShareProps, "url">) {
  const t = useTranslations("page.news.share");
  const { copyState, copyLink } = useCopyLink(url);
  const encoded = url ? encodeURIComponent(url) : null;
  return (
    <div
      data-share-variant="rail"
      className="pointer-events-none absolute inset-y-0 left-[calc(50%-var(--container-text)/2)] z-(--z-raised) hidden xl:block print:hidden"
    >
      <div
        role="group"
        aria-label={t("label")}
        className="pointer-events-auto sticky top-24 flex w-fit -translate-x-[calc(100%+1rem)] flex-col items-center gap-1 rounded-sm border border-border bg-surface p-1 shadow-sm"
      >
        {encoded && (
          <>
            <a href={facebookHref(encoded)} target="_blank" rel="noopener noreferrer" aria-label={t("facebook")} title={t("facebook")} className={ICON_CLASS}>
              <FacebookLogo size={22} aria-hidden="true" />
            </a>
            <a href={zaloHref(encoded)} target="_blank" rel="noopener noreferrer" aria-label={t("zalo")} title={t("zalo")} className={`${ICON_CLASS} text-xsmall font-bold tracking-tight`}>
              <span aria-hidden="true">Zalo</span>
            </a>
          </>
        )}
        <button type="button" onClick={copyLink} aria-label={t("copy")} className={ICON_CLASS}>
          {copyState === "copied" ? <Check size={22} aria-hidden="true" /> : <LinkSimple size={22} aria-hidden="true" />}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copyState === "copied" ? t("copied") : copyState === "failed" ? t("copyFailed") : ""}
        </span>
      </div>
    </div>
  );
}
