import type { CollectionConfig, DateField, FieldAccess, GroupField, SelectField, TextField } from "payload";

import { denyAll, isStaff, PUBLIC_STATUSES } from "../access";
import { requiredByLocale } from "../fields/required-by-locale";
import { scopedCategoryField } from "../fields/scoped-category";
import { RENTAL_STATUSES } from "../fields/status";
import { titleField } from "../fields/title";
import { assignRentalCode } from "../hooks/rentals/generate-code";
import { buildRentalSearchText, refreshOtherLocaleSearchText } from "../hooks/rentals/build-search-text";
import {
  validateAreaM2,
  validateGallery,
  validatePriceMonthly,
  validateVideoUrl,
  validateWardInProvince,
  wardFilterOptions,
} from "../hooks/rentals/field-validators";
import { stampRentedAt } from "../hooks/rentals/stamp-rented-at";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { withContentDefaults } from "./_shared/content-defaults";

export const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export const FURNISHINGS = ["none", "basic", "full"] as const;
export const PAYMENT_CYCLES = ["monthly", "quarterly", "semiannual", "annual"] as const;
export const INCLUDED_SERVICES = ["electricity", "water", "internet", "cleaning", "laundry", "parking", "management_fee", "security"] as const;

const DIRECTION_LABELS: Record<(typeof DIRECTIONS)[number], string> = {
  N: "Bắc",
  NE: "Đông Bắc",
  E: "Đông",
  SE: "Đông Nam",
  S: "Nam",
  SW: "Tây Nam",
  W: "Tây",
  NW: "Tây Bắc",
};
const FURNISHING_LABELS: Record<(typeof FURNISHINGS)[number], string> = { none: "Không nội thất", basic: "Cơ bản", full: "Đầy đủ" };
const PAYMENT_CYCLE_LABELS: Record<(typeof PAYMENT_CYCLES)[number], string> = {
  monthly: "Hàng tháng",
  quarterly: "Hàng quý",
  semiannual: "6 tháng",
  annual: "Hàng năm",
};
const SERVICE_LABELS: Record<(typeof INCLUDED_SERVICES)[number], string> = {
  electricity: "Điện",
  water: "Nước",
  internet: "Internet",
  cleaning: "Dọn phòng",
  laundry: "Giặt ủi",
  parking: "Giữ xe",
  management_fee: "Phí quản lý",
  security: "An ninh",
};

const selectOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ label: labels[value], value }));

const directionField = (name: string): SelectField => ({ name, type: "select", options: selectOptions(DIRECTIONS, DIRECTION_LABELS) });
const nonNegativeNumber = (name: string) => ({ name, type: "number", min: 0 }) as const;

/** Mã `CT-000001` (ERD §4.6): chỉ đọc với mọi người (PERMISSION §4), do hook `assignRentalCode` sinh từ sequence. */
const codeField: TextField = {
  name: "code",
  type: "text",
  required: true,
  unique: true,
  access: { create: denyAll, update: denyAll },
  admin: { readOnly: true, position: "sidebar" },
};

/** Thời điểm chuyển sang `rented`, hệ thống ghi (hook `stampRentedAt`). */
const rentedAtField: DateField = {
  name: "rentedAt",
  type: "date",
  access: { create: denyAll, update: denyAll },
  hooks: { beforeChange: [stampRentedAt] },
  admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } },
};

/**
 * Số nhà và toạ độ chính xác (ERD §4.6): nhân viên luôn đọc; khách chỉ khi tin bật `showExactAddress`. Phải chặn ở cấp trường vì
 * REST/GraphQL mặc định của Payload mở công khai cho tin `published`/`rented`. Truy vấn `where`/`sort` theo trường này không có
 * `doc` nên khách bị từ chối, không dò được giá trị.
 */
const readExactAddress: FieldAccess = ({ req, doc }) => isStaff({ req }) || doc?.showExactAddress === true;

