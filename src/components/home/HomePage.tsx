import { JsonLd } from "@/components/seo/JsonLd";
import { loadHomePage } from "@/lib/home/load-home";
import type { Locale } from "@/i18n/routing";
import { HomeBlocks } from "./HomeBlocks";

/** Trang chủ S01 (`/`, `/en`): dữ liệu từ global `homepage` + bản ghi các khối, JSON-LD Organization/WebSite. Render server, ISR theo layout. */
export async function HomePage({ locale }: { locale: Locale }) {
  const { view, siteName, structuredData } = await loadHomePage(locale);
  return (
    <>
      <HomeBlocks view={view} siteName={siteName} />
      {structuredData.length > 0 && <JsonLd data={structuredData} />}
    </>
  );
}
