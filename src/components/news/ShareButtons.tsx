"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Check, FacebookLogo, LinkSimple, ShareNetwork } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useCopyLink } from "./use-copy-link";

interface ShareButtonsProps {
  /** URL tuyệt đối của bài (canonical). Thiếu (chưa cấu hình URL gốc) thì chỉ còn nút sao chép liên kết trang hiện tại. */
  url?: string;
  title: string;
  /**
   * `default`: nút viền có chữ (tuyển dụng, menu dự phòng của `DetailShareButton`). `icons`: hàng tác giả chi tiết tin tức BL-054 — nhãn "Chia sẻ:" +
   * nút tròn chỉ icon (tên truy cập = `aria-label`) + nút "thêm" Web Share API (chỉ hiện khi trình duyệt có `navigator.share`).
   */
  variant?: "default" | "icons";
  /** `on-dark` (chỉ biến thể `icons`, hero chi tiết tin tức BL-062): nút viền trắng, icon trắng trên ảnh tối; mặc định giữ kiểu nền sáng. */
  tone?: "default" | "on-dark";
}

const ACTION_CLASS =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm border border-border px-4 text-small font-semibold text-text hover:border-input-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
const ICON_CLASS =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xsmall font-bold text-text transition-colors hover:border-input-border hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const ICON_ON_DARK_CLASS =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-on-dark bg-transparent text-xsmall font-bold text-on-dark transition-colors hover:bg-on-dark/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-dark";

const subscribeNever = () => () => undefined;
const hasNativeShare = () => typeof navigator.share === "function";
const falseOnServer = () => false;

/** Trình duyệt có Web Share API. Server / trước hydrate = `false` (HTML server và lần render client đầu khớp nhau); không đổi trong phiên nên không cần đăng ký. */
function useCanNativeShare(): boolean {
  return useSyncExternalStore(subscribeNever, hasNativeShare, falseOnServer);
}

/**
 * Chia sẻ bài: Facebook, Zalo, sao chép liên kết (+ "thêm" ở biến thể `icons`). Facebook/Zalo là link mở tab mới (không cần JS, không tải SDK
 * của bên thứ ba nên không lộ dữ liệu khách trước khi họ bấm). Chỉ nút sao chép / "thêm" cần JS; kết quả sao chép báo qua vùng `aria-live` (biến thể `icons`: vùng đó chỉ cho trình đọc màn hình, nút đổi sang dấu tích khi đã chép).
 * Nút chia sẻ ở khối tiêu đề trang chi tiết (`DetailShareButton`: Dự án, Cho thuê, Đăng tin BĐS) tái dùng component này làm menu dự phòng khi trình duyệt không có Web Share.
 */
export function ShareButtons({ url, title, variant = "default", tone = "default" }: ShareButtonsProps) {
  const t = useTranslations("page.news.share");
  const tDetail = useTranslations("page.newsDetail.v2");
  const { copyState, copyLink } = useCopyLink(url);
  const icons = variant === "icons";
  const canNativeShare = useCanNativeShare();

  async function nativeShare() {
    try {
      await navigator.share({ title, url: url ?? window.location.href });
    } catch {
      // Người dùng huỷ bảng chia sẻ (AbortError) hoặc trình duyệt từ chối: không có gì để báo.
    }
  }

  const encoded = url ? encodeURIComponent(url) : null;
  const onDark = icons && tone === "on-dark";
  const actionClass = icons ? (onDark ? ICON_ON_DARK_CLASS : ICON_CLASS) : ACTION_CLASS;
  return (
    <div role="group" aria-label={t("label")} className={cn("flex flex-wrap items-center", icons ? "gap-2" : "gap-3")}>
      {icons && (
        <span aria-hidden="true" className={cn("mr-1 text-small", onDark ? "text-on-dark" : "text-text-muted")}>
          {tDetail("shareLabel")}
        </span>
      )}
      {encoded && (
        <>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("facebook")}
            title={icons ? t("facebook") : title}
            className={actionClass}
          >
            <FacebookLogo size={18} aria-hidden="true" />
            {!icons && <span>Facebook</span>}
          </a>
          <a
            href={`https://sp.zalo.me/plugins/share?dl=${encoded}&type=link`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("zalo")}
            title={icons ? t("zalo") : title}
            className={actionClass}
          >
            <span aria-hidden={icons ? "true" : undefined}>Zalo</span>
          </a>
        </>
      )}
      <button type="button" onClick={copyLink} className={actionClass} {...(icons ? { "aria-label": t("copy"), title: t("copy") } : {})}>
        {!icons ? t("copy") : copyState === "copied" ? <Check size={18} aria-hidden="true" className={onDark ? "text-primary" : "text-success-text"} /> : <LinkSimple size={18} aria-hidden="true" />}
      </button>
      {icons && canNativeShare && (
        <button type="button" onClick={() => void nativeShare()} aria-label={tDetail("shareMore")} title={tDetail("shareMore")} className={actionClass}>
          <ShareNetwork size={18} aria-hidden="true" />
        </button>
      )}
      <span role="status" aria-live="polite" className={icons ? "sr-only" : "text-small text-text-secondary"}>
        {copyState === "copied" ? t("copied") : copyState === "failed" ? t("copyFailed") : ""}
      </span>
    </div>
  );
}
