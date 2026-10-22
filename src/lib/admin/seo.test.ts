import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import enMessages from "../../i18n/messages/en.json";
import viMessages from "../../i18n/messages/vi.json";
import type { Locale } from "../../i18n/routing";
import { buildPageMetadata } from "../seo/metadata";
import {
  buildSeoPreview,
  buildSeoTitle,
  describeSeoDescriptionLength,
  describeSeoTitleLength,
  flattenMetaDescription,
  homepageSeoFallback,
  nonEmptySeo,
  SEO_PREVIEW_DESCRIPTION_MAX,
  publicPageUrl,
  resolveDescriptionValue,
  seoDescriptionSource,
  seoPagePathKey,
  SEO_DESCRIPTION_MAX,
  SEO_DESCRIPTION_MIN,
  SEO_TITLE_MAX,
  truncateForGoogle,
} from "./seo";

describe("nonEmptySeo", () => {
  it("chuỗi rỗng/trắng/không phải chuỗi → undefined; chuỗi có chữ → trim", () => {
    expect(nonEmptySeo("")).toBeUndefined();
    expect(nonEmptySeo("   ")).toBeUndefined();
    expect(nonEmptySeo(null)).toBeUndefined();
    expect(nonEmptySeo(undefined)).toBeUndefined();
    expect(nonEmptySeo(123)).toBeUndefined();
    expect(nonEmptySeo("  Căn hộ  ")).toBe("Căn hộ");
  });
});

describe("truncateForGoogle", () => {
  it("ngắn hơn giới hạn thì giữ nguyên, vượt thì cắt + ba chấm đúng độ dài", () => {
    expect(truncateForGoogle("abc", 60)).toBe("abc");
    const cut = truncateForGoogle("a".repeat(80), 60);
    expect(cut).toHaveLength(60);
    expect(cut.endsWith("…")).toBe(true);
  });
});

describe("flattenMetaDescription", () => {
  it("gộp khoảng trắng, rỗng → undefined, dài quá thì cắt theo ranh giới từ", () => {
    expect(flattenMetaDescription("  a   b\n c ")).toBe("a b c");
    expect(flattenMetaDescription("   ")).toBeUndefined();
    const long = flattenMetaDescription("word ".repeat(60));
    expect(long).toBeDefined();
    expect(long!.length).toBeLessThanOrEqual(161); // 160 + dấu ba chấm
    expect(long!.endsWith("…")).toBe(true);
  });
});

describe("describeSeoTitleLength", () => {
  it("đếm ký tự và báo hơi dài khi vượt giới hạn", () => {
    expect(describeSeoTitleLength(undefined)).toEqual({ text: `0 ký tự · nên ≤ ${SEO_TITLE_MAX}`, outOfRange: false });
    expect(describeSeoTitleLength("a".repeat(SEO_TITLE_MAX)).outOfRange).toBe(false);
    expect(describeSeoTitleLength("a".repeat(SEO_TITLE_MAX + 1)).outOfRange).toBe(true);
    expect(describeSeoTitleLength("a".repeat(61)).text).toContain("hơi dài");
  });
});

describe("describeSeoDescriptionLength", () => {
  it("trong khoảng 120–160 không cảnh báo; ngoài khoảng thì tô nhắc", () => {
    expect(describeSeoDescriptionLength(undefined).outOfRange).toBe(false);
    expect(describeSeoDescriptionLength("a".repeat(50)).outOfRange).toBe(true);
    expect(describeSeoDescriptionLength("a".repeat(SEO_DESCRIPTION_MIN)).outOfRange).toBe(false);
    expect(describeSeoDescriptionLength("a".repeat(SEO_DESCRIPTION_MAX)).outOfRange).toBe(false);
    expect(describeSeoDescriptionLength("a".repeat(SEO_DESCRIPTION_MAX + 1)).text).toContain("hơi dài");
  });
});