/** Chuỗi tìm kiếm không dấu theo từng ngôn ngữ (ERD §6): chỉ nhân viên đọc/lọc được (khách không dùng làm "oracle" dò số nhà), hook ghi. */
const searchTextField: TextField = {
  name: "searchText",
  type: "text",
  localized: true,
  hidden: true,
  access: { read: isStaff, create: denyAll, update: denyAll },
  admin: { hidden: true },
};

const rentalTermsGroup: GroupField = {
  name: "rentalTerms",
  type: "group",
  fields: [
    nonNegativeNumber("minLeaseMonths"),
    nonNegativeNumber("depositMonths"),
    { name: "paymentCycle", type: "select", options: selectOptions(PAYMENT_CYCLES, PAYMENT_CYCLE_LABELS) },
    { name: "includedServices", type: "select", hasMany: true, options: selectOptions(INCLUDED_SERVICES, SERVICE_LABELS) },
    { name: "availableFrom", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
  ],
};

/**
 * Tin cho thuê (ERD §4.6, FR-ADM-02): sale tạo và sửa/xoá mềm tin của mình, admin sửa mọi tin và là người duy nhất xoá hẳn/khôi phục
 * (PERMISSION §3.1; access mặc định của `withContentDefaults`). Khách thấy `published` + `rented`. `category` thuộc scope `rental`;
 * `ward` phải thuộc `province` (G22). Index tổng hợp, GIST `location` (ERD §5) và `CREATE SEQUENCE rentals_code_seq` là SQL tuỳ
 * biến trong migration `rentals`; index trigram `search_text` làm ở task SearchService. `revalidate` chỉ để test ghi đè.
 */
export function createRentals(revalidate?: RevalidatePaths): CollectionConfig {
  return withContentDefaults(
    {
      slug: "rentals",
      admin: { useAsTitle: "title", defaultColumns: ["code", "title", "category", "priceMonthlyVnd", "status", "author"] },
      defaultSort: "-publishedAt",
      hooks: {
        beforeValidate: [assignRentalCode],
        beforeChange: [buildRentalSearchText],
        afterChange: [refreshOtherLocaleSearchText],
      },
      fields: [
        codeField,
        titleField(),
        scopedCategoryField("rental"),
        { name: "project", type: "relationship", relationTo: "projects", index: true },
        { name: "province", type: "relationship", relationTo: "provinces", required: true, index: true },
        {
          name: "ward",
          type: "relationship",
          relationTo: "wards",
          required: true,
          index: true,
          filterOptions: wardFilterOptions,
          validate: validateWardInProvince,
        },
        { name: "address", type: "text", required: true, access: { read: readExactAddress } },
        { name: "showExactAddress", type: "checkbox", defaultValue: false },
        { name: "location", type: "point", access: { read: readExactAddress } },
        { name: "priceMonthlyVnd", type: "number", min: 0, validate: validatePriceMonthly },
        { name: "priceNegotiable", type: "checkbox", defaultValue: false },
        { name: "areaM2", type: "number", required: true, min: 0, validate: validateAreaM2 },
        nonNegativeNumber("bedrooms"),
        nonNegativeNumber("bathrooms"),
        { name: "floor", type: "text" },
        directionField("houseDirection"),
        directionField("balconyDirection"),
        { name: "furnishing", type: "select", index: true, options: selectOptions(FURNISHINGS, FURNISHING_LABELS) },
        rentalTermsGroup,
        { name: "description", type: "richText", localized: true, validate: requiredByLocale("Mô tả không được để trống.") },
        {
          name: "gallery",
          type: "upload",
          relationTo: "media",
          hasMany: true,
          filterOptions: { mimeType: { contains: "image/" } },
          validate: validateGallery,
        },
        { name: "videoUrl", type: "text", validate: validateVideoUrl },
        { name: "legalNote", type: "textarea", localized: true },
        rentedAtField,
        searchTextField,
      ],
    },
    {
      statuses: RENTAL_STATUSES,
      publicStatuses: PUBLIC_STATUSES.rentals,
      englishRequiredFields: ["title", "slug", "description"],
      revalidate,
    },
  );
}

export const Rentals = createRentals();
