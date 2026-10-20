import { useTranslations } from "next-intl";
import { CheckCircle } from "@/components/icons";
import { SECTION_DOM_ID, type HighlightView } from "@/lib/projects/project-detail-view";
import { DetailSection } from "@/components/detail/DetailSection";

/**
 * Khối Điểm nổi bật (BL-020 P5): lưới thẻ trắng bo 20px, 1 cột < sm / 2 cột ≥ sm / 3 cột ≥ xl (trong cột chính, đã trừ cột Tư vấn). Trường `icon` của dữ liệu là chữ tự do
 * chưa có bảng ánh xạ tới bộ icon (giống tiện ích) nên mọi thẻ dùng một icon chung thay vì đoán theo tên. Server Component.
 */
export function ProjectHighlights({ highlights }: { highlights: HighlightView[] }) {
  const t = useTranslations("page.projectDetail");
  const tEyebrow = useTranslations("page.detail.eyebrow");
  return (
    <DetailSection id={SECTION_DOM_ID.highlights} eyebrow={tEyebrow("highlights")} title={t("sections.highlights")}>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {highlights.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-5">
            <CheckCircle size={28} weight="duotone" aria-hidden="true" className="shrink-0 text-accent-text" />
            <h3 className="font-display text-h3 break-words">{item.title}</h3>
            {item.description && <p className="text-body whitespace-pre-line text-text-secondary break-words">{item.description}</p>}
          </li>
        ))}
      </ul>
    </DetailSection>
  );
}
