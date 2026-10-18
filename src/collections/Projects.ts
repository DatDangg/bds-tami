import type {
  ArrayField,
  CollectionConfig,
  GroupField,
  UploadField,
  UploadFieldManyValidation,
} from "payload";
import { upload } from "payload/shared";

import { requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { searchReindexPendingField } from "../fields/search-reindex-pending";
import { titleField } from "../fields/title";
import { validateWardInProvince, wardFilterOptions } from "../fields/ward-in-province";
import { reindexRentalsOnProjectRename } from "../hooks/projects/reindex-rentals";
import { createRevalidateHomepageOnUnpublish } from "../hooks/homepage/revalidate-homepage-on-service";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import type { RevalidateTags } from "../hooks/revalidate-global";
import { withContentDefaults } from "./_shared/content-defaults";

export const SALES_STATUSES = ["upcoming", "selling", "handed_over"] as const;
export type SalesStatus = (typeof SALES_STATUSES)[number];

const SALES_STATUS_LABELS: Record<SalesStatus, string> = {
  upcoming: "Sắp mở bán",
  selling: "Đang mở bán",
  handed_over: "Đã bàn giao",
};

/**
 * Thư viện ảnh là nguồn ảnh đại diện (ảnh đầu tiên) của thẻ dự án và hero trang chi tiết, nên bắt buộc có ít nhất một ảnh khi
 * xuất bản (ERD §4.5); bản nháp được thiếu để sale lưu dở. `data` của lần sửa một phần có thể thiếu `gallery` dù bản đã lưu có,
 * nên giá trị đã lưu (`previousValue`) cũng được tính. Chạy validator `upload` mặc định của Payload trước: validator tuỳ biến thay hẳn bản
 * mặc định nên nếu không gọi thì `filterOptions` (chỉ ảnh, không nhận PDF) và kiểm id hợp lệ không còn áp ở server (id sai → 500 thay vì 400).
 */
const validateGallery: UploadFieldManyValidation = async (value, options) => {
  const base = await upload(value, options);
  if (base !== true) return base;
  const { data, previousValue } = options;
  const publishing = (data as { status?: string } | undefined)?.status === "published";
  const current = value === undefined ? previousValue : value;
  const hasImage = Array.isArray(current) && current.length > 0;
  return publishing && !hasImage ? "Cần ít nhất một ảnh trong thư viện ảnh trước khi xuất bản dự án." : true;
};

const imageMimeType = { contains: "image/" };
const imageFilter = { mimeType: imageMimeType };

const mediaUpload = (name: string, mimeType: Record<string, string>, required = false): UploadField => ({
  name,
  type: "upload",
  relationTo: "media",
  required,
  filterOptions: { mimeType },
});

const nonNegativeNumber = (name: string) => ({ name, type: "number", min: 0 }) as const;

const scaleGroup: GroupField = {
  name: "scale",
  type: "group",
  fields: [
    nonNegativeNumber("totalUnits"),
    nonNegativeNumber("blocks"),
    nonNegativeNumber("floors"),
    nonNegativeNumber("landAreaM2"),
    { name: "handoverTime", type: "text", localized: true },
  ],
};

const amenitiesField: ArrayField = {
  name: "amenities",
  type: "array",
  fields: [
    { name: "name", type: "text", localized: true, required: true },
    { name: "icon", type: "text" },
  ],
};

const floorPlansField: ArrayField = {
  name: "floorPlans",
  type: "array",
  fields: [
    { name: "title", type: "text", localized: true, required: true },
    mediaUpload("image", imageMimeType, true),
  ],
};

/**
 * Dự án (ERD §4.5, FR-ADM-01): sale tạo và sửa/xoá mềm dự án của mình, admin sửa mọi dự án và là người duy nhất xoá hẳn/khôi
 * phục (PERMISSION §3.1; access mặc định của `withContentDefaults`). `category` thuộc scope `project`. Index tổng hợp
 * `(status, has_english, sales_status, province_id)` và GIST `location` (ERD §5) là SQL tuỳ biến trong migration `projects`:
 * Payload chỉ sinh btree cho `point` và đặt tên index tổng hợp kém ổn định. `revalidate` chỉ để test ghi đè.
 * Đổi `title` dựng lại `searchText` của tin thuộc dự án (hook `afterChange`); nhiều tin thì job nền + cảnh báo trên form (`searchReindexPendingField`, chỉ admin thấy).
 */
export function createProjects(revalidate?: RevalidatePaths, revalidateTags?: RevalidateTags): CollectionConfig {
  const revalidateHomepage = createRevalidateHomepageOnUnpublish({ paths: revalidate, tags: revalidateTags });
  return withContentDefaults(
    {
      slug: "projects",
      admin: { useAsTitle: "title", defaultColumns: ["title", "category", "salesStatus", "status", "publishedAt", "author"] },
      defaultSort: "-publishedAt",
      hooks: { afterChange: [reindexRentalsOnProjectRename, revalidateHomepage.afterChange], afterDelete: [revalidateHomepage.afterDelete] },
      fields: [
        searchReindexPendingField("project"),
        titleField(),
        scopedCategoryField("project"),
        { name: "developer", type: "relationship", relationTo: "developers", index: true },
        {
          name: "salesStatus",
          type: "select",
          required: true,
          index: true,
          options: SALES_STATUSES.map((value) => ({ label: SALES_STATUS_LABELS[value], value })),
        },
        { name: "province", type: "relationship", relationTo: "provinces", required: true, index: true },
        // Phường phải thuộc `province` đã chọn: `filterOptions` cho ô chọn trong admin, `validate` kiểm lại ở server (API/seed cũng bị chặn).
        { name: "ward", type: "relationship", relationTo: "wards", index: true, filterOptions: wardFilterOptions, validate: validateWardInProvince },
        { name: "address", type: "text" },
        { name: "location", type: "point" },
        nonNegativeNumber("priceFromVnd"),
        nonNegativeNumber("priceToVnd"),
        nonNegativeNumber("areaFromM2"),
        nonNegativeNumber("areaToM2"),
        scaleGroup,
        { name: "summary", type: "textarea", localized: true, validate: requiredByLocale("Mô tả ngắn không được để trống.") },
        { name: "overview", type: "richText", localized: true },
        amenitiesField,
        {
          name: "gallery",
          type: "upload",
          relationTo: "media",
          hasMany: true,
          filterOptions: imageFilter,
          validate: validateGallery,
        },
        floorPlansField,
        { ...mediaUpload("documents", { equals: "application/pdf" }), hasMany: true },
        { name: "legalInfo", type: "richText", localized: true },
        { name: "salesPolicy", type: "richText", localized: true },
      ],
    },
    { englishRequiredFields: ["title", "slug", "summary", "overview"], revalidate },
  );
}

export const Projects = createProjects();
