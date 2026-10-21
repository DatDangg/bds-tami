import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResultsBarProps {
  /** Số + danh từ đã định dạng / số nhiều bởi trang (vd "12 dự án", "1 project"); in đậm, nối "phù hợp". */
  countLabel: string;
  /** Ô sắp xếp (vd `ProjectSortControl`, tự mang nhãn "Sắp xếp theo"). */
  sort?: ReactNode;
  /** Nút / chip đi kèm bên trái (vd nút `FilterSheet` < lg). */
  leading?: ReactNode;
  className?: string;
}

/** Hàng "N … phù hợp" + sắp xếp phía trên lưới danh sách (BL-052). Số kết quả `aria-live="polite"` để đọc lại khi lọc đổi. Server Component. */
export function ResultsBar({ countLabel, sort, leading, className }: ResultsBarProps) {
  const t = useTranslations("page.listing");
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <p aria-live="polite" className="text-body text-text-secondary">
          {t.rich("resultsMatching", { label: countLabel, strong: (chunks) => <strong className="font-semibold text-text">{chunks}</strong> })}
        </p>
      </div>
      {sort}
    </div>
  );
}
