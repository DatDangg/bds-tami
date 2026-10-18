import { useTranslations } from "next-intl";
import Link from "next/link";
import { MagnifyingGlass } from "@/components/icons";
import { PendingLink } from "@/components/layout/PendingRegion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** `filtered`: có bộ lọc đang bật nhưng không khớp → nút xoá bộ lọc. `empty`: mục chưa có bài → link về danh sách cha. */
  variant: "filtered" | "empty";
  /** Ghi đè tiêu đề mặc định (vd "Chưa có dự án phù hợp." ở S02). */
  title?: string;
  description?: string;
  /** `filtered`: URL của chính trang này không kèm bộ lọc (link thật, không cần JS). */
  clearFiltersHref?: string;
  /** `empty`: danh sách cha. */
  backHref?: string;
  /** `filtered`: link "Nhận tư vấn" tới form liên hệ. */
  adviceHref?: string;
}

/** Trạng thái trống (design-spec §3.9). Giữ nguyên bố cục lưới: đặt trong khung của lưới, thanh lọc vẫn hiện phía trên. */
export function EmptyState({ variant, title, description, clearFiltersHref, backHref, adviceHref }: EmptyStateProps) {
  const t = useTranslations("page.empty");
  const filtered = variant === "filtered";
  return (
    <div role="status" className="col-span-full flex flex-col items-center gap-4 px-4 py-section-tight text-center">
      <MagnifyingGlass size={40} aria-hidden="true" className="text-text-muted" />
      <h2 className="text-h3 font-semibold">{title ?? t(filtered ? "filteredTitle" : "emptyTitle")}</h2>
      {(description ?? filtered) && <p className="max-w-[60ch] text-body text-text-secondary">{description ?? t("filteredDescription")}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {filtered && clearFiltersHref && (
          <Button asChild variant="outline">
            <PendingLink href={clearFiltersHref}>{t("clearFilters")}</PendingLink>
          </Button>
        )}
        {filtered && adviceHref && (
          <Button asChild variant="ghost">
            <Link href={adviceHref}>{t("getAdvice")}</Link>
          </Button>
        )}
        {!filtered && backHref && (
          <Button asChild variant="outline">
            <Link href={backHref}>{t("backToList")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
