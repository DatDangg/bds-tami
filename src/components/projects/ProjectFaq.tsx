import { useLocale, useTranslations } from "next-intl";
import { CaretDown } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { SECTION_DOM_ID, type FaqView } from "@/lib/projects/project-detail-view";
import { buildFaqPageJsonLd } from "@/lib/seo/json-ld";
import type { Locale } from "@/i18n/routing";
import { DetailSection } from "@/components/detail/DetailSection";

/**
 * Câu hỏi thường gặp (BL-020 P5): accordion bằng `details/summary` gốc (bàn phím + đọc màn hình sẵn có, chạy cả khi chưa có JS; mỗi câu mở độc lập) và JSON-LD `FAQPage`
 * của đúng ngôn ngữ đang xem (cùng tập câu với accordion: `view.faqs` đã loại câu thiếu chữ ở ngôn ngữ này). Không có câu nào thì không render gì. Server Component.
 */
export function ProjectFaq({ faqs }: { faqs: FaqView[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.projectDetail.sections");
  const jsonLd = buildFaqPageJsonLd({ locale, items: faqs });
  if (!jsonLd) return null;
  return (
    <DetailSection id={SECTION_DOM_ID.faq} title={t("faq")}>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-[20px] border border-border bg-surface px-5">
        {faqs.map((faq) => (
          <details key={faq.id} className="group py-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 break-words">{faq.question}</span>
              <CaretDown size={20} aria-hidden="true" className="shrink-0 transition-transform duration-(--duration-fast) group-open:rotate-180" />
            </summary>
            <p className="pb-4 whitespace-pre-line text-text-secondary break-words">{faq.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd data={jsonLd} />
    </DetailSection>
  );
}
