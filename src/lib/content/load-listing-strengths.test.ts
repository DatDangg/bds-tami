import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getHomepage = vi.hoisted(() => vi.fn());
const getSiteSettings = vi.hoisted(() => vi.fn());
vi.mock("./get-globals", () => ({ getHomepage, getSiteSettings }));

import { loadListingStrengths } from "./load-listing-strengths";

const homepage = {
  strengths: {
    enabled: true,
    items: [
      { id: "1", icon: "map-pin", title: "Vị trí", description: "Trung tâm" },
      { id: "2", icon: "star", title: "Uy tín", description: null },
    ],
  },
};

beforeEach(() => {
  getHomepage.mockReset().mockResolvedValue(homepage);
  getSiteSettings.mockReset();
});

describe("loadListingStrengths", () => {
  it("Cho thuê: cờ listingPages.rentals.showStrengths mặc định bật → có dải; tắt → không", async () => {
    getSiteSettings.mockResolvedValue({ listingPages: { rentals: {} } });
    expect((await loadListingStrengths("vi", "rentals"))?.items).toHaveLength(2);
    getSiteSettings.mockResolvedValue({ listingPages: { rentals: { showStrengths: false } }, showProjectStrengths: true });
    expect(await loadListingStrengths("vi", "rentals")).toBeNull();
  });

  it("Dự án dùng cờ showProjectStrengths; khối trang chủ tắt → không dải", async () => {
    getSiteSettings.mockResolvedValue({ showProjectStrengths: false, listingPages: { rentals: { showStrengths: true } } });
    expect(await loadListingStrengths("vi", "projects")).toBeNull();
    getSiteSettings.mockResolvedValue({});
    getHomepage.mockResolvedValue({ strengths: { ...homepage.strengths, enabled: false } });
    expect(await loadListingStrengths("vi", "rentals")).toBeNull();
  });

  it("đọc global lỗi → null (trang không vỡ)", async () => {
    getSiteSettings.mockRejectedValue(new Error("db down"));
    expect(await loadListingStrengths("en", "rentals")).toBeNull();
  });
});
