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
import { collectionLabels } from "../lib/admin/collection-labels";
import { textRowLabel } from "../lib/admin/row-label";
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

const mediaUpload = (name: string, label: string, mimeType: Record<string, string>, required = false): UploadField => ({
  name,
  type: "upload",
  label,
  relationTo: "media",
  required,
  filterOptions: { mimeType },
});

const nonNegativeNumber = (name: string, label: string) => ({ name, type: "number", label, min: 0 }) as const;

const scaleGroup: GroupField = {
  name: "scale",
  type: "group",
  label: "Quy mô dự án",
  fields: [
    nonNegativeNumber("totalUnits", "Tổng số căn"),
    nonNegativeNumber("blocks", "Số tòa/block"),
    nonNegativeNumber("floors", "Số tầng"),
    nonNegativeNumber("landAreaM2", "Diện tích đất (m²)"),
    { name: "handoverTime", type: "text", label: "Thời gian bàn giao", localized: true },
  ],
};

const amenitiesField: ArrayField = {
  name: "amenities",
  type: "array",
  label: "Tiện ích",
  labels: { singular: "Tiện ích", plural: "Tiện ích" },
  admin: { components: { RowLabel: textRowLabel({ field: "name", fallback: "Tiện ích" }) } },
  fields: [
    { name: "name", type: "text", label: "Tên tiện ích", localized: true, required: true },
    { name: "icon", type: "text", label: "Mã icon", admin: { description: "Tên icon hiển thị kèm tiện ích (tuỳ chọn)." } },
  ],
};

const floorPlansField: ArrayField = {
  name: "floorPlans",
  type: "array",
  label: "Mặt bằng",
  labels: { singular: "Mặt bằng", plural: "Mặt bằng" },
  admin: { components: { RowLabel: textRowLabel({ field: "title", fallback: "Mặt bằng" }) } },
  fields: [
    { name: "title", type: "text", label: "Tên mặt bằng", localized: true, required: true },
    mediaUpload("image", "Ảnh mặt bằng", imageMimeType, true),
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
      labels: collectionLabels("projects"),
      admin: {
        useAsTitle: "title",
        defaultColumns: ["gallery", "title", "category", "salesStatus", "status", "publishedAt", "author"],
        description: "Dự án bất động sản giới thiệu trên website: thông tin, quy mô, tiện ích, mặt bằng và tài liệu.",
      },
      defaultSort: "-publishedAt",
      hooks: { afterChange: [reindexRentalsOnProjectRename, revalidateHomepage.afterChange], afterDelete: [revalidateHomepage.afterDelete] },
      fields: [
        searchReindexPendingField("project"),
        titleField(),
        scopedCategoryField("project"),
        { name: "developer", type: "relationship", label: "Chủ đầu tư", relationTo: "developers", index: true },
        {
          name: "salesStatus",
          type: "select",
          label: "Tình trạng mở bán",
          required: true,
          index: true,
          admin: { components: { Cell: "/components/admin/StatusBadge#StatusBadgeCell" } },
          options: SALES_STATUSES.map((value) => ({ label: SALES_STATUS_LABELS[value], value })),
        },
        { name: "province", type: "relationship", label: "Tỉnh/thành", relationTo: "provinces", required: true, index: true },
        // Phường phải thuộc `province` đã chọn: `filterOptions` cho ô chọn trong admin, `validate` kiểm lại ở server (API/seed cũng bị chặn).
        { name: "ward", type: "relationship", label: "Phường/xã", relationTo: "wards", index: true, filterOptions: wardFilterOptions, validate: validateWardInProvince },
        { name: "address", type: "text", label: "Địa chỉ" },
        { name: "location", type: "point", label: "Toạ độ bản đồ" },
        nonNegativeNumber("priceFromVnd", "Giá từ (VNĐ)"),
        nonNegativeNumber("priceToVnd", "Giá đến (VNĐ)"),
        nonNegativeNumber("areaFromM2", "Diện tích từ (m²)"),
        nonNegativeNumber("areaToM2", "Diện tích đến (m²)"),
        scaleGroup,
        { name: "summary", type: "textarea", label: "Mô tả ngắn", localized: true, validate: requiredByLocale("Mô tả ngắn không được để trống.") },
        { name: "overview", type: "richText", label: "Tổng quan dự án", localized: true },
        amenitiesField,
        {
          name: "gallery",
          type: "upload",
          label: "Thư viện ảnh",
          relationTo: "media",
          hasMany: true,
          filterOptions: imageFilter,
          validate: validateGallery,
          admin: { description: "Ảnh đầu tiên là ảnh đại diện của dự án.", components: { Cell: "/components/admin/ThumbnailCell#ThumbnailCell" } },
        },
        floorPlansField,
        { ...mediaUpload("documents", "Tài liệu (PDF)", { equals: "application/pdf" }), hasMany: true },
        { name: "legalInfo", type: "richText", label: "Pháp lý", localized: true },
        { name: "salesPolicy", type: "richText", label: "Chính sách bán hàng", localized: true },
      ],
    },
    { englishRequiredFields: ["title", "slug", "summary", "overview"], revalidate },
  );
}

export const Projects = createProjects();
