import "server-only";

import config from "@payload-config";
import { getPayload } from "payload";

import { logger } from "../logger";
import { cachedFileResponse, hasQueryString, notFoundFileResponse, unavailableFileResponse } from "./file-route-response";
import { countSectionChunks, isSitemapSection, loadSectionUrls, parseSitemapFile, SITEMAP_SECTIONS } from "./sitemap-data";
import { getSiteUrl } from "./site-url";
import { renderSitemapIndex, renderUrlset } from "./sitemap-xml";

const XML_CONTENT_TYPE = "application/xml; charset=utf-8";

const notAvailable = () => unavailableFileResponse("Sitemap chưa sẵn sàng");

/** `GET /sitemap.xml`: sitemap index liệt kê file con theo collection (mỗi file ≤ 20.000 bản ghi, tức ≤ 40.000 URL). */
export async function sitemapIndexResponse(request: Request): Promise<Response> {
  if (hasQueryString(request)) return notFoundFileResponse();
  const siteUrl = getSiteUrl();
  if (!siteUrl) return notAvailable();
  try {
    const payload = await getPayload({ config });
    const now = new Date();
    const chunkCounts = await Promise.all(SITEMAP_SECTIONS.map((section) => countSectionChunks(payload, section, now)));
    const locations = SITEMAP_SECTIONS.flatMap((section, index) =>
      Array.from({ length: chunkCounts[index] ?? 0 }, (_, offset) => new URL(`/sitemaps/${section}-${offset + 1}.xml`, siteUrl).toString()),
    );
    return cachedFileResponse(renderSitemapIndex(locations), XML_CONTENT_TYPE);
  } catch (error) {
    logger.error({ err: error }, "Không dựng được sitemap index");
    return notAvailable();
  }
}

/** `GET /sitemaps/<nhóm>-<n>.xml`. */
export async function sitemapFileResponse(file: string, request: Request): Promise<Response> {
  const parsed = parseSitemapFile(file);
  if (hasQueryString(request) || !parsed || !isSitemapSection(parsed.section)) return notFoundFileResponse();
  const siteUrl = getSiteUrl();
  if (!siteUrl) return notAvailable();
  try {
    const payload = await getPayload({ config });
    const now = new Date();
    if (parsed.chunk > Math.max(1, await countSectionChunks(payload, parsed.section, now))) return notFoundFileResponse();
    const urls = await loadSectionUrls(payload, parsed.section, parsed.chunk, siteUrl, now);
    return cachedFileResponse(renderUrlset(urls), XML_CONTENT_TYPE);
  } catch (error) {
    logger.error({ err: error, file }, "Không dựng được sitemap");
    return notAvailable();
  }
}
