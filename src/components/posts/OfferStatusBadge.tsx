import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { OfferBadge } from "@/lib/posts/post-view";

/**
 * Badge trạng thái ưu đãi dùng chung thẻ và khối ưu đãi: "Đã kết thúc" (muted) hoặc "Còn n ngày" / "Hết hạn hôm nay" (warning).
 * `decorative` → ẩn khỏi trình đọc màn hình khi cùng thẻ đã có nhãn trạng thái đọc được (thẻ voucher hết hạn: không đọc "Đã kết thúc" 2 lần).
 */
export function OfferStatusBadge({ badge, className, decorative = false }: { badge: OfferBadge; className?: string; decorative?: boolean }) {
  const t = useTranslations("page.posts");
  if (badge.kind === "ended") {
    return (
      <Badge variant="muted" className={className} {...(decorative ? { "aria-hidden": true } : {})}>
        {t("endedBadge")}
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className={className}>
      {badge.daysLeft === 0 ? t("endsToday") : t("daysLeft", { count: badge.daysLeft })}
    </Badge>
  );
}
