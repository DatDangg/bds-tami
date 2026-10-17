import type { EmploymentType } from "../../collections/JobPostings";
import type { Locale } from "../../i18n/routing";
import type { JobPosting, Province } from "../../payload-types";
import type { JobEmploymentType, JobPostingInput } from "../seo/json-ld";
import { validThroughIso } from "./deadline";
import { jobDescriptionHtml } from "./job-view";

/** `employmentType` của ERD §4.10 → giá trị Google/schema.org (`internship` → `INTERN`, `contract` → `CONTRACTOR`). */
const EMPLOYMENT_TYPE_LD: Record<EmploymentType, JobEmploymentType> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  internship: "INTERN",
  contract: "CONTRACTOR",
};

export interface JobJsonLdContext {
  locale: Locale;
  /** URL tuyệt đối của trang. */
  url: string;
  hiringOrganization: JobPostingInput["hiringOrganization"];
  /** Tiêu đề từng phần ở ngôn ngữ trang, dùng trong `description` HTML. */
  headings: { description: string; requirements: string; benefits: string };
}

function positive(value: number | null | undefined): number | null {
  return typeof value === "number" && value > 0 ? value : null;
}

/**
 * Dữ liệu cho JSON-LD `JobPosting` của một tin CÒN HẠN, hoặc `null` khi thiếu trường Google bắt buộc/khuyến nghị mà ta không thể
 * tự bịa (mô tả rỗng, hạn hỏng, không có ngày đăng): thà bỏ JSON-LD còn hơn phát dữ liệu Google sẽ từ chối.
 * Trang tin HẾT HẠN không gọi hàm này (SPECIFICATIONS F6 / DESIGN.md §305: bỏ JSON-LD): xem `tuyen-dung/[slug]/page.tsx`.
 * `validThrough` = cuối ngày hạn chót giờ VN; lương chỉ khai khi có số (chữ "Thỏa thuận" không thành `baseSalary`).
 */
export function toJobPostingJsonLdInput(doc: JobPosting, context: JobJsonLdContext): JobPostingInput | null {
  const description = jobDescriptionHtml(doc, context.headings);
  const validThrough = validThroughIso(doc.deadline);
  const datePosted = doc.publishedAt ?? doc.createdAt;
  if (!doc.title || !description || !validThrough || !datePosted) return null;
  const min = positive(doc.salaryMinVnd);
  const max = positive(doc.salaryMaxVnd);
  const province = doc.province && typeof doc.province === "object" ? ((doc.province as Province).shortName || (doc.province as Province).name) : null;
  return {
    locale: context.locale,
    title: doc.title,
    url: context.url,
    description,
    datePosted,
    validThrough,
    employmentType: EMPLOYMENT_TYPE_LD[doc.employmentType],
    hiringOrganization: context.hiringOrganization,
    location: { streetAddress: doc.workplace?.trim() || null, province },
    baseSalary: min !== null || max !== null ? { currency: "VND", minValue: min, maxValue: max } : null,
  };
}
