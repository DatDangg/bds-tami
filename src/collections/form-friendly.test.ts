import { describe, expect, it } from "vitest";

import { findLayoutField } from "../lib/admin/form-layout";
import { REQUIRED_MARK_CLASS } from "../fields/required-by-locale";
import { SUMMARY_PLACEHOLDER } from "../fields/title";
import { ADMIN_COLLECTIONS } from "./admin-collections";

const collection = (slug: string) => {
  const found = ADMIN_COLLECTIONS.find((candidate) => candidate.slug === slug);
  if (!found) throw new Error(`thiếu collection ${slug}`);
  return found;
};
const adminOf = (slug: string, name: string) => (findLayoutField(collection(slug).fields, name) as { admin?: { className?: string; placeholder?: string } } | undefined)?.admin;

describe("form dễ dùng (BL-042): từng collection nội dung", () => {
  it.each([
    ["projects", "VD: Vinhomes Grand Park"],
    ["rentals", "VD: Căn hộ 2PN view sông, đủ nội thất"],
    ["property-posts", "VD: Bán căn 3PN Vinhomes Central Park"],
    ["news", "VD: Thị trường căn hộ TP.HCM quý 4"],
    ["services", "VD: Tư vấn pháp lý mua nhà"],
    ["pages", "VD: Giới thiệu"],
    ["job-postings", "VD: Nhân viên kinh doanh BĐS"],
  ])("%s: ô Tiêu đề có placeholder riêng và dấu *", (slug, placeholder) => {
    expect(adminOf(slug, "title")).toMatchObject({ placeholder, className: REQUIRED_MARK_CLASS });
  });

  it.each([
    ["projects", "summary"],
    ["services", "summary"],
    ["news", "excerpt"],
    ["property-posts", "excerpt"],
  ])("%s.%s: có placeholder mô tả ngắn và dấu *", (slug, name) => {
    expect(adminOf(slug, name)).toMatchObject({ placeholder: SUMMARY_PLACEHOLDER, className: REQUIRED_MARK_CLASS });
  });

  it.each([
    ["news", "content"],
    ["property-posts", "content"],
    ["pages", "content"],
    ["rentals", "description"],
    ["job-postings", "description"],
    ["job-postings", "requirements"],
    ["projects", "category"],
    ["news", "category"],
  ])("%s.%s: trường bắt buộc theo ngôn ngữ có dấu *", (slug, name) => {
    expect(adminOf(slug, name)?.className).toContain(REQUIRED_MARK_CLASS);
  });

  it("danh mục của tin tuyển dụng không bắt buộc nên không có *", () => {
    expect(adminOf("job-postings", "category")?.className ?? "").not.toContain(REQUIRED_MARK_CLASS);
  });
});

describe("form dễ dùng (BL-042 T02): gợi ý dưới ô nhập", () => {
  const afterInput = (slug: string, name: string) =>
    (findLayoutField(collection(slug).fields, name) as { admin?: { components?: { afterInput?: string[] } } } | undefined)?.admin?.components?.afterInput ?? [];
  const COUNTER = "/components/admin/SummaryCounter#SummaryCounter";
  const WORDS = "/components/admin/PriceInWords#PriceInWords";

  it.each([
    ["projects", "summary"],
    ["services", "summary"],
    ["news", "excerpt"],
    ["property-posts", "excerpt"],
  ])("%s.%s: có bộ đếm ký tự", (slug, name) => expect(afterInput(slug, name)).toContain(COUNTER));

  it.each([
    ["projects", "priceFromVnd"],
    ["projects", "priceToVnd"],
    ["rentals", "priceMonthlyVnd"],
    ["property-posts", "priceVnd"],
    ["job-postings", "salaryMinVnd"],
    ["job-postings", "salaryMaxVnd"],
  ])("%s.%s: có dòng giá đọc bằng chữ, vẫn giữ ô Cell danh sách", (slug, name) => {
    expect(afterInput(slug, name)).toContain(WORDS);
    const admin = (findLayoutField(collection(slug).fields, name) as { admin?: { components?: { Cell?: string } } }).admin;
    if (slug !== "job-postings") expect(admin?.components?.Cell).toContain("VndCell");
  });

  it("bảng giá + ngày cập nhật: giá có dòng chữ, ngày có nút Hôm nay", () => {
    const table = findLayoutField(collection("projects").fields, "priceTable") as { fields: unknown[] };
    for (const name of ["priceFrom", "priceTo"]) {
      const field = findLayoutField(table.fields as never, name) as { admin?: { components?: { afterInput?: string[] } } };
      expect(field.admin?.components?.afterInput).toContain(WORDS);
    }
    expect(afterInput("projects", "priceUpdatedAt")).toContain("/components/admin/TodayButton#TodayButton");
  });

  it("danh mục dự án lọc theo đúng loại (filterOptions)", () => {
    expect((findLayoutField(collection("projects").fields, "category") as { filterOptions?: unknown }).filterOptions).toEqual({ scope: { equals: "project" } });
  });
});
