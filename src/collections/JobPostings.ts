import type { CollectionConfig, NumberFieldSingleValidation, SelectField } from "payload";
import { number } from "payload/shared";

import { requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { titleField } from "../fields/title";
import { guardJobPostingHardDelete } from "../hooks/job-postings/guard-delete";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { withContentDefaults } from "./_shared/content-defaults";

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "internship", "contract"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  internship: "Thực tập",
  contract: "Hợp đồng",
};

const employmentTypeField: SelectField = {
  name: "employmentType",
  type: "select",
  required: true,
  options: EMPLOYMENT_TYPES.map((value) => ({ label: EMPLOYMENT_TYPE_LABELS[value], value })),
};

/**
 * Lương tối đa không được nhỏ hơn lương tối thiểu: hai số này đi thẳng vào `baseSalary` của JSON-LD `JobPosting`, nên khoảng
 * ngược sẽ làm Google từ chối dữ liệu có cấu trúc. Chạy validator mặc định của Payload trước (giữ `min: 0`); `siblingData`
 * của lần sửa một phần có thể thiếu `salaryMinVnd`, nên không so khi không có giá trị tối thiểu trong lần gửi này.
 */
const validateSalaryMax: NumberFieldSingleValidation = (value, options) => {
  const base = number(value, options);
  if (base !== true) return base;
  const min = (options.siblingData as { salaryMinVnd?: number | null } | undefined)?.salaryMinVnd;
  return typeof value === "number" && typeof min === "number" && value < min
    ? "Lương tối đa không được nhỏ hơn lương tối thiểu."
    : true;
};

/**
 * Tin tuyển dụng (ERD §4.10, FR-ADM-05): sale tạo và sửa/xoá mềm tin của mình, admin sửa mọi tin và là người duy nhất xoá hẳn/khôi
 * phục (PERMISSION §3.1; access mặc định của `withContentDefaults`). `category` thuộc scope `job` và TUỲ CHỌN (ERD §4.10, G25: cột DB vốn nullable, chỉ bỏ kiểm bắt buộc ở validator; có giá trị thì vẫn phải đúng scope). Không có `isFeatured` (ERD
 * không định nghĩa khối tuyển dụng nổi bật). `deadline` bắt buộc: "quá hạn thì tự ẩn khỏi danh sách" do truy vấn danh sách công
 * khai áp (layer 6), không phải access đọc, vì trang chi tiết vẫn cần tồn tại cho đường dẫn đã chia sẻ. Index tổng hợp
 * `(status, has_english, deadline)` là SQL tuỳ biến trong migration `job_postings`. `revalidate` chỉ để test ghi đè.
 */
export function createJobPostings(revalidate?: RevalidatePaths): CollectionConfig {
  return withContentDefaults(
    {
      slug: "job-postings",
      admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "category", "employmentType", "deadline", "status", "author"],
      },
      defaultSort: "-publishedAt",
      hooks: { beforeDelete: [guardJobPostingHardDelete] },
      fields: [
        titleField(),
        scopedCategoryField("job", { required: false }),
        { name: "province", type: "relationship", relationTo: "provinces", index: true },
        { name: "workplace", type: "text" },
        employmentTypeField,
        { name: "salaryMinVnd", type: "number", min: 0 },
        { name: "salaryMaxVnd", type: "number", min: 0, validate: validateSalaryMax },
        { name: "salaryText", type: "text", localized: true },
        { name: "quantity", type: "number", min: 1 },
        {
          name: "deadline",
          type: "date",
          required: true,
          index: true,
          admin: { date: { pickerAppearance: "dayOnly" } },
        },
        { name: "description", type: "richText", localized: true, validate: requiredByLocale("Mô tả công việc không được để trống.") },
        { name: "requirements", type: "richText", localized: true, validate: requiredByLocale("Yêu cầu ứng viên không được để trống.") },
        { name: "benefits", type: "richText", localized: true },
      ],
    },
    { englishRequiredFields: ["title", "slug", "description", "requirements"], omit: ["isFeatured"], revalidate },
  );
}

export const JobPostings = createJobPostings();
