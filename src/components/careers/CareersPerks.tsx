import { useTranslations } from "next-intl";
import { useId } from "react";
import { STRENGTH_ICON_COMPONENTS } from "@/components/home/strength-icons";
import type { CareersPerkView } from "@/lib/content/careers-perks";

/**
 * "Môi trường để bạn phát triển" (BL-054, design `tuyen-dung.webp`): đầu khối căn giữa (eyebrow, `h2` + phần nhấn, gạch ngắn — như "Dự án nổi bật" trang chủ)
 * + phúc lợi `careersPerks` (loader ẩn khi < 2 mục): ô tròn icon → `h3` → mô tả; ≥ lg 4 cột ngăn bằng vạch dọc, md 2 cột, < md 1 cột. Server Component.
 */
export function CareersPerks({ perks }: { perks: readonly CareersPerkView[] }) {
  const t = useTranslations("page.careers.v2");
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="bg-bg pt-section-tight pb-4">
      <div className="mx-auto flex w-full max-w-container flex-col gap-10 px-gutter">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">{t("perksEyebrow")}</p>
          <h2 id={headingId} className="font-display text-h2 text-balance">
            {t("perksTitle")} <span className="text-accent-text">{t("perksTitleAccent")}</span>
          </h2>
          <span aria-hidden="true" className="h-0.5 w-12 bg-primary" />
        </div>
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border">
          {perks.map((perk, index) => {
            const Icon = STRENGTH_ICON_COMPONENTS[perk.icon];
            return (
              // Index trong key: admin có thể nhập hai mục giống hệt nhau (danh sách tĩnh).
              <li key={`${index}-${perk.icon}`} className="flex flex-col items-start gap-3 lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <span aria-hidden="true" className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
                  <Icon size={26} />
                </span>
                <h3 className="text-h4 font-semibold text-text">{perk.title}</h3>
                {perk.description && <p className="text-small text-text-secondary">{perk.description}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
