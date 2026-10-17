import type { Payload } from "payload";

import type { CategoryScope } from "../src/hooks/categories/scope-collections";
import { slugify } from "../src/lib/slug";

/** Danh mục mặc định (ERD §4.3). Admin sửa/xoá được sau khi seed. `project` và `job` do admin tự thêm. */
export const DEFAULT_CATEGORIES: Readonly<Partial<Record<CategoryScope, readonly string[]>>> = {
  rental: ["Căn hộ dịch vụ", "Căn hộ chung cư", "Studio", "Nhà nguyên căn", "Văn phòng", "Mặt bằng kinh doanh"],
  property_post: ["Tin BĐS", "Voucher / Ưu đãi"],
  news: ["Thị trường", "Tin TAMI", "Đời sống"],
};

export interface SeedResult {
  created: number;
  skipped: number;
}

/**
 * Tạo danh mục mặc định (bản `vi`), idempotent: bỏ qua mục đã có cùng (`scope`, `slug` sinh từ tên), kể cả mục
 * đã xoá mềm (slug của nó vẫn còn giữ chỗ). Chạy lại bao nhiêu lần cũng không nhân đôi hay ghi đè sửa của admin.
 * Lưu ý: admin đã ĐỔI slug của một mục mặc định thì lần seed sau sẽ tạo lại mục đó. Chạy cho môi trường mới.
 */
export async function seedDefaultCategories(payload: Payload): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0 };
  for (const [scope, names] of Object.entries(DEFAULT_CATEGORIES) as [CategoryScope, readonly string[]][]) {
    for (const [index, name] of names.entries()) {
      const found = await payload.find({
        collection: "categories",
        where: { and: [{ scope: { equals: scope } }, { slug: { equals: slugify(name) } }] },
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
        collection: "categories",
        data: { name, scope, sortOrder: (index + 1) * 10 },
        locale: "vi",
        overrideAccess: true,
      });
      result.created += 1;
    }
  }
  return result;
}
