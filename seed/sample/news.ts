import type { Payload } from "payload";

import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

/** Danh mục `news` mặc định mà tin mẫu gắn vào (do `seed/categories.ts` tạo, slug `tin-tami`). */
export const SAMPLE_NEWS_CATEGORY_SLUG = "tin-tami";

/** Tin tức mẫu (FR-ADM-04). Chỉ dữ liệu dev/staging: KHÔNG chạy ở production. Là bản nháp vì xuất bản cần `cover`. */
export const SAMPLE_NEWS = [
  {
    title: "TAMI ra mắt website mới",
    excerpt: "Website mới của TAMI giúp khách xem nhanh dự án, căn hộ cho thuê và tin tức thị trường.",
    tags: ["tami", "website"],
  },
  {
    title: "Thị trường căn hộ dịch vụ quý này",
    excerpt: "Tóm tắt xu hướng thuê căn hộ dịch vụ và những điều chủ sở hữu cần lưu ý.",
    tags: ["thị trường", "căn hộ dịch vụ"],
  },
] as const;

/**
 * Tạo tin tức mẫu (bản `vi`, `draft`), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm). Cần có danh mục `news` "Tin TAMI"
 * (`pnpm seed:categories`) và ít nhất một admin để làm tác giả; thiếu thì ném lỗi rõ ràng thay vì tạo dữ liệu dở.
 */
export async function seedSampleNews(payload: Payload): Promise<SeedResult> {
  const category = (
    await payload.find({
      collection: "categories",
      where: { and: [{ scope: { equals: "news" } }, { slug: { equals: SAMPLE_NEWS_CATEGORY_SLUG } }] },
      locale: "vi",
      fallbackLocale: false,
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
    })
  ).docs[0];
  if (!category) throw new Error(`Thiếu danh mục news "${SAMPLE_NEWS_CATEGORY_SLUG}": chạy pnpm seed:categories trước.`);
  const author = (
    await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả tin mẫu: tạo admin trước.");

  const result: SeedResult = { created: 0, skipped: 0 };
  for (const { title, excerpt, tags } of SAMPLE_NEWS) {
    const found = await payload.find({
      collection: "news",
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
      collection: "news",
      data: {
        title,
        excerpt,
        content: paragraphsToLexical([excerpt]) as never,
        tags: [...tags],
        category: category.id,
        author: author.id,
        status: "draft",
      },
      locale: "vi",
      overrideAccess: true,
    });
    result.created += 1;
  }
  return result;
}
