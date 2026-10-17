import { z } from "zod";

import { normalizePhone } from "@/lib/phone";

/** Khung response API tuỳ biến (API_SPEC §2). Helper dựng response nằm ở `src/lib/http/response.ts`. */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.array(z.unknown()),
});

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
