import { describe, expect, it } from "vitest";

import { pathnames } from "../../i18n/routing";
import { publicPath } from "../content/content-paths";
import { fallbackCounterpartPath, LOCALE_COUNTERPART_ENDPOINT, localeSwitchHref, parsePublicPath } from "./counterpart-url";

describe("parsePublicPath", () => {
  it("nhận ra khoá, ngôn ngữ và tham số của URL công khai vi/en", () => {
    expect(parsePublicPath("/cho-thue/can-ho-a")).toEqual({ key: "/cho-thue/[slug]", locale: "vi", params: { slug: "can-ho-a" } });
    expect(parsePublicPath("/en/for-rent/apartment-a")).toEqual({ key: "/cho-thue/[slug]", locale: "en", params: { slug: "apartment-a" } });
    expect(parsePublicPath("/en/news/category/market")).toEqual({ key: "/tin-tuc/danh-muc/[category]", locale: "en", params: { category: "market" } });
    expect(parsePublicPath("/")).toEqual({ key: "/", locale: "vi", params: {} });
    expect(parsePublicPath("/en")).toEqual({ key: "/", locale: "en", params: {} });
  });

  it("bỏ dấu / cuối, giải mã slug; mã hoá hỏng hoặc đường dẫn lạ → null", () => {
    expect(parsePublicPath("/du-an/a%20b/")?.params).toEqual({ slug: "a b" });
    expect(parsePublicPath("/du-an/%E0%A4%A")).toBeNull();
    for (const path of ["/khong-co", "/en/du-an", "/vi", "/du-an/a/b", "/projects/x"]) expect(parsePublicPath(path), path).toBeNull();
  });

  it("mọi khoá trong pathnames đều parse được ở cả hai ngôn ngữ (không route nào bị bỏ sót)", () => {
    for (const key of Object.keys(pathnames) as (keyof typeof pathnames)[]) {
      for (const locale of ["vi", "en"] as const) {
        const params = Object.fromEntries([...key.matchAll(/\[([a-z]+)\]/g)].map((found) => [found[1], "x"]));
        expect(parsePublicPath(publicPath(key, locale, params))).toEqual({ key, locale, params });
      }
    }
  });
});

describe("localeSwitchHref", () => {
  it("trang cố định: link thẳng tới đường dẫn ngôn ngữ kia (đường dẫn dịch, không chỉ thêm tiền tố)", () => {
    expect(localeSwitchHref("/", "en")).toBe("/en");
    expect(localeSwitchHref("/en", "vi")).toBe("/");
    expect(localeSwitchHref("/cho-thue", "en")).toBe("/en/for-rent");
    expect(localeSwitchHref("/en/careers", "vi")).toBe("/tuyen-dung");
    expect(localeSwitchHref("/en/contact", "vi")).toBe("/lien-he");
  });

  it("trang pháp lý đi qua endpoint (bản EN chỉ có khi hasEnglish), không link thẳng", () => {
    for (const [path, target] of [["/chinh-sach-bao-mat", "en"], ["/en/terms-of-use", "vi"]] as const) {
      expect(localeSwitchHref(path, target)).toBe(`${LOCALE_COUNTERPART_ENDPOINT}?to=${target}&path=${encodeURIComponent(path)}`);
    }
  });

  it("trang có slug: đi qua endpoint tra bản ghi, mang đúng đường dẫn hiện tại và ngôn ngữ đích", () => {
    const href = localeSwitchHref("/en/for-rent/apartment-a", "vi");
    const url = new URL(href, "http://localhost");
    expect(url.pathname).toBe(LOCALE_COUNTERPART_ENDPOINT);
    expect(url.searchParams.get("to")).toBe("vi");
    expect(url.searchParams.get("path")).toBe("/en/for-rent/apartment-a");
  });

  it("đường dẫn lạ: trang chủ ngôn ngữ kia", () => {
    expect(localeSwitchHref("/khong-co", "en")).toBe("/en");
    expect(localeSwitchHref("/en/nope", "vi")).toBe("/");
  });
});

describe("fallbackCounterpartPath", () => {
  it("chi tiết/danh mục → danh sách ngôn ngữ đích; không có danh sách (dịch vụ) → trang chủ", () => {
    expect(fallbackCounterpartPath("/cho-thue/[slug]", "en")).toBe("/en/for-rent");
    expect(fallbackCounterpartPath("/tin-tuc/danh-muc/[category]", "vi")).toBe("/tin-tuc");
    expect(fallbackCounterpartPath("/du-an/danh-muc/[category]", "en")).toBe("/en/projects");
    expect(fallbackCounterpartPath("/dich-vu/[slug]", "en")).toBe("/en");
  });
});
