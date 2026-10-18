import type { Payload } from "payload";

import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

/** Danh mục `property_post` mặc định do `pnpm seed` (danh mục mặc định) tạo; bước mẫu không tự tạo. */
export const SAMPLE_PROPERTY_POST_CATEGORY_SLUGS = { post: "tin-bds", offer: "voucher-uu-dai" } as const;

/**
 * Bài Đăng tin BĐS mẫu (FR-ADM-03). Chỉ dữ liệu dev/staging: KHÔNG chạy ở production. Là bản nháp vì xuất bản cần `cover` (ảnh mẫu cần upload
 * lên SeaweedFS, nên để admin thêm ảnh rồi xuất bản). Bài ưu đãi không đặt `offer.endAt` cố định (sẽ lỗi thời): admin chọn ngày khi xuất bản.
 */
export const SAMPLE_PROPERTY_POSTS = [
  {
    title: "Mở bán đợt cuối căn hộ ven sông",
    category: "post",
    excerpt: "Những căn cuối cùng của dự án căn hộ ven sông, thanh toán giãn tiến độ.",
    priceVnd: 2_100_000_000,
    priceNote: "Chỉ từ 2,1 tỷ",
  },
  {
    title: "Voucher tri ân khách thuê căn hộ",
    category: "offer",
    excerpt: "Giảm giá thuê tháng đầu cho khách ký hợp đồng từ 12 tháng.",
    offer: { voucherCode: "TAMI-TRI-AN", terms: "Áp dụng cho hợp đồng thuê từ 12 tháng; không cộng dồn ưu đãi khác." },
  },
] as const;

async function findCategoryId(payload: Payload, slug: string): Promise<string> {
  const found = await payload.find({
    collection: "categories",
    where: { and: [{ scope: { equals: "property_post" } }, { slug: { equals: slug } }] },
    locale: "vi",
    fallbackLocale: false,
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
  });
  if (!found.docs[0]) throw new Error(`Thiếu danh mục đăng tin BĐS "${slug}": chạy pnpm seed (danh mục mặc định) trước.`);
  return found.docs[0].id;
}

/**
 * Tạo bài Đăng tin BĐS mẫu (bản `vi`, `draft`), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm). Cần danh mục mặc định (`pnpm seed`)
 * và ít nhất một admin để làm tác giả; thiếu thì ném lỗi rõ ràng thay vì tạo dữ liệu dở.
 */
export async function seedSamplePropertyPosts(payload: Payload): Promise<SeedResult> {
  const author = (
    await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả bài đăng tin BĐS mẫu: tạo admin trước.");

  // Tra đủ danh mục trước khi tạo bài nào: thiếu một danh mục thì ném lỗi, không để lại dữ liệu mẫu dở dang.
  const categoryIds = {
    post: await findCategoryId(payload, SAMPLE_PROPERTY_POST_CATEGORY_SLUGS.post),
    offer: await findCategoryId(payload, SAMPLE_PROPERTY_POST_CATEGORY_SLUGS.offer),
  };
  const result: SeedResult = { created: 0, skipped: 0 };
  for (const { title, category, excerpt, ...rest } of SAMPLE_PROPERTY_POSTS) {
    const found = await payload.find({
      collection: "property-posts",
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
      collection: "property-posts",
      data: {
        ...rest,
        title,
        excerpt,
        content: paragraphsToLexical([`${excerpt} Bài mẫu để xem thử giao diện, chưa có ảnh bìa nên chưa xuất bản.`]),
        category: categoryIds[category],
        author: author.id,
        status: "draft",
      } as never,
      locale: "vi",
      overrideAccess: true,
    });
    result.created += 1;
  }
  return result;
}
