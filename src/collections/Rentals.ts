import type { CollectionConfig, DateField, FieldAccess, GroupField, SelectField, TextField } from "payload";

import { denyAll, isStaff, PUBLIC_STATUSES } from "../access";
import { withPriceInWords } from "../fields/form-hints";
import { markRequired, requiredByLocale } from "../fields/required-by-locale";
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
} from "../hooks/rentals/field-validators";
import { validateWardInProvince, wardFilterOptions } from "../fields/ward-in-province";
import { stampRentedAt } from "../hooks/rentals/stamp-rented-at";
import { createRevalidateProjectOnListing } from "../hooks/projects/revalidate-project-on-listing";
import { createRevalidateHomepageOnListing } from "../hooks/homepage/revalidate-homepage-on-service";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import { collectionLabels } from "../lib/admin/collection-labels";
import { formRow, formTabs } from "../lib/admin/form-layout";
import { hideTechnicalListFields } from "../lib/admin/list-filter";
import { withContentDefaults } from "./_shared/content-defaults";
import { RENTAL_AMENITIES } from "../shared/types/api";

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
/** Nhãn admin (VI) của `amenities` — nhãn công khai VI/EN nằm ở i18n `page.rentals.amenityOption`. */
const AMENITY_LABELS: Record<(typeof RENTAL_AMENITIES)[number], string> = {
  pool: "Hồ bơi",
  gym: "Phòng gym",
  elevator: "Thang máy",
  parking: "Chỗ đậu xe",
  security: "Bảo vệ 24/7",
  balcony: "Ban công",
  washing_machine: "Máy giặt",
  air_conditioner: "Điều hoà",
  pet_friendly: "Cho nuôi thú cưng",
  kitchen: "Bếp riêng",
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

const directionField = (name: string, label: string): SelectField => ({ name, type: "select", label, options: selectOptions(DIRECTIONS, DIRECTION_LABELS) });
const nonNegativeNumber = (name: string, label: string) => ({ name, type: "number", label, min: 0 }) as const;

/** Mã `CT-000001` (ERD §4.6): chỉ đọc với mọi người (PERMISSION §4), do hook `assignRentalCode` sinh từ sequence. */
const codeField: TextField = {
  name: "code",
  type: "text",
  label: "Mã tin",
  required: true,
  unique: true,
  access: { create: denyAll, update: denyAll },
  // Mã hiện to ở đầu form (`codeBanner`); field giữ dữ liệu + cột + tìm kiếm nhưng không vẽ ô nhập riêng ở sidebar (BL-042 #13).
  admin: { readOnly: true, position: "sidebar", components: { Field: "/components/admin/RentalCodeDisplay#RentalCodeHiddenField" } },
};

/** Thời điểm chuyển sang `rented`, hệ thống ghi (hook `stampRentedAt`). */
const rentedAtField: DateField = {
  name: "rentedAt",
  type: "date",
  label: "Ngày cho thuê",
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
  label: "Điều kiện thuê",
  fields: [
    nonNegativeNumber("minLeaseMonths", "Thời hạn thuê tối thiểu (tháng)"),
    nonNegativeNumber("depositMonths", "Đặt cọc (số tháng)"),
    { name: "paymentCycle", type: "select", label: "Chu kỳ thanh toán", options: selectOptions(PAYMENT_CYCLES, PAYMENT_CYCLE_LABELS) },
    { name: "includedServices", type: "select", label: "Dịch vụ bao gồm", hasMany: true, options: selectOptions(INCLUDED_SERVICES, SERVICE_LABELS) },
    { name: "availableFrom", type: "date", label: "Có thể dọn vào từ", admin: { date: { pickerAppearance: "dayOnly" } } },
  ],
};

/**
 * Tin cho thuê (ERD §4.6, FR-ADM-02): sale tạo và sửa/xoá mềm tin của mình, admin sửa mọi tin và là người duy nhất xoá hẳn/khôi phục
 * (PERMISSION §3.1; access mặc định của `withContentDefaults`). Khách thấy `published` + `rented`. `category` thuộc scope `rental`;
 * `ward` phải thuộc `province` (G22). Index tổng hợp, GIST `location` (ERD §5) và `CREATE SEQUENCE rentals_code_seq` là SQL tuỳ
 * biến trong migration `rentals`; index trigram `search_text` làm ở task SearchService. `revalidate` chỉ để test ghi đè.
 */
export function createRentals(revalidate?: RevalidatePaths): CollectionConfig {
  const revalidateHomepage = createRevalidateHomepageOnListing({ paths: revalidate });
  const revalidateProject = createRevalidateProjectOnListing({ field: "project", publicStatuses: PUBLIC_STATUSES.rentals, revalidate });
  const collection = withContentDefaults(
    {
      slug: "rentals",
      labels: collectionLabels("rentals"),
      admin: {
        useAsTitle: "title",
        listSearchableFields: ["code", "title", "address"],
        // Chip lọc nhanh (BL-022) nằm trước ô "Trạng thái dịch" mà withContentDefaults nối thêm; slot server ẩn ở thùng rác.
        components: { beforeListTable: ["/components/admin/RentalQuickFilterSlot#RentalQuickFilterSlot"] },
        defaultColumns: ["gallery", "code", "title", "category", "roomsArea", "project", "priceMonthlyVnd", "status", "author"],
        description: "Tin cho thuê căn hộ/nhà: vị trí, giá, diện tích, nội thất và điều kiện thuê. Mã tin tự sinh.",
      },
      defaultSort: "-publishedAt",
      hooks: {
        beforeValidate: [assignRentalCode],
        beforeChange: [buildRentalSearchText],
        afterChange: [refreshOtherLocaleSearchText, revalidateHomepage.afterChange, revalidateProject.afterChange],
        afterDelete: [revalidateHomepage.afterDelete, revalidateProject.afterDelete],
      },
      fields: [
        codeField,
        // Cột ghép của danh sách (BL-039): `ui` không có cột DB, không hiện ở form, không sắp xếp/lọc; Cell đọc `rowData`.
        { name: "roomsArea", type: "ui", label: "Phòng · diện tích", admin: { components: { Cell: "/components/admin/ListSummaryCells#RoomsAreaCell" } } },
        { name: "codeBanner", type: "ui", label: "Mã tin", admin: { components: { Field: "/components/admin/RentalCodeDisplay#RentalCodeBanner" } } },
        formTabs([
          {
            label: "Nội dung",
            fields: [
              titleField({ placeholder: "VD: Căn hộ 2PN view sông, đủ nội thất" }),
              scopedCategoryField("rental"),
              markRequired({ name: "description", type: "richText", label: "Mô tả", localized: true, validate: requiredByLocale("Mô tả không được để trống.") }),
              { name: "legalNote", type: "textarea", label: "Ghi chú pháp lý", localized: true },
            ],
          },
          {
            label: "Thông tin căn",
            fields: [
              { name: "project", type: "relationship", label: "Thuộc dự án", relationTo: "projects", index: true },
              formRow(
                { name: "province", type: "relationship", label: "Tỉnh/thành", relationTo: "provinces", required: true, index: true },
                {
                  name: "ward",
                  type: "relationship",
                  label: "Phường/xã",
                  relationTo: "wards",
                  required: true,
                  index: true,
                  filterOptions: wardFilterOptions,
                  validate: validateWardInProvince,
                },
              ),
              { name: "address", type: "text", label: "Địa chỉ chính xác", required: true, access: { read: readExactAddress } },
              { name: "showExactAddress", type: "checkbox", label: "Cho khách xem địa chỉ chính xác", defaultValue: false },
              { name: "location", type: "point", label: "Toạ độ bản đồ", access: { read: readExactAddress } },
              formRow(
                withPriceInWords({ name: "priceMonthlyVnd", type: "number", label: "Giá thuê/tháng (VNĐ)", min: 0, validate: validatePriceMonthly, admin: { components: { Cell: "/components/admin/VndCell#VndCell" } } }),
                { name: "priceNegotiable", type: "checkbox", label: "Giá thương lượng", defaultValue: false },
              ),
              formRow(
                { name: "areaM2", type: "number", label: "Diện tích (m²)", required: true, min: 0, validate: validateAreaM2 },
                { name: "floor", type: "text", label: "Tầng" },
              ),
              formRow(nonNegativeNumber("bedrooms", "Số phòng ngủ"), nonNegativeNumber("bathrooms", "Số phòng tắm")),
              formRow(directionField("houseDirection", "Hướng nhà"), directionField("balconyDirection", "Hướng ban công")),
              { name: "furnishing", type: "select", label: "Nội thất", index: true, options: selectOptions(FURNISHINGS, FURNISHING_LABELS) },
              // Tiện ích của căn (BL-044): khác `rentalTerms.includedServices` (dịch vụ nằm trong giá thuê). Bộ lọc `/cho-thue` lọc AND theo bảng `rentals_amenities`.
              { name: "amenities", type: "select", label: "Tiện ích", hasMany: true, index: true, options: selectOptions(RENTAL_AMENITIES, AMENITY_LABELS) },
              rentalTermsGroup,
            ],
          },
          {
            label: "Hình ảnh",
            fields: [
              {
                name: "gallery",
                type: "upload",
                label: "Thư viện ảnh",
                relationTo: "media",
                hasMany: true,
                filterOptions: { mimeType: { contains: "image/" } },
                validate: validateGallery,
                admin: { description: "Ảnh đầu tiên là ảnh đại diện của tin.", components: { Cell: "/components/admin/ThumbnailCell#ThumbnailCell" } },
              },
              { name: "videoUrl", type: "text", label: "Link video (YouTube/TikTok)", validate: validateVideoUrl },
            ],
          },
        ]),
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
  // Chỉ để lại trường nghiệp vụ trong "Thêm bộ lọc" (BL-021 #06): address, showExactAddress, videoUrl, rentalTerms.includedServices, searchText ẩn thêm ngoài quy tắc theo kiểu trường + SEO/bản dịch/slug.
  return hideTechnicalListFields(collection, ["address", "showExactAddress", "videoUrl", "rentalTerms.includedServices", "searchText"]);
}

export const Rentals = createRentals();
