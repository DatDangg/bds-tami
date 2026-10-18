import "server-only";

import config from "@payload-config";
import { getPayload, type Payload } from "payload";

import { getSiteSettings } from "../content/get-globals";
import { loadSiteIdentity } from "../content/site-identity";
import { publicPath } from "../content/content-paths";
import { findPublicList, type PublicCollectionSlug } from "../content/public-queries";
import { logger } from "../logger";
import { cachedFileResponse, hasQueryString, notFoundFileResponse, unavailableFileResponse } from "./file-route-response";
import { INDEXABLE_WHERE, renderLlmsTxt, type LlmsLink } from "./llms-txt";
import { getSiteUrl } from "./site-url";

interface TitledDoc {
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  excerpt?: string | null;
}

const LATEST_PER_COLLECTION = 5;

/** Bản ghi công khai mới nhất của một collection → link (tiêu đề, URL tuyệt đối, mô tả ngắn). Bản ghi thiếu tiêu đề/slug bị bỏ, không bịa link. */
async function latestLinks(payload: Payload, collection: PublicCollectionSlug, route: "/du-an/[slug]" | "/tin-tuc/[slug]" | "/dich-vu/[slug]" | "/tin-bds/[slug]", siteUrl: string): Promise<LlmsLink[]> {
  const result = await findPublicList<TitledDoc>(payload, collection, "vi", {
    where: INDEXABLE_WHERE,
    limit: LATEST_PER_COLLECTION,
    sort: "-updatedAt",
    depth: 0,
    select: { title: true, slug: true, summary: true, excerpt: true },
  });
  return result.docs.flatMap((doc) =>
    doc.title && doc.slug
      ? [{ title: doc.title, url: new URL(publicPath(route, "vi", { slug: doc.slug }), siteUrl).toString(), description: doc.summary ?? doc.excerpt }]
      : [],
  );
}

const absolute = (path: string, siteUrl: string) => new URL(path, siteUrl).toString();

/** `GET /llms.txt`: mục lục cho LLM, sinh từ site-settings + nội dung công khai thật (tối đa ~25 link). */
export async function llmsTxtResponse(request: Request): Promise<Response> {
  if (hasQueryString(request)) return notFoundFileResponse();
  const siteUrl = getSiteUrl();
  if (!siteUrl) return unavailableFileResponse("llms.txt chưa sẵn sàng");
  try {
    const payload = await getPayload({ config });
    const settings = await getSiteSettings("vi");
    const { siteName } = await loadSiteIdentity("vi");
    const [projects, services, news] = await Promise.all([
      latestLinks(payload, "projects", "/du-an/[slug]", siteUrl),
      latestLinks(payload, "services", "/dich-vu/[slug]", siteUrl),
      latestLinks(payload, "news", "/tin-tuc/[slug]", siteUrl),
    ]);
    const body = renderLlmsTxt({
      siteName,
      summary: `${siteName}: dự án bất động sản, nhà cho thuê, tin tức thị trường và cơ hội tuyển dụng, bằng tiếng Việt và tiếng Anh.`,
      contactLines: [
        settings.hotline ? `Hotline: ${settings.hotline}` : "",
        settings.email ? `Email: ${settings.email}` : "",
        settings.address ? `Địa chỉ: ${settings.address}` : "",
      ].filter(Boolean),
      sections: [
        {
          heading: "Trang chính",
          links: [
            { title: "Trang chủ", url: absolute(publicPath("/", "vi"), siteUrl), description: "Giới thiệu, dự án và tin nổi bật" },
            { title: "Dự án", url: absolute(publicPath("/du-an", "vi"), siteUrl), description: "Danh sách dự án bất động sản" },
            { title: "Cho thuê", url: absolute(publicPath("/cho-thue", "vi"), siteUrl), description: "Nhà, căn hộ, văn phòng cho thuê" },
            { title: "Đăng tin BĐS", url: absolute(publicPath("/tin-bds", "vi"), siteUrl), description: "Tin bất động sản và ưu đãi" },
            { title: "Tin tức", url: absolute(publicPath("/tin-tuc", "vi"), siteUrl), description: "Tin tức thị trường" },
            { title: "Tuyển dụng", url: absolute(publicPath("/tuyen-dung", "vi"), siteUrl), description: "Vị trí đang tuyển" },
            { title: "Liên hệ", url: absolute(publicPath("/lien-he", "vi"), siteUrl), description: "Thông tin liên hệ và form tư vấn" },
          ],
        },
        { heading: "Dự án mới cập nhật", links: projects },
        { heading: "Dịch vụ", links: services },
        { heading: "Tin tức mới", links: news },
        {
          heading: "Optional",
          links: [
            { title: "English site", url: absolute(publicPath("/", "en"), siteUrl), description: "English version (pages with translations only)" },
            { title: "Sitemap", url: absolute("/sitemap.xml", siteUrl), description: "Full list of public URLs with hreflang alternates" },
          ],
        },
      ],
    });
    return cachedFileResponse(body, "text/plain; charset=utf-8");
  } catch (error) {
    logger.error({ err: error }, "Không dựng được llms.txt");
    return unavailableFileResponse("llms.txt chưa sẵn sàng");
  }
}
