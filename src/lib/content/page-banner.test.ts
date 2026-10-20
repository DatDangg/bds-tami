import { describe, expect, it } from "vitest";

import type { Media } from "../../payload-types";
import { resolvePageBanner, resolvePageHero } from "./page-banner";

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

  it("BL-045: Liên hệ + Pháp lý có ảnh riêng; thiếu thì dùng ảnh mặc định", () => {
    expect(resolvePageBanner({ pageBanners: { contact: own, default: fallback } }, "contact")).toBe(own);
    expect(resolvePageBanner({ pageBanners: { default: fallback } }, "legal")).toBe(fallback);
    expect(resolvePageBanner({ pageBanners: { legal: own } }, "legal")).toBe(own);
  });
});

describe("resolvePageHero", () => {
  const defaults = { title: "Dự án", description: "Mô tả mặc định" };

  it("chữ admin nhập thắng chữ mặc định; ảnh theo resolvePageBanner", () => {
    const hero = resolvePageHero(
      { pageBanners: { projects: own }, pageHeroes: { projects: { eyebrow: " Danh mục ", title: "Dự án nổi bật", titleAccent: "đáng sống", description: "Mô tả CMS" } } },
      "projects",
      defaults,
    );
    expect(hero).toEqual({ image: own, eyebrow: "Danh mục", title: "Dự án nổi bật", titleAccent: "đáng sống", description: "Mô tả CMS" });
  });

  it("chữ trống/khoảng trắng → chữ mặc định (vi + en); không eyebrow/dòng vàng", () => {
    expect(resolvePageHero({ pageHeroes: { projects: { title: "  ", description: null } } }, "projects", defaults)).toEqual({
      image: undefined,
      eyebrow: undefined,
      title: "Dự án",
      titleAccent: undefined,
      description: "Mô tả mặc định",
    });
    expect(resolvePageHero(null, "rentals", { title: "Rentals", description: "English default" })).toMatchObject({ title: "Rentals", description: "English default" });
  });

  it("mỗi trang đọc đúng nhóm của mình", () => {
    const settings = { pageHeroes: { news: { title: "Tin" }, contact: { title: "Liên hệ CMS" } } };
    expect(resolvePageHero(settings, "contact", { title: "x" }).title).toBe("Liên hệ CMS");
    expect(resolvePageHero(settings, "careers", { title: "Tuyển dụng" }).title).toBe("Tuyển dụng");
  });
});
