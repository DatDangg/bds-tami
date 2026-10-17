import type { Payload } from "payload";

import type { LegalPageKind } from "../src/lib/content/content-paths";
import { paragraphsToLexical } from "./lexical";
import type { SeedResult } from "./categories";

interface LegalPageSeed {
  title: string;
  placeholder: string;
}

/** Hai trang pháp lý giai đoạn 1 (ERD §4.9b): bản NHÁP, nội dung giữ chỗ; admin soạn rồi xuất bản (xuất bản `privacy` đặt `consentVersion`). */
export const LEGAL_PAGE_SEEDS: Readonly<Record<LegalPageKind, LegalPageSeed>> = {
  privacy: { title: "Chính sách bảo mật", placeholder: "Nội dung chính sách bảo mật đang được soạn." },
  terms: { title: "Điều khoản sử dụng", placeholder: "Nội dung điều khoản sử dụng đang được soạn." },
};

/**
 * Tạo bản ghi `pages` cho từng `kind` còn thiếu (bản `vi`, `draft`, `version` 1.0), idempotent: `kind` đã có (kể cả bản xoá mềm,
 * vì `kind` UNIQUE giữ chỗ) thì bỏ qua và KHÔNG ghi đè nội dung admin đã sửa. Chạy được cả trên production (chỉ tạo nháp, không xuất bản).
 */
export async function seedLegalPages(payload: Payload, today: Date = new Date()): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0 };
  for (const [kind, { title, placeholder }] of Object.entries(LEGAL_PAGE_SEEDS) as [LegalPageKind, LegalPageSeed][]) {
    const found = await payload.find({
      collection: "pages",
      where: { kind: { equals: kind } },
      trash: true,
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
    });
    if (found.docs.length > 0) {
      result.skipped += 1;
      continue;
    }
    await payload.create({
      collection: "pages",
      data: {
        kind,
        title,
        content: paragraphsToLexical([placeholder]) as never,
        version: "1.0",
        effectiveDate: today.toISOString(),
        status: "draft",
      },
      locale: "vi",
      overrideAccess: true,
    });
    result.created += 1;
  }
  return result;
}
