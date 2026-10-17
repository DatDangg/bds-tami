import { describe, expect, it } from "vitest";
import { resolveInternalDocHref } from "./doc-link";

const ref = (relationTo: string, value: unknown) => ({ relationTo, value });

describe("resolveInternalDocHref", () => {
  it("doc đã populate → URL công khai theo ngôn ngữ", () => {
    expect(resolveInternalDocHref(ref("news", { slug: "bai-moi" }), "vi")).toBe("/tin-tuc/bai-moi");
    expect(resolveInternalDocHref(ref("news", { slug: "new-post", hasEnglish: true }), "en")).toBe("/en/news/new-post");
    expect(resolveInternalDocHref(ref("services", { slug: "moi-gioi" }), "vi")).toBe("/dich-vu/moi-gioi");
    expect(resolveInternalDocHref(ref("pages", { kind: "privacy" }), "vi")).toBe("/chinh-sach-bao-mat");
    expect(resolveInternalDocHref(ref("pages", { kind: "terms", hasEnglish: true }), "en")).toBe("/en/terms-of-use");
  });

  it("slug có ký tự đặc biệt được encode", () => {
    expect(resolveInternalDocHref(ref("news", { slug: "a b/c" }), "vi")).toBe("/tin-tuc/a%20b%2Fc");
  });

  it("chưa populate (chỉ id), thiếu slug, collection không có trang công khai, dữ liệu sai dạng → null", () => {
    for (const value of [ref("news", "id-1"), ref("news", { slug: "" }), ref("news", {}), ref("leads", { slug: "x" }), ref("pages", { kind: "khac" }), null, "x", {}, { relationTo: 5, value: { slug: "x" } }]) {
      expect(resolveInternalDocHref(value, "vi")).toBeNull();
    }
  });

  it("ở /en: doc chưa có bản EN → null (không link tới 404)", () => {
    expect(resolveInternalDocHref(ref("news", { slug: "x" }), "en")).toBeNull();
    expect(resolveInternalDocHref(ref("news", { slug: "x", hasEnglish: false }), "en")).toBeNull();
    expect(resolveInternalDocHref(ref("pages", { kind: "privacy", hasEnglish: false }), "en")).toBeNull();
  });
});
