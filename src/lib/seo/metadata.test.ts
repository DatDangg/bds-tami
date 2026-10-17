import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Media } from "../../payload-types";
import { buildAlternateLanguages, buildPageMetadata, type PageMetadataInput, shouldNoindex } from "./metadata";

const media = (url: string, extra: Partial<Media> = {}): Media =>
  ({ id: "m", url, width: 1200, height: 630, alt: "Ảnh", updatedAt: "", createdAt: "", ...extra }) as Media;

const base: PageMetadataInput = {
  locale: "vi",
  title: "Dự án A",
  description: "Mô tả tóm tắt",
  siteName: "TAMI",
  paths: { vi: "/du-an/a", en: "/en/projects/a" },
  hasEnglish: true,
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example/");
  vi.stubEnv("APP_ENV", "production");
});
afterEach(() => vi.unstubAllEnvs());

describe("hreflang (BR-07)", () => {
  it("có EN: vi, en, x-default (→ vi), URL tuyệt đối", () => {
    expect(buildPageMetadata(base).alternates?.languages).toEqual({
      vi: "https://tami.example/du-an/a",
      en: "https://tami.example/en/projects/a",
      "x-default": "https://tami.example/du-an/a",
    });
  });

  it("không EN (hasEnglish=false hoặc thiếu path en): không khai alternates.languages, canonical vẫn có", () => {
    const noFlag = buildPageMetadata({ ...base, hasEnglish: false });
    expect(noFlag.alternates?.languages).toBeUndefined();
    expect(noFlag.alternates?.canonical).toBe("https://tami.example/du-an/a");
    expect(buildPageMetadata({ ...base, paths: { vi: "/du-an/a" } }).alternates?.languages).toBeUndefined();
  });

  it("không có URL gốc thì bỏ hreflang", () => {
    expect(buildAlternateLanguages(base.paths, true, undefined)).toBeUndefined();
  });

  it("canonical theo ngôn ngữ đang xem", () => {
    expect(buildPageMetadata({ ...base, locale: "en" }).alternates?.canonical).toBe("https://tami.example/en/projects/a");
  });

  it("seo.canonical http(s) thắng, giá trị lạ (javascript:) bị bỏ qua", () => {
    expect(buildPageMetadata({ ...base, seo: { canonical: "https://other.example/x" } }).alternates?.canonical).toBe(
      "https://other.example/x",
    );
    expect(buildPageMetadata({ ...base, seo: { canonical: "javascript:alert(1)" } }).alternates?.canonical).toBe(
      "https://tami.example/du-an/a",
    );
  });
});

describe("title, description, OG", () => {
  it("seo.metaTitle/metaDescription thắng tiêu đề/tóm tắt; thêm tên site một lần", () => {
    const meta = buildPageMetadata({ ...base, seo: { metaTitle: "SEO title", metaDescription: "SEO desc" } });
    expect(meta.title).toBe("SEO title | TAMI");
    expect(meta.description).toBe("SEO desc");
    expect(meta.openGraph).toMatchObject({
      title: "SEO title | TAMI",
      description: "SEO desc",
      siteName: "TAMI",
      locale: "vi_VN",
      type: "website",
    });
    expect(buildPageMetadata({ ...base, title: "TAMI - Trang chủ" }).title).toBe("TAMI - Trang chủ");
  });

  it("fallback về title/summary khi seo trống hoặc chỉ khoảng trắng", () => {
    const meta = buildPageMetadata({ ...base, seo: { metaTitle: "  ", metaDescription: "" } });
    expect(meta.title).toBe("Dự án A | TAMI");
    expect(meta.description).toBe("Mô tả tóm tắt");
  });

  it("ảnh OG: seo.ogImage → ảnh đại diện → ảnh mặc định, URL tuyệt đối", () => {
    const withAll: PageMetadataInput = {
      ...base,
      seo: { ogImage: media("/api/media/file/og.jpg") },
      image: media("/api/media/file/cover.jpg"),
      defaultImage: media("/api/media/file/logo.png"),
    };
    expect(buildPageMetadata(withAll).openGraph?.images).toEqual([
      { url: "https://tami.example/api/media/file/og.jpg", width: 1200, height: 630, alt: "Ảnh" },
    ]);
    const noOg = { ...withAll, seo: { ogImage: "id-chua-populate" } };
    expect(JSON.stringify(buildPageMetadata(noOg).openGraph?.images)).toContain("cover.jpg");
    const onlyDefault = { ...withAll, seo: undefined, image: null };
    expect(JSON.stringify(buildPageMetadata(onlyDefault).openGraph?.images)).toContain("logo.png");
    const none = { ...withAll, seo: undefined, image: null, defaultImage: null };
    expect(buildPageMetadata(none).openGraph?.images).toEqual([{ url: "https://tami.example/brand/tami-logo-gold.png" }]);
  });

  it("ogType article", () => {
    expect(buildPageMetadata({ ...base, ogType: "article" }).openGraph).toMatchObject({ type: "article" });
  });

  it("chưa biết URL gốc (lúc build): không canonical/hreflang/og url/ảnh, không rò placeholder", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const meta = buildPageMetadata({ ...base, image: media("/api/media/file/cover.jpg") });
    expect(meta.alternates).toBeUndefined();
    expect(JSON.stringify(meta)).not.toContain("localhost");
    expect(meta.openGraph).not.toHaveProperty("url");
    expect(meta.openGraph).not.toHaveProperty("images");
  });
});

describe("noindex", () => {
  it("production, không cờ: index", () => {
    expect(buildPageMetadata(base).robots).toEqual({ index: true, follow: true });
  });

  it.each([
    ["seo.noindex", { seo: { noindex: true } }],
    ["forceNoindex (tin đã thuê, tuyển dụng hết hạn)", { forceNoindex: true }],
  ])("%s → noindex, follow (DESIGN.md §305)", (_name, extra) => {
    expect(buildPageMetadata({ ...base, ...extra }).robots).toEqual({ index: false, follow: true });
  });

  it.each(["staging", "development", "test", ""])("APP_ENV=%j → noindex dù bản ghi cho index", (env) => {
    vi.stubEnv("APP_ENV", env);
    expect(shouldNoindex({})).toBe(true);
    expect(buildPageMetadata(base).robots).toEqual({ index: false, follow: false });
  });
});
