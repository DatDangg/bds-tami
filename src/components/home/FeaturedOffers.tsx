import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { PostCardData } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";
import { OffersSlider } from "./OffersSlider";

/** "Mua từ chủ đầu tư" (design-spec S01.5, BL-020): tiêu đề giữa, slider thẻ ưu đãi (client), "Xem thêm" → Đăng tin BĐS. Bài hết hạn đã bị lọc ở view model (BR-06). */
export function FeaturedOffers({ title, cards }: { title: string; cards: PostCardData[] }) {
  const t = useTranslations("page.home.offers");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section className="bg-bg-alt py-section">
      <div className="mx-auto w-full max-w-container px-gutter">
        <h2 id={headingId} className="mb-10 text-center font-display text-h2">
          {title}
        </h2>
        <OffersSlider cards={cards} labelledBy={headingId} />
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline">
            <Link href={resolveNavLink("property-posts", locale)?.href ?? "/"}>{t("viewMore")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
