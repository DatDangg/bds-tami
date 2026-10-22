"use client";

import { useTranslations } from "next-intl";
import Form from "next/form";
import { useListingFilterNav } from "@/components/listing/use-listing-filter-nav";
import { OptionSelect } from "@/components/ui/option-select";
import { Button } from "@/components/ui/button";
import { DEFAULT_NEWS_SORT, NEWS_SORT_VALUES, type NewsSortKey } from "@/lib/news/news-filters";

interface NewsSortControlProps {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ). */
  path: string;
  /** Tham số đang có hiệu lực (`q`, `tag`, `sort`) — giữ khi đổi sắp xếp, bỏ `page`. */
  current: Record<string, string>;
  value: NewsSortKey;
}

/**
 * Ô "Sắp xếp theo" của "Bài viết mới nhất" (BL-054): Mới nhất (mặc định, không lên URL) / Cũ nhất. Cùng `OptionSelect variant="chip"` của ô sắp xếp BL-052;
 * `progressive` nên không JS vẫn là `<select>` gốc trong form GET (giữ `q` / `tag` bằng input ẩn) + nút "Áp dụng" trong `<noscript>`.
 * Có JS: đổi là điều hướng ngay (`useListingFilterNav`: giữ tham số khác, về trang 1, không cuộn, báo chờ cho `PendingRegion`).
 */
export function NewsSortControl({ path, current, value }: NewsSortControlProps) {
  const t = useTranslations("page.news.v2");
  const { navigate } = useListingFilterNav(path, current);
  return (
    <Form action={path} className="flex min-w-0 items-center gap-3">
      {Object.entries(current).map(([name, paramValue]) => (name === "sort" ? null : <input key={name} type="hidden" name={name} value={paramValue} />))}
      <label htmlFor="news-sort" className="text-small font-semibold max-sm:sr-only">
        {t("sortBy")}
      </label>
      <OptionSelect
        id="news-sort"
        name="sort"
        progressive
        variant="chip"
        value={value}
        onValueChange={(sort) => navigate({ sort: sort === DEFAULT_NEWS_SORT ? null : sort })}
        options={NEWS_SORT_VALUES.map((sort) => ({ value: sort, label: t(`sort.${sort}`) }))}
        className="w-40 bg-surface"
      />
      <noscript>
        <Button type="submit" variant="outline" size="sm">
          {t("sortApply")}
        </Button>
      </noscript>
    </Form>
  );
}
