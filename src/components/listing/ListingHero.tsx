import { useTranslations } from "next-intl";
import Form from "next/form";
import { type ReactNode, useId } from "react";
import { ArrowRight, MagnifyingGlass } from "@/components/icons";
import { KeywordSearchInput } from "@/components/listing/KeywordSearchInput";
import { PageHero } from "@/components/layout/PageHero";
import { FormPendingMarker, PendingLink } from "@/components/layout/PendingRegion";
import type { MediaImage } from "@/components/media/ResponsiveImage";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ListingHeroSearch {
  /** Đường dẫn của chính trang (đã có tiền tố ngôn ngữ): đích form GET + gốc của chip "Tìm nhanh". */
  action: string;
  /** Từ khoá đang trên URL (`?q=`). */
  value?: string;
  /** Gợi ý trong ô, riêng từng màn (vd "Tên dự án, khu vực, chủ đầu tư…"). */
  placeholder: string;
  /** Tham số khác phải giữ khi gửi từ khoá (vd danh mục khoá bằng query, `sort`). Giá trị rỗng bị bỏ. Không truyền khoá `q` ở đây. */
  preservedParams?: Record<string, string>;
}

interface ListingHeroProps {
  /** `h1` dòng 1 (mỗi trang đúng một `h1`). */
  title: string;
  /** `h1` dòng 2, màu nhấn. */
  titleAccent?: string;
  eyebrow?: string;
  description?: string;
  /** Ảnh `pageHeroes` của màn; không có → nền tối token cùng chiều cao. */
  image?: MediaImage;
  /** Breadcrumb `variant="overlay"` đặt trên ảnh. */
  breadcrumb?: ReactNode;
  /** Ô tìm từ khoá `q` (form GET, chạy không JS). Không truyền → hero chỉ có chữ (vd trang Liên hệ / Tuyển dụng của BL-054). */
  search?: ListingHeroSearch;
  /** Từ khoá "Tìm nhanh" admin nhập (mỗi chip = link `?q=<từ khoá>`); rỗng → ẩn cả hàng. Chỉ hiện khi có `search`. */
  quickSearch?: readonly string[];
}

/** Link chip "Tìm nhanh": chỉ mang `q` (bỏ mọi lọc khác) như spec BL-052. */
function quickSearchHref(action: string, keyword: string): string {
  return `${action}?${new URLSearchParams({ q: keyword }).toString()}`;
}

/**
 * Hero trang danh sách (BL-052, design `list-du-an`): `PageHero` cỡ `list` (chiều cao tối thiểu cố định, ảnh `priority`, scrim token, breadcrumb trên ảnh)
 * + eyebrow → `h1` 2 dòng → mô tả → ô tìm `q` + "Tìm kiếm" (`next/form` GET: có JS thì điều hướng client, không JS thì form GET thường) → hàng "Tìm nhanh".
 * Dùng chung cho Dự án / Cho thuê / Tin BĐS và BL-054. Server Component.
 */
export function ListingHero({ title, titleAccent, eyebrow, description, image, breadcrumb, search, quickSearch = [] }: ListingHeroProps) {
  const t = useTranslations("page.listing.hero");
  const quickId = useId();
  const quick = quickSearch.map((keyword) => keyword.trim()).filter((keyword) => keyword !== "");
  return (
    <PageHero size="list" overlap={false} title={title} titleAccent={titleAccent} eyebrow={eyebrow} description={description} image={image} breadcrumb={breadcrumb}>
      {search && (
        <div className="mt-3 flex w-full max-w-2xl flex-col gap-4">
          {/* Thẻ tìm trắng trên ảnh: hero là `.theme-dark-block` (token surface/text bị đổi sang tối) nên ô dùng token cố định `on-dark` / `dark`. `scroll={false}` (BL-092): tìm xong không cuộn về đầu trang. */}
          <Form action={search.action} scroll={false} role="search" aria-label={t("searchLabel")} className="flex w-full flex-col gap-2 rounded-[28px] bg-on-dark p-1.5 sm:flex-row sm:items-center sm:rounded-pill">
            {Object.entries(search.preservedParams ?? {}).map(([name, value]) => (value.trim() === "" || name === "q" ? null : <input key={name} type="hidden" name={name} value={value} />))}
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-dark/60" />
              {/* Ô không remount khi `q` đổi (BL-092): Enter giữ focus; chip / back đổi `q` thì ô vẫn nạp lại giá trị mới. */}
              <KeywordSearchInput
                keyword={search.value ?? ""}
                name="q"
                type="search"
                maxLength={100}
                autoComplete="off"
                aria-label={t("keywordLabel")}
                placeholder={search.placeholder}
                className="h-12 rounded-pill border-transparent bg-transparent pl-12 text-dark placeholder:text-dark/60 focus-visible:outline-dark"
              />
            </div>
            <Button type="submit" className="h-12 px-6">
              {t("submit")}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <FormPendingMarker />
          </Form>
          {quick.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p id={quickId} className="text-small font-semibold text-on-dark">
                {t("quickSearch")}
              </p>
              <ul aria-labelledby={quickId} className="flex flex-wrap gap-2">
                {quick.map((keyword) => (
                  <li key={keyword}>
                    <PendingLink href={quickSearchHref(search.action, keyword)} className={cn(buttonVariants({ variant: "chip", size: "sm" }), "h-11 normal-case lg:h-9")}>
                      {keyword}
                    </PendingLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PageHero>
  );
}
