import { z } from "zod";

import { LEAD_SOURCES } from "@/lib/leads/lead-values";
import { normalizePhone } from "@/lib/phone";

/** Khung response API tuỳ biến (API_SPEC §2). Helper dựng response nằm ở `src/lib/http/response.ts`. */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.array(z.unknown()),
  /** Mã máy đọc được (tuỳ chọn) cho lỗi mà client cần phân biệt mà không dựa vào chữ hay cấu trúc `details`; xem `API_ERROR_CODES`. */
  code: z.string().optional(),
});

/** Mã lỗi máy đọc được của endpoint công khai (API_SPEC §2). `postingClosed`: tin tuyển dụng hết hạn / đóng / không tồn tại (`POST /api/public/job-applications`, 400). */
export const API_ERROR_CODES = { postingClosed: "postingClosed" } as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export const apiSuccessSchema = <T extends z.ZodType>(data: T) => z.object({ success: z.literal(true), data });

export const apiResponseSchema = <T extends z.ZodType>(data: T) =>
  z.discriminatedUnion("success", [apiSuccessSchema(data), apiErrorSchema]);

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess<T> = { success: true; data: T };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Ngôn ngữ ứng viên đang dùng khi nộp (BR-17); lưu vào `job-applications.locale`. */
export const applicantLocaleSchema = z.enum(["vi", "en"]);
export type ApplicantLocale = z.infer<typeof applicantLocaleSchema>;

/** Trường chữ trong multipart của `POST /api/public/job-applications` (API_SPEC §3.2). `cv` (file) kiểm riêng theo nội dung. */
export const jobApplicationFieldsSchema = z.object({
  jobPostingId: z.uuid(),
  fullName: z.string().trim().min(2).max(120),
  // Lưu dạng E.164 để admin gọi lại trực tiếp; cùng chuẩn hoá với BR-15.
  phone: z
    .string()
    .trim()
    .max(40)
    .transform((value, context) => {
      const normalized = normalizePhone(value);
      if (normalized === null) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ" });
      return normalized ?? "";
    }),
  email: z.email().max(254),
  message: z.string().trim().max(2000).optional(),
  // FormData chỉ có chuỗi: chỉ đúng "true" mới là đồng ý (BR-30).
  consent: z.literal("true").transform(() => true as const),
  locale: applicantLocaleSchema.default("vi"),
});

export type JobApplicationFields = z.infer<typeof jobApplicationFieldsSchema>;

/** Ô trống của form gửi chuỗi rỗng: coi như không gửi. */
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/** Chuỗi phụ (UTM, URL trang, referrer) chỉ để thống kê: quá dài thì cắt chứ không từ chối, để không mất lead vì một URL quảng cáo dài. */
const clipped = (max: number) =>
  z
    .string()
    .transform((value) => value.slice(0, max))
    .optional();

const leadUtmSchema = z.object({
  source: clipped(200),
  medium: clipped(200),
  campaign: clipped(200),
  term: clipped(200),
  content: clipped(200),
});

/**
 * Body JSON của `POST /api/public/leads` (API_SPEC §3.1). `turnstileToken` do pipeline kiểm trước nên không có trong kết quả.
 * `sourceId` bắt buộc trừ khi `source = contact` (khi đó bỏ qua nếu có). `consent` phải là boolean `true` (BR-30).
 */
export const leadInputSchema = z
  .object({
    source: z.enum(LEAD_SOURCES),
    sourceId: z.preprocess(emptyToUndefined, z.uuid().optional()),
    fullName: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .max(40)
      .transform((value, context) => {
        const normalized = normalizePhone(value);
        if (normalized === null) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ" });
        return normalized ?? "";
      }),
    email: z.preprocess(emptyToUndefined, z.email().max(254).optional()),
    message: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
    consent: z.literal(true),
    utm: leadUtmSchema.optional(),
    pageUrl: clipped(2000),
    referrer: clipped(2000),
    locale: applicantLocaleSchema.default("vi"),
  })
  .refine((value) => value.source === "contact" || value.sourceId !== undefined, { path: ["sourceId"], message: "Thiếu sourceId" })
  .transform((value) => (value.source === "contact" ? { ...value, sourceId: undefined } : value));

export type LeadInput = z.infer<typeof leadInputSchema>;

/** `?x=` (rỗng) coi như không truyền: form GET gửi cả ô bỏ trống. */
const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema.optional());

