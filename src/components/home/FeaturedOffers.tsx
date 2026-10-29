import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { PostCardData } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import { OffersSlider } from "./OffersSlider";
import { SectionHeading } from "./SectionHeading";
import { SectionMoreLink } from "./SectionMoreLink";

/** "Mua từ chủ đầu tư" (design-spec S01.5, BL-020): tiêu đề giữa kèm gạch, slider thẻ ưu đãi (client), "Xem thêm" → Đăng tin BĐS. Bài hết hạn đã bị lọc ở view model (BR-06). */
export function FeaturedOffers({ title, cards }: { title: string; cards: PostCardData[] }) {
  const t = useTranslations("page.home.offers");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section className="bg-bg-alt py-section">
      <div className="mx-auto w-full max-w-container px-gutter">
        <SectionHeading id={headingId} title={title} />
        <OffersSlider cards={cards} labelledBy={headingId} />
        <div className="mt-8 flex justify-center">
          <SectionMoreLink href={resolveNavLink("property-posts", locale)?.href ?? "/"}>{t("viewMore")}</SectionMoreLink>
        </div>
      </div>
    </section>
  );
}
