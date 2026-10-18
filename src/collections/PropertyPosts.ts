import type { CollectionConfig, DateFieldValidation, GroupField } from "payload";
import { date } from "payload/shared";

import { validateCoverWhenPublished } from "../fields/cover-image";
import { requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { titleField } from "../fields/title";
import { validateWardWithOptionalProvince, wardFilterOptions } from "../fields/ward-in-province";
import { createRevalidateHomepageOnUnpublish } from "../hooks/homepage/revalidate-homepage-on-service";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import type { RevalidateTags } from "../hooks/revalidate-global";
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
  fields: [
    { name: "startAt", type: "date", admin: dayOnly },
    { name: "endAt", type: "date", index: true, admin: dayOnly, validate: validateOfferEnd },
    { name: "voucherCode", type: "text", maxLength: 64 },
    { name: "terms", type: "textarea", localized: true },
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
  return withContentDefaults(
    {
      slug: "property-posts",
      admin: { useAsTitle: "title", defaultColumns: ["title", "category", "status", "publishedAt", "author"] },
      defaultSort: "-publishedAt",
      hooks: { afterChange: [revalidateHomepage.afterChange], afterDelete: [revalidateHomepage.afterDelete] },
      fields: [
        titleField(),
        scopedCategoryField("property_post"),
        {
          name: "cover",
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image/" } },
          validate: validateCoverWhenPublished("Cần ảnh bìa trước khi xuất bản tin đăng."),
        },
        { name: "gallery", type: "upload", relationTo: "media", hasMany: true, filterOptions: { mimeType: { contains: "image/" } } },
        { name: "excerpt", type: "textarea", localized: true, validate: requiredByLocale("Tóm tắt không được để trống.") },
        { name: "content", type: "richText", localized: true, validate: requiredByLocale("Nội dung không được để trống.") },
        { name: "priceVnd", type: "number", min: 0 },
        { name: "priceNote", type: "text", localized: true },
        { name: "province", type: "relationship", relationTo: "provinces", index: true },
        { name: "ward", type: "relationship", relationTo: "wards", index: true, filterOptions: wardFilterOptions, validate: validateWardWithOptionalProvince },
        { name: "relatedProject", type: "relationship", relationTo: "projects", index: true },
        { name: "relatedRental", type: "relationship", relationTo: "rentals", index: true },
        offerGroup,
      ],
    },
    { englishRequiredFields: ["title", "slug", "excerpt", "content"], revalidate },
  );
}

export const PropertyPosts = createPropertyPosts();