describe("buildSeoPreview", () => {
  it("seo.metaTitle / seo.metaDescription thắng tiêu đề / mô tả (fallback đúng như metadata.ts)", () => {
    const result = buildSeoPreview({
      metaTitle: "Tiêu đề SEO",
      metaDescription: "Mô tả SEO",
      title: "Tiêu đề bài",
      description: "Tóm tắt bài",
    });
    expect(result.title).toBe("Tiêu đề SEO");
    expect(result.description).toBe("Mô tả SEO");
    expect(result.titleCount).toBe("Tiêu đề SEO".length);
    expect(result.descriptionCount).toBe("Mô tả SEO".length);
  });

  it("ô SEO trống hoặc chỉ khoảng trắng → fallback về title / summary", () => {
    const result = buildSeoPreview({ metaTitle: "   ", metaDescription: "", title: "Tiêu đề bài", description: "Tóm tắt bài" });
    expect(result.title).toBe("Tiêu đề bài");
    expect(result.description).toBe("Tóm tắt bài");
    expect(result.titleCount).toBe(0);
    expect(result.descriptionCount).toBe(0);
  });

  it("canonical hợp lệ (http/https) thì hiện, giá trị lạ thì bỏ", () => {
    expect(buildSeoPreview({ canonical: "https://tami.vn/x", title: "T" }).url).toBe("https://tami.vn/x");
    expect(buildSeoPreview({ canonical: "javascript:alert(1)", title: "T" }).url).toBe("");
    expect(buildSeoPreview({ canonical: "/du-an/a", title: "T" }).url).toBe("");
  });

  it("tiêu đề dài quá thì cắt ~60, mô tả dài quá thì cắt ~155 (kiểu Google)", () => {
    const result = buildSeoPreview({ metaTitle: "t".repeat(80), metaDescription: "d".repeat(200) });
    expect(result.title).toHaveLength(SEO_TITLE_MAX);
    expect(result.description).toHaveLength(155);
    expect(result.title.endsWith("…")).toBe(true);
    expect(result.description.endsWith("…")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Parity với `src/lib/seo/metadata.ts` (BL-058 T05 r2): tiêu đề nối tên website,
// canonical lấy URL trang khi ô trống, mô tả fallback theo từng route.
// ---------------------------------------------------------------------------

const ORIGIN = "https://tami.vn";

describe("buildSeoTitle (khớp buildTitle của metadata.ts)", () => {
  it("nối ' | Tên website' khi tiêu đề chưa chứa tên, không nối lặp", () => {
    expect(buildSeoTitle({ title: "Căn hộ Vinhomes", siteName: "Tami Land" })).toBe("Căn hộ Vinhomes | Tami Land");
    expect(buildSeoTitle({ metaTitle: "Tiêu đề SEO", title: "Tiêu đề bài", siteName: "Tami Land" })).toBe("Tiêu đề SEO | Tami Land");
    expect(buildSeoTitle({ title: "Tami Land - Căn hộ", siteName: "Tami Land" })).toBe("Tami Land - Căn hộ");
  });

  it("thiếu tên website (Cài đặt chung chưa tải/để trống) thì giữ tiêu đề trần; thiếu cả hai thì rỗng", () => {
    expect(buildSeoTitle({ title: "Căn hộ" })).toBe("Căn hộ");
    expect(buildSeoTitle({ title: "  ", siteName: "Tami Land" })).toBe("");
  });
});

describe("seoDescriptionSource: bảng route → trường mô tả dự phòng", () => {
  it("khớp tham số `description` của từng trang công khai, không có fallback cho trang pháp lý", () => {
    expect(seoDescriptionSource("projects")).toBe("summary");
    expect(seoDescriptionSource("services")).toBe("summary");
    expect(seoDescriptionSource("news")).toBe("excerpt");
    expect(seoDescriptionSource("property-posts")).toBe("excerpt");
    expect(seoDescriptionSource("rentals")).toBe("description");
    expect(seoDescriptionSource("job-postings")).toBe("description");
    expect(seoDescriptionSource("pages")).toBeUndefined();
    expect(seoDescriptionSource("homepage")).toBeUndefined();
    expect(seoDescriptionSource(null)).toBeUndefined();
  });

  it("richText đổi sang chữ thuần rồi cắt 160; textarea/text giữ nguyên, rỗng → undefined", () => {
    const rich = (value: unknown) => (typeof value === "string" ? value : "");
    expect(resolveDescriptionValue("description", "Nhà 3 phòng   ngủ", rich)).toBe("Nhà 3 phòng ngủ");
    expect(resolveDescriptionValue("summary", "Mô tả ngắn", rich)).toBe("Mô tả ngắn");
    expect(resolveDescriptionValue("excerpt", "   ", rich)).toBeUndefined();
    expect(resolveDescriptionValue(undefined, "bỏ qua", rich)).toBeUndefined();
  });
});

describe("seoPagePathKey: bản ghi → khoá đường dẫn công khai", () => {
  it("7 collection có trang chi tiết (+ trang pháp lý theo `kind`) và Trang chủ", () => {
    expect(seoPagePathKey({ collectionSlug: "news" })).toBe("/tin-tuc/[slug]");
    expect(seoPagePathKey({ collectionSlug: "projects" })).toBe("/du-an/[slug]");
    expect(seoPagePathKey({ collectionSlug: "rentals" })).toBe("/cho-thue/[slug]");
    expect(seoPagePathKey({ collectionSlug: "property-posts" })).toBe("/tin-bds/[slug]");
    expect(seoPagePathKey({ collectionSlug: "job-postings" })).toBe("/tuyen-dung/[slug]");
    expect(seoPagePathKey({ collectionSlug: "services" })).toBe("/dich-vu/[slug]");
    expect(seoPagePathKey({ collectionSlug: "pages", kind: "privacy" })).toBe("/chinh-sach-bao-mat");
    expect(seoPagePathKey({ globalSlug: "homepage" })).toBe("/");
    expect(seoPagePathKey({ collectionSlug: "leads" })).toBeUndefined();
    expect(seoPagePathKey({ collectionSlug: "pages" })).toBeUndefined();
  });
});

describe("publicPageUrl: URL công khai thay cho canonical khi ô trống", () => {
  it.each([
    ["projects", "https://tami.vn/du-an/a", "https://tami.vn/en/projects/a"],
    ["news", "https://tami.vn/tin-tuc/a", "https://tami.vn/en/news/a"],
    ["rentals", "https://tami.vn/cho-thue/a", "https://tami.vn/en/for-rent/a"],
    ["property-posts", "https://tami.vn/tin-bds/a", "https://tami.vn/en/property-news/a"],
    ["job-postings", "https://tami.vn/tuyen-dung/a", "https://tami.vn/en/careers/a"],
    ["services", "https://tami.vn/dich-vu/a", "https://tami.vn/en/services/a"],
  ])("%s: tiếng Việt không tiền tố, tiếng Anh có /en + đường dẫn dịch", (slug, viUrl, enUrl) => {
    const pathKey = seoPagePathKey({ collectionSlug: slug });
    expect(publicPageUrl({ origin: ORIGIN, locale: "vi", pathKey, slug: "a" })).toBe(viUrl);
    expect(publicPageUrl({ origin: ORIGIN, locale: "en", pathKey, slug: "a", hasEnglish: true })).toBe(enUrl);
  });

  it("chưa có bản dịch EN (hasEnglish false/trống) thì dùng đường dẫn tiếng Việt, không khai URL EN không tồn tại", () => {
    const pathKey = seoPagePathKey({ collectionSlug: "news" });
    expect(publicPageUrl({ origin: ORIGIN, locale: "en", pathKey, slug: "a", hasEnglish: false })).toBe("https://tami.vn/tin-tuc/a");
    expect(publicPageUrl({ origin: ORIGIN, locale: "en", pathKey, slug: "a" })).toBe("https://tami.vn/tin-tuc/a");
    expect(publicPageUrl({ origin: ORIGIN, locale: "en", pathKey, slug: "a", hasEnglish: true })).toBe("https://tami.vn/en/news/a");
  });

  it("Trang chủ: / và /en; trang pháp lý: đường dẫn cố định, không có slug", () => {
    const home = seoPagePathKey({ globalSlug: "homepage" });
    expect(publicPageUrl({ origin: ORIGIN, locale: "vi", pathKey: home })).toBe("https://tami.vn");
    expect(publicPageUrl({ origin: ORIGIN, locale: "en", pathKey: home, hasEnglish: true })).toBe("https://tami.vn/en");
    const privacy = seoPagePathKey({ collectionSlug: "pages", kind: "privacy" });
    expect(publicPageUrl({ origin: ORIGIN, locale: "vi", pathKey: privacy })).toBe("https://tami.vn/chinh-sach-bao-mat");
    expect(publicPageUrl({ origin: ORIGIN, locale: "en", pathKey: privacy, hasEnglish: true })).toBe("https://tami.vn/en/privacy-policy");
  });

  it("chưa nhập slug / không rõ đường dẫn / không rõ gốc site → rỗng (không bịa URL)", () => {
    expect(publicPageUrl({ origin: ORIGIN, locale: "vi", pathKey: "/tin-tuc/[slug]" })).toBe("");
    expect(publicPageUrl({ origin: ORIGIN, locale: "vi", pathKey: undefined, slug: "x" })).toBe("");
    expect(publicPageUrl({ origin: "", locale: "vi", pathKey: "/tin-tuc/[slug]", slug: "x" })).toBe("/tin-tuc/x");
  });
});

describe("buildSeoPreview: khớp kết quả generateMetadata", () => {
  it("tiêu đề nối tên website rồi mới cắt 60", () => {
    const result = buildSeoPreview({ metaTitle: "Căn hộ Vinhomes", siteName: "Tami Land" });
    expect(result.title).toBe("Căn hộ Vinhomes | Tami Land");
    const long = buildSeoPreview({ metaTitle: "t".repeat(50), siteName: "Tami Land" });
    expect(long.title).toHaveLength(SEO_TITLE_MAX);
    expect(long.title.startsWith("t".repeat(50))).toBe(true);
  });

  it("canonical: ô nhập hợp lệ thì dùng, trống/không phải http(s) thì dùng URL trang", () => {
    const base = { pageUrl: "https://tami.vn/tin-tuc/a", title: "T" };
    expect(buildSeoPreview({ ...base, canonical: "https://khac.vn/x" }).url).toBe("https://khac.vn/x");
    expect(buildSeoPreview({ ...base, canonical: "" }).url).toBe("https://tami.vn/tin-tuc/a");
    expect(buildSeoPreview({ ...base, canonical: "/tin-tuc/a" }).url).toBe("https://tami.vn/tin-tuc/a");
    expect(buildSeoPreview({ title: "T" }).url).toBe("");
  });

  it("mô tả: ô SEO thắng, trống thì dùng mô tả của route (đã cắt 155)", () => {
    expect(buildSeoPreview({ metaDescription: "Mô tả SEO", description: "Mô tả route" }).description).toBe("Mô tả SEO");
    expect(buildSeoPreview({ metaDescription: "  ", description: "Mô tả route" }).description).toBe("Mô tả route");
    expect(buildSeoPreview({ description: "d".repeat(300) }).description).toHaveLength(155);
  });
});

// ---------------------------------------------------------------------------
// Trang chủ (r3): global không có Tiêu đề/Tóm tắt — `app/(frontend)/[locale]/page.tsx` truyền `t("title")` /
// `t("description")` của namespace `page.home` vào `buildPageMetadata`. Đối chiếu với kết quả gọi THẬT.
// ---------------------------------------------------------------------------

describe("homepageSeoFallback: khớp generateMetadata của Trang chủ khi ô SEO trống", () => {
  const messages = { vi: viMessages, en: enMessages } as const;

  it.each<Locale>(["vi", "en"])("%s: lấy đúng page.home.title / page.home.description như t() của trang công khai", (locale) => {
    const t = createTranslator({ locale, messages: messages[locale], namespace: "page.home" });
    expect(homepageSeoFallback(locale)).toEqual({ title: t("title"), description: t("description") });
  });

  it("locale ngoài vi/en không xảy ra ở trang công khai; helper mặc định về tiếng Việt", () => {
    expect(homepageSeoFallback("vi")).toEqual(homepageSeoFallback("xx" as Locale));
  });

  it.each<Locale>(["vi", "en"])("%s: preview Trang chủ SEO trống = <title>/<meta description> thật của buildPageMetadata", (locale) => {
    const siteName = "Tami Land";
    const t = createTranslator({ locale, messages: messages[locale], namespace: "page.home" });
    // Đúng input mà page.tsx truyền (seo trống, hasEnglish=true, paths vi/en).
    const metadata = buildPageMetadata({
      locale,
      seo: { metaTitle: "", metaDescription: "   " },
      title: t("title"),
      description: t("description"),
      siteName,
      paths: { vi: "/", en: "/en" },
      hasEnglish: true,
    });
    const fallback = homepageSeoFallback(locale);
    const preview = buildSeoPreview({ metaTitle: "", metaDescription: "   ", title: fallback.title, description: fallback.description, siteName });

    expect(typeof metadata.title).toBe("string");
    expect(preview.title).toBe(truncateForGoogle(metadata.title as string, SEO_TITLE_MAX));
    expect(metadata.description).toBeDefined();
    expect(preview.description).toBe(truncateForGoogle(metadata.description as string, SEO_PREVIEW_DESCRIPTION_MAX));
    // Giá trị cụ thể (không chỉ tự khớp): tiêu đề dịch + " | Tên website", mô tả dịch nguyên văn.
    expect(preview.title).toBe(`${messages[locale].page.home.title} | ${siteName}`);
    expect(preview.description).toBe(messages[locale].page.home.description);
  });
});
