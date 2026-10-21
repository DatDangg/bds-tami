import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Phone } from "@/components/icons";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";

/**
 * Cột phải dính (≥ lg) KHÔNG cuộn riêng, cùng công thức `DETAIL_ASIDE_CARD_CLASS` (BL-031): `top` = min(dưới thanh mục con, đáy viewport − chiều cao khối − 1rem);
 * `--detail-aside-h` do `DetailAsideFit` đo trên phần tử con đầu của `aside` — chính là gốc của component này.
 */
const STICKY_CLASS =
  "flex flex-col gap-4 lg:sticky lg:top-[min(calc(var(--sticky-top)_+_4.5rem),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))]";

interface DetailContactAsideProps {
  /** Tiêu đề thẻ form (vd "Nhận thông tin dự án"); `h2`. */
  title: string;
  /** `id` tiêu đề — trang truyền cùng giá trị làm `asideLabelledBy`. */
  headingId: string;
  description?: string | null;
  /** Form lead do trang truyền (`LeadForm source=…` duy nhất của trang). */
  children: ReactNode;
  /** Hotline; trống → ẩn khối nền tối. */
  hotline?: { label: string; telHref: string } | null;
  /** Phần đầu thẻ, TRÊN tiêu đề form (vd giá thuê + người phụ trách của tin cho thuê); thẻ khi đó bọc cả hai, `#lead-form` vẫn là vùng form. */
  header?: ReactNode;
}

const CARD_CLASS = "rounded-[20px] border border-border bg-surface p-6 shadow-md lg:p-6";
/** Đích cuộn của `#lead-form`: dưới thanh tab dính. */
const SCROLL_MT_CLASS = "scroll-mt-[calc(var(--sticky-top)+4.5rem)]";

/**
 * Cột liên hệ trang chi tiết (BL-052, design `detail-du-an`): thẻ trắng bo 20px chứa tiêu đề + mô tả + form (neo `#lead-form` của `LeadFormSlot`, đích của CTA dính đáy
 * và banner tư vấn) → khối Hotline nền tối (số + nút "Gọi ngay" `tel:`). Đặt trong `DetailPageShell aside` (bọc `DetailAsideFit`). Server Component.
 */
export function DetailContactAside({ title, headingId, description, children, hotline, header }: DetailContactAsideProps) {
  const t = useTranslations("detailKit.contact");
  const form = (
    <LeadFormSlot title={title} headingId={headingId} className={header ? `bg-transparent p-0 lg:p-0 ${SCROLL_MT_CLASS}` : `${CARD_CLASS} ${SCROLL_MT_CLASS}`}>
      {description && <p className="-mt-2 mb-4 text-small text-text-secondary">{description}</p>}
      {children}
    </LeadFormSlot>
  );
  return (
    <div className={STICKY_CLASS}>
      {header ? (
        <div className={`flex flex-col gap-6 ${CARD_CLASS}`}>
          {header}
          {form}
        </div>
      ) : (
        form
      )}
      {hotline && (
        <div className="theme-dark-block flex items-center justify-between gap-4 rounded-[20px] bg-dark-deep p-5 text-on-dark">
          <p className="min-w-0">
            <span className="block text-xsmall text-on-dark-muted">{t("hotline")}</span>
            <span className="block font-display text-h3 font-semibold break-words">{hotline.label}</span>
          </p>
          <a
            href={hotline.telHref}
            aria-label={t("callNowAria", { number: hotline.label })}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill border border-on-dark/50 px-4 text-small font-semibold text-on-dark transition-colors duration-(--duration-fast) hover:bg-on-dark hover:text-dark-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Phone size={16} aria-hidden="true" />
            {t("callNow")}
          </a>
        </div>
      )}
    </div>
  );
}
