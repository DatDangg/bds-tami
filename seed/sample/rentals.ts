import type { Payload } from "payload";

import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

/** Danh mục `rental` mặc định do `pnpm seed` (danh mục mặc định) tạo; bước mẫu không tự tạo. */
export const SAMPLE_RENTAL_CATEGORY_NAME = "Căn hộ chung cư";

/**
 * Tin cho thuê mẫu (FR-ADM-02). Chỉ dữ liệu dev/staging: KHÔNG chạy ở production. Là bản nháp vì xuất bản cần ít nhất 3 ảnh
 * (ảnh mẫu cần upload lên SeaweedFS, nên để admin thêm ảnh rồi xuất bản). `provinceSlug` là slug tỉnh do `pnpm seed` nạp; phường
 * lấy phường đầu tiên (theo tên) của tỉnh đó để luôn thuộc đúng tỉnh.
 */
export const SAMPLE_RENTALS = [
  {
    title: "Căn hộ mẫu 2 phòng ngủ trung tâm Quận 1",
    provinceSlug: "ho-chi-minh",
    address: "12 Đường Mẫu",
    priceMonthlyVnd: 18_000_000,
    areaM2: 65,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: "full",
    location: [106.7009, 10.7769],
  },
  {
    title: "Studio mẫu gần hồ Tây",
    provinceSlug: "ha-noi",
    address: "5 Phố Mẫu",
    priceNegotiable: true,
    areaM2: 32,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: "basic",
    location: [105.8194, 21.0586],
  },
] as const;

async function findSampleCategoryId(payload: Payload): Promise<string> {
  const found = await payload.find({
    collection: "categories",
    where: { and: [{ scope: { equals: "rental" } }, { name: { equals: SAMPLE_RENTAL_CATEGORY_NAME } }] },
    locale: "vi",
    fallbackLocale: false,
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
  });
  if (!found.docs[0]) throw new Error(`Thiếu danh mục cho thuê "${SAMPLE_RENTAL_CATEGORY_NAME}": chạy pnpm seed (danh mục mặc định) trước.`);
  return found.docs[0].id;
}

async function findProvinceAndWard(payload: Payload, provinceSlug: string): Promise<{ province: string; ward: string }> {
  const province = (
    await payload.find({ collection: "provinces", where: { slug: { equals: provinceSlug } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!province) throw new Error(`Thiếu tỉnh/thành "${provinceSlug}": chạy pnpm seed (địa giới) trước.`);
  const ward = (
    await payload.find({ collection: "wards", where: { province: { equals: province.id } }, sort: "name", depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!ward) throw new Error(`Tỉnh/thành "${provinceSlug}" chưa có phường/xã: chạy pnpm seed (địa giới) trước.`);
  return { province: province.id, ward: ward.id };
}

/**
 * Tạo tin cho thuê mẫu (bản `vi`, `draft`), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm). Cần địa giới + danh mục mặc định
 * (`pnpm seed`) và ít nhất một admin để làm tác giả; thiếu thì ném lỗi rõ ràng thay vì tạo dữ liệu dở.
 */
export async function seedSampleRentals(payload: Payload): Promise<SeedResult> {
  const author = (
    await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả tin cho thuê mẫu: tạo admin trước.");

  const result: SeedResult = { created: 0, skipped: 0 };
  for (const { title, provinceSlug, location, ...rest } of SAMPLE_RENTALS) {
    const found = await payload.find({
      collection: "rentals",
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
    // Tra tỉnh/phường/danh mục sau khi biết còn tin cần tạo: chạy lại khi đã đủ dữ liệu không đụng tới địa giới.
    const place = await findProvinceAndWard(payload, provinceSlug);
    await payload.create({
      collection: "rentals",
      data: {
        ...rest,
        ...place,
        location: [...location],
        title,
        description: paragraphsToLexical([`${title}. Tin mẫu để xem thử giao diện, chưa có ảnh nên chưa xuất bản.`]),
        category: await findSampleCategoryId(payload),
        author: author.id,
        status: "draft",
        // `code` do hook sinh từ sequence; kiểu sinh ra coi là bắt buộc nên ép kiểu như các seed khác.
      } as never,
      locale: "vi",
      overrideAccess: true,
    });
    result.created += 1;
  }
  return result;
}
