import { useTranslations } from "next-intl";
import { CtaBanner as DarkCtaBanner } from "@/components/layout/CtaBanner";
import type { CtaBannerView } from "@/lib/home/home-view";

/** Khối 7 của trang chủ: banner CTA dùng chung (`layout/CtaBanner`) + chuỗi mặc định "Nhận tư vấn" khi admin để trống nhãn nút; ảnh tràn viền + nút phụ lấy từ CMS. */
export function CtaBanner({ block }: { block: CtaBannerView }) {
  const t = useTranslations("page.cta");
  return (
    <DarkCtaBanner
      title={block.title}
      {...(block.description ? { description: block.description } : {})}
      actionLabel={block.label ?? t("getAdvice")}
      actionHref={block.href}
      backgroundImage={block.image}
      align="start"
      size="compact"
      {...(block.secondary ? { secondaryLabel: block.secondary.label, secondaryHref: block.secondary.href } : {})}
    />
  );
}
