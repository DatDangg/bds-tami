import type { Payload } from "payload";

import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

/** Loại hình dự án mẫu. `seed/categories.ts` không tạo danh mục `project` mặc định (admin tự thêm), nên bước mẫu tự tạo nếu thiếu. */
export const SAMPLE_PROJECT_CATEGORY_NAME = "Căn hộ chung cư";

/**
 * Dự án mẫu (FR-ADM-01). Chỉ dữ liệu dev/staging: KHÔNG chạy ở production. Là bản nháp vì xuất bản cần `gallery`
 * (ảnh mẫu cần upload lên SeaweedFS, nên để admin thêm ảnh rồi xuất bản). `provinceSlug` là slug tỉnh do `pnpm seed` nạp.
 */
export const SAMPLE_PROJECTS = [
  {
    title: "Dự án mẫu Căn hộ Sông Sài Gòn",
    summary: "Căn hộ cao cấp ven sông, gần trung tâm, tiện ích đầy đủ.",
    provinceSlug: "ho-chi-minh",
    address: "Quận 1, TP. Hồ Chí Minh",
    salesStatus: "selling",
    location: [106.7009, 10.7769],
    priceFromVnd: 3_500_000_000,
    priceToVnd: 8_000_000_000,
    areaFromM2: 50,
    areaToM2: 120,
  },
  {
    title: "Dự án mẫu Khu đô thị Tây Hồ",
    summary: "Khu đô thị xanh quanh hồ, phù hợp ở và đầu tư.",
    provinceSlug: "ha-noi",
    address: "Tây Hồ, Hà Nội",
    salesStatus: "upcoming",
    location: [105.8194, 21.0586],
    priceFromVnd: 4_200_000_000,
    priceToVnd: 9_500_000_000,
    areaFromM2: 60,
    areaToM2: 150,
  },
] as const;

async function findOrCreateProjectCategory(payload: Payload): Promise<string> {
  const found = await payload.find({
    collection: "categories",
    where: { and: [{ scope: { equals: "project" } }, { name: { equals: SAMPLE_PROJECT_CATEGORY_NAME } }] },
    locale: "vi",
    fallbackLocale: false,
    trash: true,
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
  });
  if (found.docs[0]) return found.docs[0].id;
  const created = await payload.create({
    collection: "categories",
    data: { name: SAMPLE_PROJECT_CATEGORY_NAME, scope: "project" } as never,
    locale: "vi",
    depth: 0,
    overrideAccess: true,
  });
  return created.id;
}

async function findProvinceId(payload: Payload, slug: string): Promise<string> {
  const province = (
    await payload.find({ collection: "provinces", where: { slug: { equals: slug } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!province) throw new Error(`Thiếu tỉnh/thành "${slug}": chạy pnpm seed (địa giới) trước.`);
  return province.id;
}

/**
 * Tạo dự án mẫu (bản `vi`, `draft`), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm). Cần địa giới (`pnpm seed`) và ít nhất
 * một admin để làm tác giả; thiếu thì ném lỗi rõ ràng thay vì tạo dữ liệu dở.
 */
export async function seedSampleProjects(payload: Payload): Promise<SeedResult> {
  const author = (
    await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả dự án mẫu: tạo admin trước.");

  const result: SeedResult = { created: 0, skipped: 0 };
  for (const { title, summary, provinceSlug, ...rest } of SAMPLE_PROJECTS) {
    const found = await payload.find({
      collection: "projects",
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
    // Tra tỉnh/danh mục sau khi biết còn dự án cần tạo: chạy lại khi đã đủ dữ liệu không đụng tới danh mục.
    const province = await findProvinceId(payload, provinceSlug);
    const category = await findOrCreateProjectCategory(payload);
    await payload.create({
      collection: "projects",
      data: {
        ...rest,
        location: [...rest.location],
        title,
        summary,
        overview: paragraphsToLexical([summary]) as never,
        category,
        province,
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
