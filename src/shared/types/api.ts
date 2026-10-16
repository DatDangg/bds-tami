import { z } from "zod";

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
