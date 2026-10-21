import { describe, expect, it } from "vitest";

import { publicDocUrl } from "./public-doc-url";

const SITE = "https://tami.example";
const base = { siteUrl: SITE, locale: "vi" };
const doc = { slug: "can-ho-a", status: "published", hasEnglish: true };

describe("publicDocUrl (nút Xem trên website)", () => {
  it("dựng URL tuyệt đối đúng route vi và en (slug theo ngôn ngữ đang sửa)", () => {
    expect(publicDocUrl({ ...base, collectionSlug: "projects", savedDoc: { ...doc, slug: "du-an-x" } })).toBe(`${SITE}/du-an/du-an-x`);
    expect(publicDocUrl({ ...base, locale: "en", collectionSlug: "projects", savedDoc: { ...doc, slug: "project-x" } })).toBe(`${SITE}/en/projects/project-x`);
    expect(publicDocUrl({ ...base, collectionSlug: "news", savedDoc: doc })).toBe(`${SITE}/tin-tuc/can-ho-a`);
  });

  it("bỏ dấu / cuối của NEXT_PUBLIC_SITE_URL và encode slug", () => {
    expect(publicDocUrl({ ...base, siteUrl: `${SITE}/`, collectionSlug: "services", savedDoc: { ...doc, slug: "a b" } })).toBe(`${SITE}/dich-vu/a%20b`);
  });

  it("Cho thuê: đã cho thuê (rented) vẫn có trang công khai, nháp thì không", () => {
    expect(publicDocUrl({ ...base, collectionSlug: "rentals", savedDoc: { ...doc, status: "rented" } })).toBe(`${SITE}/cho-thue/can-ho-a`);
    expect(publicDocUrl({ ...base, collectionSlug: "rentals", savedDoc: { ...doc, status: "draft" } })).toBeNull();
  });

  it("collection khác: rented không phải trạng thái công khai", () => {
    expect(publicDocUrl({ ...base, collectionSlug: "projects", savedDoc: { ...doc, status: "rented" } })).toBeNull();
  });

  it.each(["draft", "archived", undefined, 1])("status %s (chưa công khai) → không có nút", (status) => {
    expect(publicDocUrl({ ...base, collectionSlug: "news", savedDoc: { ...doc, status } })).toBeNull();
  });

  it("doc trong thùng rác → không có nút", () => {
    expect(publicDocUrl({ ...base, collectionSlug: "news", savedDoc: { ...doc, deletedAt: "2026-10-20T00:00:00Z" } })).toBeNull();
  });

  it("EN chỉ khi bản EN thực sự công khai (hasEnglish)", () => {
    expect(publicDocUrl({ ...base, locale: "en", collectionSlug: "news", savedDoc: { ...doc, hasEnglish: false } })).toBeNull();
    expect(publicDocUrl({ ...base, locale: "en", collectionSlug: "news", savedDoc: { ...doc, hasEnglish: undefined } })).toBeNull();
    expect(publicDocUrl({ ...base, locale: "vi", collectionSlug: "news", savedDoc: { ...doc, hasEnglish: false } })).toBe(`${SITE}/tin-tuc/can-ho-a`);
  });

  it("trang pháp lý: route cố định theo kind, không cần slug", () => {
    expect(publicDocUrl({ ...base, collectionSlug: "pages", savedDoc: { status: "published", kind: "privacy", hasEnglish: true } })).toBe(`${SITE}/chinh-sach-bao-mat`);
    expect(publicDocUrl({ ...base, locale: "en", collectionSlug: "pages", savedDoc: { status: "published", kind: "terms", hasEnglish: true } })).toBe(`${SITE}/en/terms-of-use`);
    expect(publicDocUrl({ ...base, collectionSlug: "pages", savedDoc: { status: "draft", kind: "terms" } })).toBeNull();
  });

  it("collection không có trang công khai, doc chưa lưu, slug rỗng, locale lạ → không có nút", () => {
    expect(publicDocUrl({ ...base, collectionSlug: "leads", savedDoc: doc })).toBeNull();
    expect(publicDocUrl({ ...base, collectionSlug: "media", savedDoc: doc })).toBeNull();
    expect(publicDocUrl({ ...base, collectionSlug: undefined, savedDoc: doc })).toBeNull();
    expect(publicDocUrl({ ...base, collectionSlug: "news", savedDoc: undefined })).toBeNull();
    expect(publicDocUrl({ ...base, collectionSlug: "news", savedDoc: { ...doc, slug: "" } })).toBeNull();
    expect(publicDocUrl({ ...base, locale: "fr", collectionSlug: "news", savedDoc: doc })).toBeNull();
    expect(publicDocUrl({ ...base, siteUrl: "", collectionSlug: "news", savedDoc: doc })).toBeNull();
  });
});
