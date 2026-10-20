import { useTranslations } from "next-intl";
import Link from "next/link";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { PostOfferView, RelatedTargetView } from "@/lib/posts/post-view";
import { CopyVoucherButton } from "./CopyVoucherButton";
import { OfferStatusBadge } from "./OfferStatusBadge";

function RelatedCard({ target }: { target: RelatedTargetView }) {
  const t = useTranslations("page.posts.offer");
  return (
    <Link
      href={target.href}
      className="group flex min-h-11 items-center gap-3 rounded-sm bg-surface p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
        {target.image && <ResponsiveImage media={target.image} sizes="80px" aspectRatio="1/1" decorative />}
      </div>
      <span className="flex min-w-0 flex-col">
        <span className="text-xsmall text-text-muted">{t(target.kind === "project" ? "relatedProject" : "relatedRental")}</span>
        <span className="line-clamp-2 text-small font-semibold transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text">{target.title}</span>
      </span>
    </Link>
  );
}

function periodText(period: NonNullable<PostOfferView["period"]>, t: ReturnType<typeof useTranslations>): string {
  if (period.startLabel && period.endLabel) return t("periodRange", { start: period.startLabel, end: period.endLabel });
  return period.endLabel ? t("periodUntil", { end: period.endLabel }) : t("periodFrom", { start: period.startLabel ?? "" });
}

/**
 * Khối ưu đãi của S09 (đặt TRƯỚC nội dung, nền `--color-primary-subtle`, viền `--color-primary`): giá, khu vực, thời hạn + badge trạng thái, mã
 * voucher + nút sao chép, điều khoản (accordion đóng), dự án / tin cho thuê liên quan. Ưu đãi đã kết thúc: KHÔNG có mã trong HTML (view đã bỏ,
 * BR-06) và không có nút sao chép, thay bằng dòng "Ưu đãi đã kết thúc". Server Component; chỉ nút sao chép là client.
 */
export function OfferBox({ offer }: { offer: PostOfferView }) {
  const t = useTranslations("page.posts.offer");
  const rows: Array<{ label: string; value: string }> = [
    ...(offer.price ? [{ label: t("price"), value: offer.price }] : []),
    ...(offer.areaLabel ? [{ label: t("area"), value: offer.areaLabel }] : []),
    ...(offer.period ? [{ label: t("period"), value: periodText(offer.period, t) }] : []),
  ];
  return (
    <section aria-labelledby="offer-box-title" className="flex flex-col gap-5 rounded-sm border border-primary bg-primary-subtle p-5 sm:p-6">
      <h2 id="offer-box-title" className="font-display text-h3">
        {t("title")}
      </h2>
      {(rows.length > 0 || offer.badge) && (
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <dt className="text-xsmall text-text-muted">{row.label}</dt>
              <dd className="text-body font-semibold">{row.value}</dd>
            </div>
          ))}
          {offer.badge && (
            <div className="flex flex-col items-start gap-1">
              <dt className="text-xsmall text-text-muted">{t("status")}</dt>
              <dd>
                <OfferStatusBadge badge={offer.badge} />
              </dd>
            </div>
          )}
        </dl>
      )}
      {offer.ended && <p className="text-body font-semibold text-text-muted">{t("ended")}</p>}
      {offer.voucherCode && (
        <div className="flex flex-col gap-2">
          <p className="text-xsmall text-text-muted">{t("voucher")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-sm border-2 border-dashed border-primary bg-surface px-4 py-2 font-display text-h3 tracking-[0.1em] tabular-nums">
              {offer.voucherCode}
            </span>
            <CopyVoucherButton code={offer.voucherCode} />
          </div>
        </div>
      )}
      {offer.terms && (
        <details className="rounded-sm bg-surface px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-small font-semibold">{t("terms")}</summary>
          <p className="pb-2 text-small whitespace-pre-line text-text-secondary">{offer.terms}</p>
        </details>
      )}
      {offer.related.length > 0 && (
        <ul aria-label={t("related")} className="grid gap-3 sm:grid-cols-2">
          {offer.related.map((target) => (
            <li key={target.kind}>
              <RelatedCard target={target} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
