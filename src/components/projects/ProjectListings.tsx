import { useTranslations } from "next-intl";
import { useId } from "react";
import { PostCard } from "@/components/posts/PostCard";
import { RentalCard } from "@/components/rentals/RentalCard";
import { DetailSection } from "@/components/detail/DetailSection";
import { SECTION_DOM_ID } from "@/lib/projects/project-detail-view";
import type { PostCardData } from "@/lib/posts/post-view";
import type { RentalCardData } from "@/lib/rentals/rental-view";

export interface ProjectListingCards {
  rentals: RentalCardData[];
  posts: PostCardData[];
}

const GRID_CLASS = "grid gap-x-6 gap-y-8 @md/detail:grid-cols-2";

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const labelId = useId();
  return (
    <div>
      {/* Nhãn nhóm không phải heading: tiêu đề thẻ ở h3 ngay dưới h2 của khối, không nhảy/đảo cấp. */}
      <p id={labelId} className="mb-4 font-semibold">
        {label}
      </p>
      <ul aria-labelledby={labelId} className={GRID_CLASS}>
        {children}
      </ul>
    </div>
  );
}

/**
 * "Tin liên quan" của chi tiết dự án (BL-020 P4): nhóm Cho thuê + nhóm Tin BĐS thuộc dự án, thẻ biến thể `listing` BL-052 dùng chung với `/cho-thue`, `/tin-bds` (lưới 2 cột ≥ sm
 * trong cột chính). Nhóm trống ẩn; cả hai trống thì không render khối (và trang không đưa mục vào thanh mục con). Ảnh thẻ lazy (LCP vẫn là ảnh hero).
 */
export function ProjectListings({ rentals, posts }: ProjectListingCards) {
  const t = useTranslations("page.projectDetail.listings");
  const tEyebrow = useTranslations("page.detail.eyebrow");
  if (rentals.length === 0 && posts.length === 0) return null;
  return (
    <DetailSection id={SECTION_DOM_ID.listings} eyebrow={tEyebrow("listings")} title={t("title")}>
      <div className="flex flex-col gap-10">
        {rentals.length > 0 && (
          <Group label={t("rentals")}>
            {rentals.map((card) => (
              <li key={card.id}>
                <RentalCard data={card} headingLevel={3} imageSizes="(min-width: 1280px) 390px, (min-width: 640px) 45vw, 100vw" />
              </li>
            ))}
          </Group>
        )}
        {posts.length > 0 && (
          <Group label={t("posts")}>
            {posts.map((card) => (
              <li key={card.id}>
                <PostCard data={card} headingLevel="h3" imageSizes="(min-width: 1280px) 340px, (min-width: 640px) 45vw, 100vw" />
              </li>
            ))}
          </Group>
        )}
      </div>
    </DetailSection>
  );
}
