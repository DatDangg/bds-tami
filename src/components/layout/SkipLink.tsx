import { useTranslations } from "next-intl";

/** Phần tử focus đầu tiên của trang (design-spec §1.4). Đích `#main` là thẻ `<main>` ở layout. */
export function SkipLink() {
  const t = useTranslations("layout");
  return (
    <a
      href="#main"
      className="fixed top-2 left-2 z-(--z-toast) inline-flex min-h-11 -translate-y-[200%] items-center rounded-sm bg-primary px-4 py-2 text-button font-semibold text-primary-foreground focus:translate-y-0"
    >
      {t("skipToContent")}
    </a>
  );
}
