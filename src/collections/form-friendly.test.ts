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
