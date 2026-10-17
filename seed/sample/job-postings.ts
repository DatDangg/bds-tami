import type { Payload } from "payload";

import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

/** `seed/categories.ts` không tạo danh mục `job` mặc định (admin tự thêm), nên bước mẫu tự tạo nếu thiếu. */
export const SAMPLE_JOB_CATEGORY_NAME = "Kinh doanh";

/** Hạn nộp hồ sơ của tin mẫu: đủ xa để bản nháp chuyển sang xuất bản vẫn còn hạn khi dev xem thử. */
const SAMPLE_DEADLINE_DAYS = 60;

/**
 * Tin tuyển dụng mẫu (FR-ADM-05). Chỉ dữ liệu dev/staging: KHÔNG chạy ở production. Là bản nháp để admin xem lại nội dung
 * trước khi xuất bản. `provinceSlug` là slug tỉnh do `pnpm seed` nạp.
 */
export const SAMPLE_JOB_POSTINGS = [
  {
    title: "Chuyên viên tư vấn bất động sản",
    provinceSlug: "ho-chi-minh",
    workplace: "Văn phòng TAMI, Quận 1, TP. Hồ Chí Minh",
    employmentType: "full_time",
    salaryText: "15 - 30 triệu + hoa hồng",
    salaryMinVnd: 15_000_000,
    salaryMaxVnd: 30_000_000,
    quantity: 5,
    description: ["Tư vấn khách hàng về dự án và căn hộ cho thuê.", "Chăm sóc khách hàng sau giao dịch."],
    requirements: ["Giao tiếp tốt, có tinh thần học hỏi.", "Ưu tiên ứng viên có kinh nghiệm bất động sản."],
  },
  {
    title: "Thực tập sinh Marketing",
    provinceSlug: "ha-noi",
    workplace: "Văn phòng TAMI, Hà Nội",
    employmentType: "internship",
    salaryText: "Thỏa thuận",
    quantity: 2,
    description: ["Hỗ trợ lên nội dung bài đăng và quản lý kênh mạng xã hội."],
    requirements: ["Sinh viên năm cuối ngành Marketing hoặc liên quan.", "Viết tiếng Việt tốt."],
  },
] as const;

async function findOrCreateJobCategory(payload: Payload): Promise<string> {
  const found = await payload.find({
    collection: "categories",
    where: { and: [{ scope: { equals: "job" } }, { name: { equals: SAMPLE_JOB_CATEGORY_NAME } }] },
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
    data: { name: SAMPLE_JOB_CATEGORY_NAME, scope: "job" } as never,
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
 * Tạo tin tuyển dụng mẫu (bản `vi`, `draft`), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm). Cần địa giới (`pnpm seed`)
 * và ít nhất một admin để làm tác giả; thiếu thì ném lỗi rõ ràng thay vì tạo dữ liệu dở.
 */
export async function seedSampleJobPostings(payload: Payload): Promise<SeedResult> {
  const author = (
    await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả tin tuyển dụng mẫu: tạo admin trước.");

  const deadline = new Date(Date.now() + SAMPLE_DEADLINE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result: SeedResult = { created: 0, skipped: 0 };
  for (const { title, provinceSlug, description, requirements, ...rest } of SAMPLE_JOB_POSTINGS) {
    const found = await payload.find({
      collection: "job-postings",
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
    // Tra tỉnh/danh mục sau khi biết còn tin cần tạo: chạy lại khi đã đủ dữ liệu không đụng tới danh mục.
    const province = await findProvinceId(payload, provinceSlug);
    const category = await findOrCreateJobCategory(payload);
    await payload.create({
      collection: "job-postings",
      data: {
        ...rest,
        title,
        description: paragraphsToLexical(description) as never,
        requirements: paragraphsToLexical(requirements) as never,
        deadline,
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
