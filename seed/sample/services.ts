import type { Payload } from "payload";

import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

/** Dịch vụ mẫu (FR-PUB-10). Chỉ dữ liệu dev/staging: KHÔNG chạy tự động ở production. Là bản nháp vì xuất bản cần `coverImage`. */
export const SAMPLE_SERVICES = [
  { title: "Phân phối", summary: "Phân phối sản phẩm bất động sản từ các chủ đầu tư.", sortOrder: 10 },
  { title: "Môi giới", summary: "Môi giới mua bán và cho thuê bất động sản.", sortOrder: 20 },
  { title: "Khai thác căn hộ dịch vụ", summary: "Vận hành và khai thác căn hộ dịch vụ cho chủ sở hữu.", sortOrder: 30 },
] as const;

/** Tạo dịch vụ mẫu (bản `vi`, `draft`), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm). */
export async function seedSampleServices(payload: Payload): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0 };
  for (const { title, summary, sortOrder } of SAMPLE_SERVICES) {
    const found = await payload.find({
      collection: "services",
      where: { title: { equals: title } },
      locale: "vi",
      fallbackLocale: false,
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
      collection: "services",
      data: { title, summary, content: paragraphsToLexical([summary]) as never, sortOrder, status: "draft" },
      locale: "vi",
      overrideAccess: true,
    });
    result.created += 1;
  }
  return result;
}
