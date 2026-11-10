import { useTranslations } from "next-intl";
import { CopyEmailButton } from "@/components/careers/CopyEmailButton";
import { CtaBanner } from "@/components/layout/CtaBanner";
import type { MediaImage } from "@/components/media/ResponsiveImage";

interface CareersCvBannerProps {
  /** Email nhận CV (`site-settings.email`, cùng đích "Gửi CV tới <email>" của trạng thái trống). Trang chỉ render banner khi có email (BL-120). */
  email: string;
  /** Ảnh nền: ảnh hero Tuyển dụng (`pageHeroes.careers`); thiếu → nền tối token. */
  image?: MediaImage;
}

/**
 * Banner "Chưa tìm thấy vị trí phù hợp? — Gửi CV ngay" (BL-054, design `tuyen-dung.webp`): `CtaBanner` dùng chung (canh trái, cỡ compact, eyebrow),
 * nút `mailto:` email tuyển dụng — giữ hành vi gửi CV hiện có (không form mới). Đặt trước banner tư vấn. Server Component.
 */
export function CareersCvBanner({ email, image }: CareersCvBannerProps) {
  const t = useTranslations("page.careers.v2");
  return (
    <CtaBanner
      eyebrow={t("cvEyebrow")}
      title={t("cvTitle")}
      description={t("cvDescription")}
      actionLabel={t("cvCta")}
      actionHref={`mailto:${email}`}
      extraAction={<CopyEmailButton email={email} tone="onDark" />}
      backgroundImage={image ?? null}
      align="start"
      size="compact"
    />
  );
}
