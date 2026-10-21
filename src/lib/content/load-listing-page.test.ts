import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getSiteSettings = vi.hoisted(() => vi.fn());
vi.mock("./get-globals", () => ({ getSiteSettings }));
vi.mock("../logger", () => ({ logger: { warn: vi.fn() } }));

import { loadListingPageContent, resolveListingPageContent } from "./load-listing-page";

type Settings = Parameters<typeof resolveListingPageContent>[0];
const settings = (value: unknown) => value as Settings;

const image = { id: "m1", url: "/media/a.jpg", alt: "", width: 1200 };

const viRentals = {
  quickSearch: [{ id: "q1", label: "Căn hộ Quận 7" }, { id: "q2", label: "  " }, { id: "q3", label: "Studio" }],
  learnMore: {
    eyebrow: "Tìm hiểu",
    title: "Thuê nhà",
    titleAccent: "dễ dàng",
    description: "Mô tả",
    image,
    videoUrl: "https://www.youtube.com/watch?v=abc",
    ctaLabel: "Liên hệ",
    ctaHref: "/lien-he",
  },
  faqs: [{ id: "f1", question: "Hỏi?", answer: "Đáp." }],
  showStrengths: true,
};

describe("resolveListingPageContent", () => {
  it("VI đủ dữ liệu → trả đủ, bỏ hàng từ khoá rỗng", () => {
    const content = resolveListingPageContent(settings({ listingPages: { rentals: viRentals } }), "rentals");
    expect(content.quickSearch).toEqual(["Căn hộ Quận 7", "Studio"]);
    expect(content.learnMore).toEqual({
      eyebrow: "Tìm hiểu",
      title: "Thuê nhà",
      titleAccent: "dễ dàng",
      description: "Mô tả",
      image,
      videoUrl: "https://www.youtube.com/watch?v=abc",
      cta: { label: "Liên hệ", href: "/lien-he" },
    });
    expect(content.faqs).toEqual([{ question: "Hỏi?", answer: "Đáp." }]);
    expect(content.showStrengths).toBe(true);
  });

  it("EN (fallbackLocale: false) bỏ hàng thiếu chữ EN, không rơi về VI; thiếu tiêu đề → learnMore null", () => {
    const en = {
      quickSearch: [{ id: "q1", label: "District 7 apartments" }, { id: "q2", label: null }],
      learnMore: { ...viRentals.learnMore, title: null, eyebrow: null },
      faqs: [{ id: "f1", question: "Q?", answer: null }, { id: "f2", question: "Q2?", answer: "A2." }],
    };
    const content = resolveListingPageContent(settings({ listingPages: { propertyPosts: en } }), "propertyPosts");
    expect(content.quickSearch).toEqual(["District 7 apartments"]);
    expect(content.learnMore).toBeNull();
    expect(content.faqs).toEqual([{ question: "Q2?", answer: "A2." }]);
  });

  it("khối trống / chưa có global → [] / null, dải Điểm mạnh mặc định bật", () => {
    expect(resolveListingPageContent(null, "rentals")).toEqual({ quickSearch: [], learnMore: null, faqs: [], showStrengths: true });
    expect(resolveListingPageContent(settings({ listingPages: { rentals: { quickSearch: null, learnMore: {}, faqs: null } } }), "rentals")).toEqual({
      quickSearch: [],
      learnMore: null,
      faqs: [],
      showStrengths: true,
    });
  });

  it("nút chỉ hiện khi đủ chữ + đường dẫn hợp lệ; ảnh chưa populate bị bỏ", () => {
    const block = (patch: Record<string, unknown>) =>
      resolveListingPageContent(settings({ listingPages: { rentals: { learnMore: { ...viRentals.learnMore, ...patch } } } }), "rentals").learnMore;
    expect(block({ ctaLabel: null })?.cta).toBeUndefined();
    expect(block({ ctaHref: "javascript:alert(1)" })?.cta).toBeUndefined();
    expect(block({ ctaHref: "//evil.example" })?.cta).toBeUndefined();
    expect(block({ ctaHref: "http://example.test" })?.cta).toBeUndefined();
    expect(block({ ctaHref: "https://example.test/a" })?.cta).toEqual({ label: "Liên hệ", href: "https://example.test/a" });
    expect(block({ image: "m1" })?.image).toBeUndefined();
  });

  it("cờ Điểm mạnh: Cho thuê / Tin BĐS theo showStrengths, Dự án theo showProjectStrengths sẵn có", () => {
    const value = settings({ showProjectStrengths: false, listingPages: { rentals: { showStrengths: false }, propertyPosts: { showStrengths: true } } });
    expect(resolveListingPageContent(value, "rentals").showStrengths).toBe(false);
    expect(resolveListingPageContent(value, "propertyPosts").showStrengths).toBe(true);
    expect(resolveListingPageContent(value, "projects").showStrengths).toBe(false);
    expect(resolveListingPageContent(settings({ showProjectStrengths: true }), "projects").showStrengths).toBe(true);
  });
});

describe("loadListingPageContent", () => {
  beforeEach(() => getSiteSettings.mockReset());

  it("đọc site-settings theo locale qua cache global", async () => {
    getSiteSettings.mockResolvedValue({ listingPages: { rentals: viRentals } });
    const content = await loadListingPageContent("en", "rentals");
    expect(getSiteSettings).toHaveBeenCalledWith("en");
    expect(content.quickSearch).toHaveLength(2);
  });

  it("global lỗi → nội dung trống, trang không vỡ", async () => {
    getSiteSettings.mockRejectedValueOnce(new Error("db down"));
    await expect(loadListingPageContent("vi", "projects")).resolves.toEqual({ quickSearch: [], learnMore: null, faqs: [], showStrengths: true });
  });
});
