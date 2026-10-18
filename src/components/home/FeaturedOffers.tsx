import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { PostCardData } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";

/** Ưu đãi nổi bật (design-spec S01.5): tiêu đề giữa + "Xem tất cả" → Đăng tin BĐS, lưới thẻ 1/2/3 cột. Bài hết hạn đã bị lọc ở view model (BR-06). */
export function FeaturedOffers({ title, cards }: { title: string; cards: PostCardData[] }) {
  const t = useTranslations("page.home.offers");
  const locale = useLocale() as Locale;
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="bg-bg-alt py-section">
      <div className="mx-auto w-full max-w-container px-gutter">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 id={headingId} className="font-display text-h1 uppercase">
            {title}
          </h2>
          <Button asChild variant="ghost">
            <Link href={resolveNavLink("property-posts", locale)?.href ?? "/"}>{t("viewAll")}</Link>
          </Button>
        </div>
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={card.id}>
              <PostCard data={card} headingLevel="h3" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
