import { useTranslations } from "next-intl";
import { DETAIL_ASIDE_CARD_CLASS } from "@/components/detail/DetailLayout";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { Phone } from "@/components/icons";
import { LeadForm } from "@/components/leads/LeadForm";
import { Button } from "@/components/ui/button";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { cn } from "@/lib/utils";

/** Id tiêu đề form trong thẻ liên hệ: nhãn cho `<aside>` của `DetailLayout`. */
export const POST_CONTACT_HEADING_ID = "post-consult-heading";

interface PostContactBoxProps {
  /** Id tin đăng: nguồn của lead (`property_post`). */
  postId: string;
  hotline?: { label: string; telHref: string };
}

/**
 * Thẻ liên hệ của S09: cùng khung thẻ trắng viền + bóng dính ≥ lg như `SaleContactBox` (`DETAIL_ASIDE_CARD_CLASS`): nút gọi hotline chung (nếu có)
 * → vùng form lead (`LeadFormSlot` + `LeadForm source=property_post`; tiêu đề giống nhau cho mọi trạng thái, kể cả ưu đãi đã kết thúc). Server Component.
 */
export function PostContactBox({ postId, hotline }: PostContactBoxProps) {
  const t = useTranslations("page.posts.leadForm");
  const turnstileSiteKey = readTurnstileSiteKey();
  return (
    <div className={cn("flex flex-col gap-6", DETAIL_ASIDE_CARD_CLASS)}>
      {hotline && (
        <Button asChild size="lg" variant="dark" className="w-full normal-case">
          <a href={hotline.telHref}>
            <Phone size={20} weight="fill" aria-hidden="true" />
            {t("callHotline", { phone: hotline.label })}
          </a>
        </Button>
      )}
      <LeadFormSlot title={t("title")} headingId={POST_CONTACT_HEADING_ID} className="scroll-mt-[calc(var(--sticky-top)+4.5rem)] bg-transparent p-0 lg:p-0">
        <LeadForm source="property_post" sourceId={postId} {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(hotline ? { hotline } : {})} />
      </LeadFormSlot>
    </div>
  );
}
