import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "@/components/icons";
import { SPOTLIGHT_SECONDARY_LINK_CLASS, SPOTLIGHT_STRETCHED_LINK_CLASS, SPOTLIGHT_TITLE_CLASS } from "@/components/listing/spotlight-content-classes";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatArea } from "@/lib/format";
import type { PostCardData } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";

interface Fact {
  key: string;
  label: string;
  value: string;
  accent: boolean;
}

/** Thẻ BĐS: Giá (rút gọn / ghi chú giá / "Liên hệ") · Diện tích · Phòng ngủ; thẻ voucher: Hạn ưu đãi · Trạng thái (+ Giá nếu có). Ô trống bị bỏ. */
function useFacts(data: PostCardData): Fact[] {
  const locale = useLocale() as Locale;
  const t = useTranslations("page.posts.list.spotlight");
  const tCard = useTranslations("postCard");
  if (data.kind === "voucher") {
    const ended = data.badge?.kind === "ended";
    return [
      ...(data.endLabel ? [{ key: "offerEnds", label: t("offerEnds"), value: data.endLabel, accent: false }] : []),
      { key: "offerStatus", label: t("offerStatus"), value: tCard(ended ? "offerEnded" : "offerActive"), accent: !ended },
      ...(data.priceLabel ? [{ key: "price", label: t("price"), value: data.priceLabel, accent: true }] : []),
    ];
  }
  return [
    { key: "price", label: t("price"), value: data.priceLabel ?? tCard("contact"), accent: true },
    ...(data.areaM2 === null ? [] : [{ key: "area", label: t("area"), value: formatArea(data.areaM2, locale), accent: false }]),
    ...(data.bedrooms === null ? [] : [{ key: "bedrooms", label: t("bedrooms"), value: tCard("bedroomsLabel", { count: data.bedrooms }), accent: false }]),
  ];
}

/**
 * Phần NỘI DUNG (cột phải) của thẻ nổi bật `/tin-bds` (BL-052, cùng khung `SpotlightSlider` với `/du-an`, `/cho-thue`): tag danh mục + loại hình (+ "Ưu đãi" khi tin bán
 * kèm ưu đãi), tên, khu vực, tóm tắt 2 dòng, dải thông số theo loại thẻ (`data.kind`), nút "Xem chi tiết" + "Nhận tư vấn" (→ `#lead-form` của chi tiết). Không icon tim.
 */
export function PostSpotlightContent({ data }: { data: PostCardData }) {
  const t = useTranslations("page.posts");
  const tCard = useTranslations("postCard");
  const tType = useTranslations("listingOptions.propertyType");
  const facts = useFacts(data);
  const tags = [
    data.categoryName,
    data.kind === "property" && data.propertyType ? tType(data.propertyType) : null,
    data.kind === "property" && data.hasOffer ? tCard("offer") : null,
  ].filter((tag): tag is string => Boolean(tag));
  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={`${index}:${tag}`} variant={index === 0 && data.categoryName ? "dark" : "neutral"}>
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <h2 className={SPOTLIGHT_TITLE_CLASS}>{data.title}</h2>
      {data.placeLabel && (
        <p className="flex min-w-0 items-center gap-1.5 text-small text-text-muted">
          <MapPin size={16} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{data.placeLabel}</span>
        </p>
      )}
      {data.excerpt && <p className="line-clamp-2 text-small text-text-secondary">{data.excerpt}</p>}
      <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.key} className="flex min-w-0 flex-col gap-1">
            <dt className="text-xsmall text-text-muted">{fact.label}</dt>
            <dd className={`font-semibold ${fact.accent ? "text-accent-text" : "text-text"}`}>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex flex-wrap gap-3">
        <Link href={data.href} data-stretched-link className={cn(buttonVariants(), SPOTLIGHT_STRETCHED_LINK_CLASS)}>
          {t("viewDetail")}
          <span className="sr-only">: {data.title}</span>
        </Link>
        <Link href={`${data.href}#lead-form`} className={cn(buttonVariants({ variant: "outline" }), SPOTLIGHT_SECONDARY_LINK_CLASS)}>
          {t("list.spotlight.consult")}
          <span className="sr-only">: {data.title}</span>
        </Link>
      </div>
    </div>
  );
}
