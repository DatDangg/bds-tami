import { useLocale, useTranslations } from "next-intl";
import { formatDate, formatNumber, formatVndCompact } from "@/lib/format";
import { SECTION_DOM_ID, type PriceAvailability, type PriceRowView } from "@/lib/projects/project-detail-view";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import { DetailSection } from "@/components/detail/DetailSection";

/** Cặp token chữ/nền đạt AA (xanh / vàng nâu / đỏ), kèm chữ nên không dựa riêng vào màu. */
const AVAILABILITY_CLASS: Record<PriceAvailability, string> = {
  available: "bg-success-subtle text-success-text",
  few_left: "bg-warning-subtle text-warning",
  sold_out: "bg-error-subtle text-error",
};

const CAPTION_ID = "price-table-caption";

interface RangeLabels {
  from: (value: string) => string;
  to: (value: string) => string;
}

/** "từ – đến"; chỉ một đầu → "Từ X" / "Đến X"; bằng nhau → một giá trị; không có gì → `null`. */
function formatRange(from: number | null, to: number | null, format: (value: number) => string, labels: RangeLabels): string | null {
  if (from !== null && to !== null) return from === to ? format(from) : `${format(from)} – ${format(to)}`;
  if (from !== null) return labels.from(format(from));
  if (to !== null) return labels.to(format(to));
  return null;
}

function AvailabilityBadge({ availability }: { availability: PriceAvailability | null }) {
  const t = useTranslations("page.projectDetail.price");
  if (!availability) {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t("unknown")}</span>
      </>
    );
  }
  return <span className={cn("inline-flex rounded-pill px-3 py-1 text-small font-semibold whitespace-nowrap", AVAILABILITY_CLASS[availability])}>{t(`availability.${availability}`)}</span>;
}

/**
 * Bảng giá theo loại căn (BL-020 P5): Loại căn · Diện tích · Giá · Tình trạng · Ghi chú. Giá rút gọn như thẻ danh sách (`3,5 tỷ`), khoảng "từ – đến"; trống giá → "Liên hệ".
 * Bảng cuộn ngang trong vùng `tabIndex=0` có tên (không tràn trang < lg, dùng được bằng bàn phím); `th scope` đúng cột/hàng; ngày cập nhật hiện phía trên bảng. Server Component.
 */
export function PriceTable({ rows, updatedAt }: { rows: PriceRowView[]; updatedAt: string | null }) {
  const locale = useLocale() as Locale;
  const tSection = useTranslations("page.projectDetail.sections");
  const tEyebrow = useTranslations("page.detail.eyebrow");
  const t = useTranslations("page.projectDetail.price");
  const rangeLabels: RangeLabels = { from: (value) => t("from", { value }), to: (value) => t("to", { value }) };
  return (
    <DetailSection id={SECTION_DOM_ID.pricing} eyebrow={tEyebrow("pricing")} title={tSection("pricing")}>
      {updatedAt && <p className="mb-4 text-small text-text-muted">{t("updated", { date: formatDate(updatedAt, locale) })}</p>}
      <div
        role="region"
        aria-labelledby={CAPTION_ID}
        tabIndex={0}
        className="overflow-x-auto rounded-[20px] border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <table className="w-full min-w-[40rem] border-collapse text-left text-body">
          <caption id={CAPTION_ID} className="sr-only">
            {t("caption")}
          </caption>
          <thead className="bg-surface-muted text-small text-text-secondary">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">{t("columns.unit")}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{t("columns.area")}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{t("columns.price")}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{t("columns.status")}</th>
              <th scope="col" className="px-4 py-3 font-semibold">{t("columns.note")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const area = formatRange(row.areaFrom, row.areaTo, (value) => formatNumber(value, locale), rangeLabels);
              const price = formatRange(row.priceFrom, row.priceTo, (value) => formatVndCompact(value, locale), rangeLabels);
              return (
                <tr key={row.id} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3 font-semibold break-words">{row.unitType}</th>
                  <td className="px-4 py-3 whitespace-nowrap">{area ? `${area} m²` : "—"}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{price ?? t("contact")}</td>
                  <td className="px-4 py-3">
                    <AvailabilityBadge availability={row.availability} />
                  </td>
                  <td className="px-4 py-3 text-small text-text-secondary break-words">{row.note ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DetailSection>
  );
}
