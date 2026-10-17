import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CONTENT_ROUTES, type ContentRoute, contentPaths, internalPath, publicPath } from "./content-paths";
import { pathnames } from "../../i18n/routing";

describe("internalPath", () => {
  it("đường dẫn nội bộ = /locale + khoá pathnames (tiếng Việt), cả với en", () => {
    expect(internalPath("/tin-tuc", "vi")).toBe("/vi/tin-tuc");
    expect(internalPath("/tin-tuc", "en")).toBe("/en/tin-tuc");
    expect(internalPath("/tin-tuc/[slug]", "vi", "bai-moi")).toBe("/vi/tin-tuc/bai-moi");
    expect(internalPath("/tin-tuc/[slug]", "en", "new-post")).toBe("/en/tin-tuc/new-post");
  });

  it("trang chủ: /vi và /en (không có dấu / cuối)", () => {
    expect(internalPath("/", "vi")).toBe("/vi");
    expect(internalPath("/", "en")).toBe("/en");
  });

  it("mã hoá slug để không thoát khỏi segment", () => {
    expect(internalPath("/tin-tuc/[slug]", "vi", "a/b?c")).toBe("/vi/tin-tuc/a%2Fb%3Fc");
  });

  it("không dùng URL công khai: không có đường dẫn tiếng Anh, không có đường dẫn vi thiếu tiền tố", () => {
    const all = contentPaths(CONTENT_ROUTES.news, { slugs: { vi: "a", en: "b" }, featured: true });
    expect(all.every((path) => /^\/(vi|en)(\/|$)/.test(path))).toBe(true);
    expect(all.some((path) => path.includes("/news"))).toBe(false);
  });

  it("trang render dưới segment [locale] (bằng chứng cho tiền tố /locale)", () => {
    expect(existsSync(resolve(__dirname, "../../app/(frontend)/[locale]/page.tsx"))).toBe(true);
  });
});

describe("CONTENT_ROUTES", () => {
  it("mọi khoá đường dẫn đều tồn tại trong pathnames của next-intl", () => {
    for (const route of Object.values<ContentRoute>(CONTENT_ROUTES)) {
      expect(pathnames).toHaveProperty([route.detail]);
      if (route.list) expect(pathnames).toHaveProperty([route.list]);
    }
  });

  it("collection nội dung → đường dẫn nội bộ vi/en", () => {
    expect(
      contentPaths(CONTENT_ROUTES.projects, { slugs: { vi: "vinhomes", en: "vinhomes-en" }, featured: false }),
    ).toEqual(["/vi/du-an/vinhomes", "/en/du-an/vinhomes-en", "/vi/du-an", "/en/du-an"]);
    expect(contentPaths(CONTENT_ROUTES.rentals, { slugs: { vi: "studio", en: "studio-en" }, featured: false })).toEqual(
      ["/vi/cho-thue/studio", "/en/cho-thue/studio-en", "/vi/cho-thue", "/en/cho-thue"],
    );
  });
});

describe("contentPaths", () => {
  const route = CONTENT_ROUTES.news;

  it("thêm trang chủ vi + en khi isFeatured", () => {
    const paths = contentPaths(route, { slugs: { vi: "a", en: "b" }, featured: true });
    expect(paths).toEqual(["/vi/tin-tuc/a", "/en/tin-tuc/b", "/vi/tin-tuc", "/en/tin-tuc", "/vi", "/en"]);
  });

  it("bỏ chi tiết của locale chưa có slug nhưng vẫn làm mới danh sách cả hai ngôn ngữ", () => {
    expect(contentPaths(route, { slugs: { vi: "a", en: null }, featured: false })).toEqual([
      "/vi/tin-tuc/a",
      "/vi/tin-tuc",
      "/en/tin-tuc",
    ]);
  });

  it("collection không có trang danh sách (services) chỉ trả trang chi tiết", () => {
    expect(
      contentPaths(CONTENT_ROUTES.services, { slugs: { vi: "tu-van", en: "consulting" }, featured: false }),
    ).toEqual(["/vi/dich-vu/tu-van", "/en/dich-vu/consulting"]);
  });

  it("gộp slug cũ (đổi slug) và loại trùng", () => {
    const paths = contentPaths(route, { slugs: { vi: ["moi", "cu", "moi"], en: "b" }, featured: false });
    expect(paths).toEqual(["/vi/tin-tuc/moi", "/vi/tin-tuc/cu", "/en/tin-tuc/b", "/vi/tin-tuc", "/en/tin-tuc"]);
  });
});

describe("publicPath", () => {
  it("URL công khai: vi không tiền tố, en có /en và đường dẫn tiếng Anh", () => {
    expect(publicPath("/tin-tuc", "vi")).toBe("/tin-tuc");
    expect(publicPath("/tin-tuc", "en")).toBe("/en/news");
    expect(publicPath("/", "vi")).toBe("/");
    expect(publicPath("/", "en")).toBe("/en");
    expect(publicPath("/tin-tuc/[slug]", "en", { slug: "new-post" })).toBe("/en/news/new-post");
    expect(publicPath("/tin-tuc/danh-muc/[category]", "vi", { category: "thi-truong" })).toBe("/tin-tuc/danh-muc/thi-truong");
    expect(publicPath("/tin-tuc/danh-muc/[category]", "en", { category: "market" })).toBe("/en/news/category/market");
  });

  it("mã hoá tham số để không thoát khỏi segment", () => {
    expect(publicPath("/tin-tuc/[slug]", "vi", { slug: "a/b?c" })).toBe("/tin-tuc/a%2Fb%3Fc");
  });
});
