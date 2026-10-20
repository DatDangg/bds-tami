import { useTranslations } from "next-intl";
import type { StrengthsView } from "@/lib/home/home-view";
import { STRENGTH_ICON_COMPONENTS } from "./strength-icons";

/**
 * Điểm mạnh (SPECIFICATIONS F1 BL-044): dải 2–6 mục ngay dưới ô tìm kiếm, nền `bg`; ≥ lg 4 cột, md 2 cột, < md 1 cột. Mỗi mục: ô tròn 56px `primary-soft`
 * chứa icon Phosphor (`accent-text` ≈ 3,5:1 trên `primary-soft`, 24px; ô tròn đủ tách khỏi nền `bg` để nhận ra như mockup) + tiêu đề `h3` + mô tả muted. Không có `h2`: vùng mang `aria-label` i18n. Server Component.
 */
export function StrengthsBlock({ block }: { block: StrengthsView }) {
  const t = useTranslations("page.home.strengths");
  return (
    <section aria-label={t("region")} className="bg-bg py-8 md:py-10">
      <ul className="mx-auto grid w-full max-w-container grid-cols-1 gap-6 px-gutter md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {block.items.map((item, index) => {
          const Icon = STRENGTH_ICON_COMPONENTS[item.icon];
          return (
            // Index trong key: admin có thể nhập hai mục giống hệt nhau (danh sách tĩnh, không sắp xếp lại ở client).
            <li key={`${index}-${item.icon}`} className="flex items-center gap-4">
              <span aria-hidden="true" className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-accent-text">
                <Icon size={24} />
              </span>
              <div className="min-w-0">
                <h3 className="text-h4 font-semibold text-text">{item.title}</h3>
                {item.description && <p className="text-small text-text-muted">{item.description}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
