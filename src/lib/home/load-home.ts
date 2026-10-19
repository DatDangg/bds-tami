import "server-only";

import config from "@payload-config";
import { getPayload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Homepage, SiteSetting } from "../../payload-types";
import { buildContactPageView } from "../content/contact-view";
import { publicPath } from "../content/content-paths";
import { getHomepage, getSiteSettings } from "../content/get-globals";
import { loadSiteIdentity } from "../content/site-identity";
import { logger } from "../logger";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "../seo/json-ld";
import { absoluteUrl, getSiteUrl } from "../seo/site-url";
import { loadHomeDocs } from "./home-queries";
import { buildHomeView, type HomeView, visibleBlockKeys } from "./home-view";

export interface HomePageData {
  view: HomeView;
  siteName: string;
  /** JSON-LD `Organization` + `WebSite`; rỗng khi chưa cấu hình URL gốc của site (JSON-LD cần URL tuyệt đối). */
  structuredData: object[];
}

const EMPTY_VIEW: HomeView = { hero: [], heroSearch: null, blocks: [] };

async function readOrNull<T>(name: string, read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    // DB tắt lúc `next build`: trang vẫn dựng (rỗng), tối đa 60s sau ISR dựng lại với dữ liệu thật (cùng cách `load-shell`).
    logger.warn({ err: error, global: name }, "Không đọc được global cho trang chủ");
    return null;
  }
}

function buildStructuredData(locale: Locale, siteName: string, logoUrl: string | null | undefined, settings: SiteSetting | null): object[] {
  const siteUrl = getSiteUrl();
  const homeUrl = absoluteUrl(publicPath("/", locale), siteUrl);
  if (!siteUrl || !homeUrl) return [];
  const { contact, socials } = buildContactPageView(settings);
  const logo = logoUrl ? absoluteUrl(logoUrl, siteUrl) : undefined;
  return [
    buildOrganizationJsonLd({
      name: siteName,
      siteUrl,
      ...(logo ? { logoUrl: logo } : {}),
      sameAs: socials.map((social) => social.url),
      telephone: contact.hotline?.label ?? null,
      email: contact.email ?? null,
      address: contact.address ?? null,
    }),
    buildWebSiteJsonLd({ locale, name: siteName, siteUrl: homeUrl }),
  ];
}

/**
 * Dữ liệu trang chủ cho một ngôn ngữ: global `homepage` (cache theo tag), bản ghi của các khối sẽ hiển thị (đọc như khách, `/en` chỉ bản có EN)
 * và JSON-LD. Global lỗi → view rỗng (trang vẫn có `h1` ẩn + header/footer) thay vì làm hỏng cả trang.
 */
export async function loadHomePage(locale: Locale, now: Date = new Date()): Promise<HomePageData> {
  const [homepage, settings, identity] = await Promise.all([
    readOrNull("homepage", () => getHomepage(locale)),
    readOrNull("site-settings", () => getSiteSettings(locale)),
    loadSiteIdentity(locale),
  ]);
  const structuredData = buildStructuredData(locale, identity.siteName, identity.logo?.url, settings);
  if (!homepage) return { view: EMPTY_VIEW, siteName: identity.siteName, structuredData };
  const docs = await readOrNull("homepage-content", async () => loadHomeDocs(await getPayload({ config }), locale, homepage, visibleBlockKeys(homepage), now));
  // Truy vấn bản ghi lỗi: các khối danh sách tự ẩn, hero/Về TAMI/CTA vẫn hiện.
  const view = buildHomeView(homepage, docs ?? { projects: [], services: [], offers: [], chipProjects: [], provinces: [], rentalTabs: [], news: [] }, locale, now);
  return { view, siteName: identity.siteName, structuredData };
}

/** `seo` của global `homepage` cho metadata; lỗi đọc thì `null` (dùng tiêu đề/mô tả mặc định). */
export async function loadHomepageSeo(locale: Locale): Promise<Homepage["seo"] | null> {
  const homepage = await readOrNull("homepage", () => getHomepage(locale));
  return homepage?.seo ?? null;
}
