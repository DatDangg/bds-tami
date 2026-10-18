"use client";

import { useTranslations } from "next-intl";
import { FacebookLogo } from "@/components/icons";
import { useCopyLink } from "./use-copy-link";

interface ShareButtonsProps {
  /** URL tuyệt đối của bài (canonical). Thiếu (chưa cấu hình URL gốc) thì chỉ còn nút sao chép liên kết trang hiện tại. */
  url?: string;
  title: string;
}

const ACTION_CLASS =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm border border-border px-4 text-small font-semibold text-text hover:border-input-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Chia sẻ cuối bài (S11): Facebook, Zalo, sao chép liên kết. Facebook/Zalo là link mở tab mới (không cần JS, không tải SDK
 * của bên thứ ba nên không lộ dữ liệu khách trước khi họ bấm). Chỉ nút sao chép cần JS; kết quả báo qua vùng `aria-live`.
 * Trang Đăng tin BĐS (S09) dùng `PostShare` riêng (chia sẻ đầu bài, Web Share < sm) nhưng tái dùng component này cho sm–<xl.
 */
export function ShareButtons({ url, title }: ShareButtonsProps) {
  const t = useTranslations("page.news.share");
  const { copyState, copyLink } = useCopyLink(url);

  const encoded = url ? encodeURIComponent(url) : null;
  return (
    <div role="group" aria-label={t("label")} className="flex flex-wrap items-center gap-3">
      {encoded && (
        <>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("facebook")}
            title={title}
            className={ACTION_CLASS}
          >
            <FacebookLogo size={18} aria-hidden="true" />
            <span>Facebook</span>
          </a>
          <a
            href={`https://sp.zalo.me/plugins/share?dl=${encoded}&type=link`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("zalo")}
            title={title}
            className={ACTION_CLASS}
          >
            <span>Zalo</span>
          </a>
        </>
      )}
      <button type="button" onClick={copyLink} className={ACTION_CLASS}>
        {t("copy")}
      </button>
      <span role="status" aria-live="polite" className="text-small text-text-secondary">
        {copyState === "copied" ? t("copied") : copyState === "failed" ? t("copyFailed") : ""}
      </span>
    </div>
  );
}
