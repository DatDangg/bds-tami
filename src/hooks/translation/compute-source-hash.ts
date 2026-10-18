import type { Payload } from "payload";

import { hashLeaves, parseStoredHashes, type SourceHashes } from "../../lib/translation/leaves";
import { leavesOfDoc, type TranslationTargetRef } from "./translation-targets";

/** Hash nguồn (vi) của mọi trường chữ được phép dịch trong `doc` (một bản ghi đọc ở locale vi). Hook enqueue và job dùng CHUNG hàm này để cùng kết luận "đã đổi". */
export function computeSourceHash(payload: Payload, target: TranslationTargetRef, doc: Record<string, unknown> | null | undefined): SourceHashes {
  return hashLeaves(leavesOfDoc(payload, target, doc));
}

/** Nhóm `translation` đọc từ bản ghi (không localized): trả giá trị an toàn khi thiếu. */
export interface StoredTranslation {
  status?: string;
  enSource?: string;
  viChangedAfterManual: boolean;
  sourceHash: SourceHashes;
  translatedAt?: string;
  model?: string;
  lastError?: string;
}

export function readStoredTranslation(doc: Record<string, unknown> | null | undefined): StoredTranslation {
  const raw = (doc?.translation ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value : undefined);
  return {
    status: text(raw.status),
    enSource: text(raw.enSource),
    viChangedAfterManual: raw.viChangedAfterManual === true,
    sourceHash: parseStoredHashes(raw.sourceHash),
    translatedAt: text(raw.translatedAt),
    model: text(raw.model),
    lastError: text(raw.lastError),
  };
}
