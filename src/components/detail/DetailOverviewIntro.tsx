import { useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import { CaretDown } from "@/components/icons";
import { splitOverview } from "@/lib/content/rich-text-lead";
import type { Locale } from "@/i18n/routing";

interface DetailOverviewIntroProps {
  /** Tóm tắt ngắn (Dự án `summary`, Tin BĐS `excerpt`); trống → dùng đoạn văn đầu của `content`. */
  summary?: string | null;
  /** richText đầy đủ (`overview` / `description` / `content`). */
  content: unknown;
  locale: Locale;
}

/**
 * Đoạn dẫn của khối Tổng quan (BL-056, design `detail-du-an`): tóm tắt (không có thì đoạn đầu của richText) + nút "Xem thêm" / "Thu gọn" mở nội dung đầy đủ.
 * Dùng `<details>` native — không cần JS, chữ đầy đủ luôn có trong HTML cho SEO; nhãn nút đổi theo trạng thái bằng CSS (`group-open`). Phần mở rộng bỏ đoạn đã dùng làm đoạn dẫn và giữ mọi block hiển thị được (cả ảnh / bảng không chữ); không còn gì → không có nút;
 * không có cả hai → không dựng.
 */
export function DetailOverviewIntro({ summary, content, locale }: DetailOverviewIntroProps) {
  const t = useTranslations("detailKit.overview");
  const tRich = useTranslations("page.richText");
  const { lead, rest } = splitOverview(content, summary);
  if (!lead && rest === null) return null;
  return (
    <div className="max-w-[68ch]">
      {lead && <p className="text-body text-text-secondary">{lead}</p>}
      {rest !== null && (
        <details className="group mt-3">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-small font-semibold text-accent-text marker:hidden hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{t("showMore")}</span>
            <span className="hidden group-open:inline">{t("showLess")}</span>
            <CaretDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
          </summary>
          <RichText data={rest} locale={locale} tableLabel={tRich("table")} className="pt-3" />
        </details>
      )}
    </div>
  );
}
