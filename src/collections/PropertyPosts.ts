import type { CollapsibleField, CollectionConfig, DateFieldValidation, GroupField } from "payload";
import { date } from "payload/shared";

import { PUBLIC_STATUSES } from "../access";
import { validateCoverWhenPublished } from "../fields/cover-image";
import { withPriceInWords, withSummaryCounter } from "../fields/form-hints";
import { nonNegativeNumber, selectOptions } from "../fields/listing-field-helpers";
import { markRequired, requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { SUMMARY_PLACEHOLDER, titleField } from "../fields/title";
import { validateWardWithOptionalProvince, wardFilterOptions } from "../fields/ward-in-province";
import { createRevalidateProjectOnListing } from "../hooks/projects/revalidate-project-on-listing";
import { createRevalidateHomepageOnUnpublish } from "../hooks/homepage/revalidate-homepage-on-service";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import type { RevalidateTags } from "../hooks/revalidate-global";
import { collectionLabels } from "../lib/admin/collection-labels";
import { formRow, formTabs } from "../lib/admin/form-layout";
import { hideTechnicalListFields } from "../lib/admin/list-filter";
import {
  DIRECTION_ADMIN_LABELS,
  DIRECTIONS,
  HANDOVER_CONDITION_ADMIN_LABELS,
  HANDOVER_CONDITIONS,
  PROPERTY_TYPE_ADMIN_LABELS,
  PROPERTY_TYPES,
} from "../shared/listing-options";
import { withContentDefaults } from "./_shared/content-defaults";

/** Ngày kết thúc không được trước ngày bắt đầu (`siblingData` đã gộp giá trị đã lưu nên sửa riêng một đầu vẫn bị so với đầu kia). */
const validateOfferEnd: DateFieldValidation = (value, options) => {
  const base = date(value, options);
  if (base !== true) return base;
  const startAt = (options.siblingData as { startAt?: string | null } | undefined)?.startAt;
  if (!value || !startAt) return true;
  return new Date(value).getTime() < new Date(startAt).getTime() ? "Ngày kết thúc ưu đãi không được trước ngày bắt đầu." : true;
};

const dayOnly = { date: { pickerAppearance: "dayOnly" } } as const;

/**
 * Ưu đãi (ERD §4.7, BR-06): `endAt` là NGÀY kết thúc giờ VN; "Đã kết thúc" tính bởi `isOfferEnded` (`lib/content/offer-status`), không lưu cờ
 * nào trong DB. `endAt` có index đơn cho truy vấn job `expire-offers`; index tổng hợp `(status, is_featured, offer_end_at)` ở migration.
 */
const offerGroup: GroupField = {
  name: "offer",
  type: "group",
  label: "Ưu đãi / voucher",
  fields: [
    { name: "startAt", type: "date", label: "Bắt đầu ưu đãi", admin: dayOnly },
    { name: "endAt", type: "date", label: "Kết thúc ưu đãi", index: true, admin: dayOnly, validate: validateOfferEnd },
    { name: "voucherCode", type: "text", label: "Mã voucher", maxLength: 64 },
    { name: "terms", type: "textarea", label: "Điều kiện áp dụng", localized: true },
  ],
};

/**
 * Thông số bất động sản (BL-052): toàn bộ tuỳ chọn, không localized, không nằm trong `englishRequiredFields` nên tin cũ / tin voucher để
 * trống vẫn lưu và xuất bản được (UI công khai ẩn ô trống). Vỏ `collapsible` không tên nên trường nằm ở cấp gốc (`propertyType`, `areaM2`…),
 * không đổi đường dẫn dữ liệu. `address` + `location` công khai — tin BĐS không có cơ chế ẩn địa chỉ như tin cho thuê.
 */
const specsSection: CollapsibleField = {
  type: "collapsible",
  label: "Thông số bất động sản",
  admin: { description: "Để trống nếu tin là voucher/ưu đãi." },
  fields: [
    formRow(
      { name: "propertyType", type: "select", label: "Loại hình", index: true, options: selectOptions(PROPERTY_TYPES, PROPERTY_TYPE_ADMIN_LABELS) },
      nonNegativeNumber("areaM2", "Diện tích (m²)", { index: true }),
    ),
    formRow(nonNegativeNumber("bedrooms", "Số phòng ngủ"), nonNegativeNumber("bathrooms", "Số phòng tắm")),
    formRow(
      { name: "houseDirection", type: "select", label: "Hướng nhà", options: selectOptions(DIRECTIONS, DIRECTION_ADMIN_LABELS) },
      { name: "handoverCondition", type: "select", label: "Tình trạng bàn giao", options: selectOptions(HANDOVER_CONDITIONS, HANDOVER_CONDITION_ADMIN_LABELS) },
    ),
    formRow(nonNegativeNumber("frontageM", "Mặt tiền (m)"), nonNegativeNumber("floors", "Số tầng")),
    { name: "address", type: "text", label: "Địa chỉ", admin: { description: "Hiện công khai trên trang tin. Vd: 12 Nguyễn Huệ, Phường Sài Gòn." } },
    { name: "location", type: "point", label: "Toạ độ bản đồ", admin: { description: "Hiện công khai trên bản đồ trang tin." } },
  ],
};

/**
 * Đăng tin BĐS (ERD §4.7, FR-ADM-03): tin, voucher, ưu đãi. Sale tạo và sửa/xoá mềm bài của mình, admin sửa mọi bài và là người duy nhất
 * xoá hẳn/khôi phục (PERMISSION §3.1; access mặc định của `withContentDefaults`). `category` thuộc scope `property_post`. `province`/`ward`/
 * `relatedProject`/`relatedRental` đều tuỳ chọn; `ward` phải thuộc `province` (G22) và không có tỉnh thì không được chọn phường.
 * `cover` bắt buộc khi xuất bản (bản nháp được thiếu, như tin tức). Index tổng hợp `(status, has_english, category_id, published_at DESC)` và
 * `(status, is_featured, offer_end_at)` (ERD §5) là SQL tuỳ biến trong migration `property_posts`. `revalidate` chỉ để test ghi đè.
 */
export function createPropertyPosts(revalidate?: RevalidatePaths, revalidateTags?: RevalidateTags): CollectionConfig {
  const revalidateHomepage = createRevalidateHomepageOnUnpublish({ paths: revalidate, tags: revalidateTags });
  const revalidateProject = createRevalidateProjectOnListing({ field: "relatedProject", publicStatuses: PUBLIC_STATUSES.default, revalidate });
  const collection = withContentDefaults(
    {
      slug: "property-posts",
      labels: collectionLabels("property-posts"),
      admin: {
        useAsTitle: "title",
        defaultColumns: ["cover", "title", "category", "status", "publishedAt", "author"],
        components: { beforeListTable: ["/components/admin/CollectionQuickFilterSlot#CollectionQuickFilterSlot"] },
        description: "Tin đăng bất động sản (mua bán, voucher, ưu đãi) có thể gắn với dự án hoặc tin cho thuê.",
      },
      defaultSort: "-publishedAt",
      hooks: { afterChange: [revalidateHomepage.afterChange, revalidateProject.afterChange], afterDelete: [revalidateHomepage.afterDelete, revalidateProject.afterDelete] },
      fields: [
        formTabs([
          {
            label: "Nội dung",
            fields: [
              titleField({ placeholder: "VD: Bán căn 3PN Vinhomes Central Park" }),
              scopedCategoryField("property_post"),
              withSummaryCounter(markRequired({ name: "excerpt", type: "textarea", label: "Tóm tắt", localized: true, validate: requiredByLocale("Tóm tắt không được để trống."), admin: { placeholder: SUMMARY_PLACEHOLDER } })),
              markRequired({ name: "content", type: "richText", label: "Nội dung", localized: true, validate: requiredByLocale("Nội dung không được để trống.") }),
            ],
          },
          {
            label: "Thông tin tin đăng",
            fields: [
              formRow(
                withPriceInWords({ name: "priceVnd", type: "number", label: "Giá (VNĐ)", min: 0, admin: { components: { Cell: "/components/admin/VndCell#VndCell" } } }),
                { name: "priceNote", type: "text", label: "Ghi chú giá", localized: true, admin: { description: "Vd: Giá thương lượng, Giá chưa gồm VAT." } },
              ),
              formRow(
                { name: "province", type: "relationship", label: "Tỉnh/thành", relationTo: "provinces", index: true },
                { name: "ward", type: "relationship", label: "Phường/xã", relationTo: "wards", index: true, filterOptions: wardFilterOptions, validate: validateWardWithOptionalProvince },
              ),
              formRow(
                { name: "relatedProject", type: "relationship", label: "Dự án liên quan", relationTo: "projects", index: true },
                { name: "relatedRental", type: "relationship", label: "Tin cho thuê liên quan", relationTo: "rentals", index: true },
              ),
              specsSection,
              offerGroup,
            ],
          },
          {
            label: "Hình ảnh",
            fields: [
              {
                name: "cover",
                type: "upload",
                label: "Ảnh bìa",
                relationTo: "media",
                filterOptions: { mimeType: { contains: "image/" } },
                validate: validateCoverWhenPublished("Cần ảnh bìa trước khi xuất bản tin đăng."),
                admin: { components: { Cell: "/components/admin/ThumbnailCell#ThumbnailCell" } },
              },
              { name: "gallery", type: "upload", label: "Thư viện ảnh", relationTo: "media", hasMany: true, filterOptions: { mimeType: { contains: "image/" } } },
            ],
          },
        ]),
      ],
    },
    { englishRequiredFields: ["title", "slug", "excerpt", "content"], revalidate },
  );
  // Chỉ để lại trường nghiệp vụ trong "Thêm bộ lọc" (BL-021 #06): priceNote, offer.voucherCode, address ẩn thêm ngoài quy tắc theo kiểu trường + SEO/bản dịch/slug.
  return hideTechnicalListFields(collection, ["priceNote", "offer.voucherCode", "address"]);
}

export const PropertyPosts = createPropertyPosts();
