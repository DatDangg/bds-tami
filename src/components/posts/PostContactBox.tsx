import { useTranslations } from "next-intl";
import { DetailContactAside } from "@/components/detail/DetailContactAside";
import { LeadForm } from "@/components/leads/LeadForm";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";

/** Id tiêu đề form trong thẻ liên hệ: nhãn cho `<aside>` của khung chi tiết. */
export const POST_CONTACT_HEADING_ID = "post-consult-heading";

interface PostContactBoxProps {
  /** Id tin đăng: nguồn của lead (`property_post`). */
  postId: string;
  hotline?: { label: string; telHref: string };
}

/**
 * Cột liên hệ chi tiết Tin BĐS (BL-052, cùng `DetailContactAside` với chi tiết Dự án / Cho thuê): thẻ trắng dính chứa form lead `source=property_post` duy nhất của trang
 * (`#lead-form`, tiêu đề "Nhận tư vấn" cho mọi trạng thái, kể cả ưu đãi đã kết thúc) → khối Hotline nền tối "Gọi ngay" (`tel:`; không có hotline → ẩn). Server Component.
 */
export function PostContactBox({ postId, hotline }: PostContactBoxProps) {
  const t = useTranslations("page.posts.leadForm");
  const turnstileSiteKey = readTurnstileSiteKey();
  return (
    <DetailContactAside title={t("title")} headingId={POST_CONTACT_HEADING_ID} hotline={hotline ?? null}>
      <LeadForm layout="compact" source="property_post" sourceId={postId} {...(turnstileSiteKey ? { turnstileSiteKey } : {})} {...(hotline ? { hotline } : {})} />
    </DetailContactAside>
  );
}
