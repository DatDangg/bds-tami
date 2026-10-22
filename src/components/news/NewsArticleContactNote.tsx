import Link from "next/link";
import { useTranslations } from "next-intl";
import { Info } from "@/components/icons";

interface NewsArticleContactNoteProps {
  /** Chữ admin (`site-settings.newsDetail.contactNote`, ngôn ngữ đang xem); rỗng / thiếu → câu mặc định i18n. Luôn là văn bản thuần. */
  text: string | undefined;
  /** Đích link thương hiệu: trang Liên hệ theo ngôn ngữ, đã kèm `#lead-form`. */
  contactHref: string;
}

/**
 * Khung liên hệ cuối MỌI bài tin tức (BL-062 D7): nền kem bo góc, icon vàng trong vòng tròn, chữ `text-secondary`. Mỗi lần xuất hiện chuỗi "TAMI REAL ESTATE" trong chữ
 * thành link màu nhấn tới trang Liên hệ. Chữ admin render qua React text node (KHÔNG `dangerouslySetInnerHTML`) nên HTML admin gõ vào hiện nguyên văn, không chạy.
 * ≥ md thụt cùng rãnh chữ của mục `h2` (3.25rem, khớp `.news-prose`).
 */
export function NewsArticleContactNote({ text, contactHref }: NewsArticleContactNoteProps) {
  const t = useTranslations("page.newsDetail.v2");
  const brand = t("contactNoteBrand");
  const parts = (text || t("contactNote")).split(brand);
  return (
    <div role="note" className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-primary-subtle p-4 md:ms-[3.25rem] md:items-center md:px-5">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
        <Info size={20} weight="fill" />
      </span>
      <p className="min-w-0 text-small text-text-secondary [overflow-wrap:anywhere] md:text-body">
        {parts.map((part, index) => (
          // Chỉ chèn link GIỮA các đoạn (split cho n+1 đoạn khi gặp n lần thương hiệu); đoạn trùng chữ nên key theo vị trí là ổn định.
          <span key={index}>
            {index > 0 && (
              <Link href={contactHref} className="font-semibold text-accent-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                {brand}
              </Link>
            )}
            {part}
          </span>
        ))}
      </p>
    </div>
  );
}
