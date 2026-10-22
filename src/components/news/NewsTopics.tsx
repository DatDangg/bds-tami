import { useTranslations } from "next-intl";
import { useId } from "react";
import { PendingLink } from "@/components/layout/PendingRegion";
import { cn } from "@/lib/utils";

interface NewsTopicsProps {
  /** ≤ 12 thẻ dùng nhiều nhất (`listTopNewsTags`); `/en` luôn rỗng (tags chưa có bản EN). */
  tags: readonly string[];
  /** Trang danh sách gốc (`/tin-tuc`), đích của link `?tag=`. */
  listPath: string;
  /** Thẻ đang lọc (`?tag=`), chip đó `aria-current`. */
  currentTag?: string | undefined;
}

/**
 * Khối "Chủ đề" ở cột phải `/tin-tuc` (BL-054): chip `#tag` là link thật `?tag=<tag>` (chạy không JS, về trang 1, bỏ `q` / `sort`).
 * Chip viền token như hàng chip danh mục (`CategoryChipList`), thẻ đang lọc nền `primary-soft`. Rỗng → không render. Server Component.
 */
export function NewsTopics({ tags, listPath, currentTag }: NewsTopicsProps) {
  const t = useTranslations("page.news.v2");
  const headingId = useId();
  if (tags.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-border bg-surface p-5">
      <h2 id={headingId} className="font-display text-h4">
        {t("topics")}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <PendingLink
              href={`${listPath}?${new URLSearchParams({ tag }).toString()}`}
              aria-current={tag === currentTag ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-3.5 text-small transition-colors lg:min-h-9",
                tag === currentTag ? "border-primary bg-primary-soft text-text" : "border-border text-text-secondary hover:border-input-border hover:text-text",
              )}
            >
              #{tag}
            </PendingLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
