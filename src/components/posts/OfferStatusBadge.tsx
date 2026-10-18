import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { OfferBadge } from "@/lib/posts/post-view";

/** Badge trạng thái ưu đãi dùng chung thẻ và khối ưu đãi: "Đã kết thúc" (muted) hoặc "Còn n ngày" / "Hết hạn hôm nay" (warning). */
export function OfferStatusBadge({ badge, className }: { badge: OfferBadge; className?: string }) {
  const t = useTranslations("page.posts");
  if (badge.kind === "ended") {
    return (
      <Badge variant="muted" className={className}>
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
