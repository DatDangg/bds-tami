import type { PayloadRequest } from "payload";

import { readStoredTranslation } from "../hooks/translation/compute-source-hash";
import { TRANSLATION_JOB_CONTEXT_KEY, type TranslationTargetRef } from "../hooks/translation/translation-targets";
import type { TranslateContentInput } from "../lib/translation/job-input";
import type { TranslationClient } from "../lib/translation/claude-client";
import type { RevalidatePaths } from "../hooks/revalidate-content";
import type { TranslationConfig } from "../lib/translation/translation-service";

export type Doc = Record<string, unknown>;

export interface TranslateContentDeps {
  /** Mặc định đọc env (`ANTHROPIC_API_KEY`, `TRANSLATION_MODEL`, `TRANSLATION_MONTHLY_BUDGET_USD`). */
  config?: TranslationConfig;
  /** Mặc định client Claude API thật (chỉ tạo khi qua allowlist + hạn mức). Test truyền bản giả: KHÔNG gọi API thật trong test/CI. */
  client?: TranslationClient;
  /** Mặc định gọi route nội bộ của app (job chạy ngoài Next). */
  revalidate?: RevalidatePaths;
  now?: () => Date;
}

export interface Context {
  req: PayloadRequest;
  input: TranslateContentInput;
  target: TranslationTargetRef;
  deps: TranslateContentDeps;
  now: Date;
}

/** Đọc bản ghi theo một ngôn ngữ (không fallback). Truyền `req` để đọc nằm trong transaction của bên gọi. */
export async function readDoc(ctx: Context, locale: "vi" | "en", req?: PayloadRequest): Promise<Doc | null> {
  const options = { locale, fallbackLocale: false, depth: 0, overrideAccess: true, ...(req ? { req } : {}) } as const;
  const { payload } = ctx.req;
  if (ctx.target.kind === "global") return (await payload.findGlobal({ slug: ctx.target.slug as never, ...options })) as unknown as Doc;
  if (!ctx.input.docId) return null;
  return (await payload.findByID({ collection: ctx.target.slug as never, id: ctx.input.docId, trash: true, disableErrors: true, ...options })) as unknown as Doc | null;
}

/** Cập nhật riêng nhóm `translation` (không đụng nội dung): dùng cho trạng thái lỗi / cờ `viChangedAfterManual`. */
export async function patchTranslationGroup(ctx: Context, vi: Doc, patch: Doc): Promise<void> {
  const translation = { ...readStoredTranslation(vi), ...patch };
  const { payload } = ctx.req;
  const common = { depth: 0, overrideAccess: true, context: { [TRANSLATION_JOB_CONTEXT_KEY]: true } } as const;
  if (ctx.target.kind === "global") {
    await payload.updateGlobal({ slug: ctx.target.slug as never, data: { translation } as never, ...common });
  } else {
    await payload.update({ collection: ctx.target.slug as never, id: ctx.input.docId!, data: { translation } as never, ...common });
  }
}
