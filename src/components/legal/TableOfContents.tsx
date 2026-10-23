import { useTranslations } from "next-intl";
import type { SectionHeading } from "@/lib/content/section-headings";

const LINK_CLASS = "inline-flex min-h-11 items-center text-small text-text-secondary transition-colors duration-(--duration-fast) hover:text-text";

function Links({ headings }: { headings: SectionHeading[] }) {
  return (
    <ol className="flex flex-col">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a href={`#${heading.id}`} className={LINK_CLASS}>
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Mục lục trang pháp lý (design-spec S16, mockup `.toc` BL-045), sinh từ `h2` (`collectSectionHeadings`): từ lg là thẻ trắng cột trái dính, dưới lg là accordion
 * "Mục lục" đầu bài (`<details>` gốc, không cần JS). Hai bản cùng danh sách link; bản không hiển thị bị `display: none` nên không
 * lặp trong cây trợ năng. Ẩn khi in. Server Component.
 */
export function TableOfContents({ headings }: { headings: SectionHeading[] }) {
  const t = useTranslations("page.legal");
  if (headings.length === 0) return null;
  return (
    <>
      <details className="mb-6 rounded-xl bg-surface lg:hidden print:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center px-5 font-semibold">{t("tocTitle")}</summary>
        <nav aria-label={t("tocTitle")} className="px-5 pb-3">
          <Links headings={headings} />
        </nav>
      </details>
      <aside className="hidden lg:block print:hidden">
        <nav aria-label={t("tocTitle")} className="sticky top-[calc(var(--header-offset)+1rem)] flex flex-col gap-2 rounded-xl bg-surface p-6">
          <p className="font-semibold">{t("tocTitle")}</p>
          <Links headings={headings} />
        </nav>
      </aside>
    </>
  );
}