const MAX_SEARCH_QUERY_CHARS = 100;
const MAX_SLUG_CHARS = 150;
const MAX_PRICE_VND = 1_000_000_000_000;
const MAX_AREA_M2 = 100_000;
/** Trần số trang (cùng `MAX_PAGE` của `pagination.ts`): chặn OFFSET khổng lồ. */
const MAX_SEARCH_PAGE = 500;
export const MAX_RENTAL_SEARCH_LIMIT = 48;

export const RENTAL_SORTS = ["newest", "price_asc", "price_desc"] as const;
export const RENTAL_FURNISHINGS = ["none", "basic", "full"] as const;

const slugParam = optional(z.string().trim().min(1).max(MAX_SLUG_CHARS));
/** `?available=true` hoặc boolean từ code gọi thẳng; chuỗi khác (`yes`, `1`...) là sai (400). */
const flag = optional(z.union([z.boolean(), z.enum(["true", "false"]).transform((value) => value === "true")]));
const wholeNumber = (max: number) => optional(z.coerce.number().int().min(0).max(max));

/**
 * Tham số `GET /api/public/rentals` (API_SPEC §3.3). Sai kiểu/ngoài khoảng → lỗi (endpoint trả 400). `bedrooms` 0..4, `4` = 4 phòng trở lên.
 * Tên khoá trùng URL trang `/cho-thue` để chia sẻ được. Tham số lạ bị bỏ qua.
 */
export const rentalSearchParamsSchema = z
  .object({
    locale: z.preprocess(blankToUndefined, z.enum(["vi", "en"]).default("vi")),
    q: optional(z.string().trim().max(MAX_SEARCH_QUERY_CHARS)),
    category: slugParam,
    province: slugParam,
    ward: slugParam,
    priceMin: wholeNumber(MAX_PRICE_VND),
    priceMax: wholeNumber(MAX_PRICE_VND),
    areaMin: optional(z.coerce.number().min(0).max(MAX_AREA_M2)),
    areaMax: optional(z.coerce.number().min(0).max(MAX_AREA_M2)),
    bedrooms: wholeNumber(4),
    furnishing: optional(z.enum(RENTAL_FURNISHINGS)),
    /** `true` = chỉ tin còn trống (`published`), bỏ tin đã thuê: trang danh sách S04 dùng; mặc định trả cả `published` lẫn `rented`. */
    available: flag,
    sort: z.preprocess(blankToUndefined, z.enum(RENTAL_SORTS).default("newest")),
    page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(MAX_SEARCH_PAGE).default(1)),
    limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(MAX_RENTAL_SEARCH_LIMIT).default(12)),
  })
  .refine((value) => value.priceMin === undefined || value.priceMax === undefined || value.priceMin <= value.priceMax, {
    path: ["priceMax"],
    message: "priceMax phải lớn hơn hoặc bằng priceMin",
  })
  // Slug phường chỉ duy nhất trong cùng tỉnh (ERD §4.2): gửi `ward` mà không có `province` là mơ hồ.
  .refine((value) => value.ward === undefined || value.province !== undefined, {
    path: ["ward"],
    message: "ward cần đi kèm province (slug phường chỉ duy nhất trong tỉnh)",
  })
  .refine((value) => value.areaMin === undefined || value.areaMax === undefined || value.areaMin <= value.areaMax, {
    path: ["areaMax"],
    message: "areaMax phải lớn hơn hoặc bằng areaMin",
  });

export type RentalSearchParams = z.infer<typeof rentalSearchParamsSchema>;
export type RentalSort = (typeof RENTAL_SORTS)[number];

/**
 * Thẻ tin cho thuê trong danh sách (API_SPEC §3.3): chỉ trường công khai, chữ/slug theo `locale` của truy vấn.
 * `address` chỉ có khi tin bật `showExactAddress` (khác thì KHÔNG có khoá này, không phải `null`).
 */
export interface RentalCard {
  id: string;
  code: string;
  title: string;
  slug: string;
  status: "published" | "rented";
  thumbnail: { url: string; alt: string | null } | null;
  priceMonthlyVnd: number | null;
  priceNegotiable: boolean;
  areaM2: number;
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: (typeof RENTAL_FURNISHINGS)[number] | null;
  province: { name: string; slug: string };
  ward: { name: string; slug: string };
  address?: string;
  publishedAt: string | null;
}

export interface RentalSearchResult {
  items: RentalCard[];
  total: number;
  page: number;
  totalPages: number;
}
