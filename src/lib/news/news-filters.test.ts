import { describe, expect, it } from "vitest";
import { isFilteredNews, newsCurrentParams, newsQueryString, parseNewsFilters } from "./news-filters";

describe("parseNewsFilters", () => {
  it("đọc q / tag / sort, cắt khoảng trắng, khoá lặp lấy giá trị đầu", () => {
    expect(parseNewsFilters({ q: "  Đông Anh ", tag: ["dự án", "x"], sort: "oldest" }, "vi")).toEqual({ q: "Đông Anh", tag: "dự án", sort: "oldest" });
  });

  it("giá trị rỗng / quá dài / sort lạ bị bỏ; sort mặc định newest", () => {
    expect(parseNewsFilters({ q: "   ", tag: "x".repeat(101), sort: "price_asc" }, "vi")).toEqual({ sort: "newest" });
    expect(parseNewsFilters({}, "vi")).toEqual({ sort: "newest" });
  });

  it("/en bỏ qua tag (news.tags chưa có bản EN)", () => {
    expect(parseNewsFilters({ tag: "dự án", q: "hanoi" }, "en")).toEqual({ q: "hanoi", sort: "newest" });
  });
});

describe("isFilteredNews / newsQueryString / newsCurrentParams", () => {
  it("lọc khi có q, tag hoặc sort khác mặc định", () => {
    expect(isFilteredNews({ sort: "newest" })).toBe(false);
    expect(isFilteredNews({ q: "a", sort: "newest" })).toBe(true);
    expect(isFilteredNews({ tag: "a", sort: "newest" })).toBe(true);
    expect(isFilteredNews({ sort: "oldest" })).toBe(true);
  });

  it("chuỗi truy vấn thứ tự cố định, mặc định không lên URL", () => {
    expect(newsQueryString({ sort: "newest" })).toBe("");
    expect(newsQueryString({ sort: "newest" }, 2)).toBe("?page=2");
    expect(newsQueryString({ q: "đông anh", tag: "dự án", sort: "oldest" }, 3)).toBe(`?q=${encodeURIComponent("đông anh").replace("%20", "+")}&tag=${encodeURIComponent("dự án").replace("%20", "+")}&sort=oldest&page=3`);
    expect(newsCurrentParams({ q: "a", sort: "newest" })).toEqual({ q: "a" });
    expect(newsCurrentParams({ tag: "b", sort: "oldest" })).toEqual({ tag: "b", sort: "oldest" });
  });
});
