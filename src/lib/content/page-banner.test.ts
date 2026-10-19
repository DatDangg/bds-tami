import { describe, expect, it } from "vitest";

import type { Media } from "../../payload-types";
import { resolvePageBanner } from "./page-banner";

const media = (id: string, url: string | null): Media => ({ id, url, updatedAt: "2026-10-19T00:00:00.000Z", createdAt: "2026-10-19T00:00:00.000Z" });
const own = media("m1", "/api/media/file/own.jpg");
const fallback = media("m2", "/api/media/file/default.jpg");

describe("resolvePageBanner", () => {
  it("dùng ảnh riêng khi có", () => {
    expect(resolvePageBanner({ pageBanners: { projects: own, default: fallback } }, "projects")).toBe(own);
  });

  it("thiếu ảnh riêng thì dùng ảnh mặc định", () => {
    expect(resolvePageBanner({ pageBanners: { default: fallback } }, "news")).toBe(fallback);
  });

  it("không có ảnh nào thì undefined (biến thể Chữ)", () => {
    expect(resolvePageBanner({ pageBanners: {} }, "careers")).toBeUndefined();
    expect(resolvePageBanner({}, "rentals")).toBeUndefined();
    expect(resolvePageBanner(null, "rentals")).toBeUndefined();
  });

  it("giá trị chỉ là id (chưa populate) hoặc null coi như không có", () => {
    expect(resolvePageBanner({ pageBanners: { rentals: "abc", default: null } }, "rentals")).toBeUndefined();
  });

  it("ảnh riêng chưa populate thì rơi về ảnh mặc định", () => {
    expect(resolvePageBanner({ pageBanners: { propertyPosts: "abc", default: fallback } }, "propertyPosts")).toBe(fallback);
  });

  it("media không có url (file bị xoá khỏi kho) coi như không có", () => {
    expect(resolvePageBanner({ pageBanners: { projects: media("m3", null), default: fallback } }, "projects")).toBe(fallback);
  });
});
