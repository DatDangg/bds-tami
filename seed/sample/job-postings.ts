import type { Payload } from "payload";

import { startOfVietnamDay } from "../../src/lib/careers/deadline";
import type { SeedResult } from "../categories";
import { paragraphsToLexical } from "../lexical";

/** `seed/categories.ts` không tạo danh mục `job` mặc định (admin tự thêm), nên bước mẫu tự tạo nếu thiếu. */
export const SAMPLE_JOB_CATEGORY_NAME = "Kinh doanh";
const SAMPLE_JOB_CATEGORY_NAME_EN = "Sales";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Từ 00:00 giờ VN đến 12:00 UTC cùng ngày: giờ ô chọn ngày `dayOnly` của admin ghim (xem `src/lib/careers/deadline.ts`). */
const PICKER_TIME_OFFSET_MS = 19 * 60 * 60 * 1000;

/** Hạn nộp giống giá trị ô chọn ngày của admin: 12:00 UTC của ngày (hôm nay giờ VN + `days`); `days` âm = đã quá hạn. */
function pickerDeadline(days: number, now: Date): string {
  return new Date(startOfVietnamDay(now).getTime() + days * DAY_MS + PICKER_TIME_OFFSET_MS).toISOString();
}

interface SampleEnglish {
  title: string;
  description: readonly string[];
  requirements: readonly string[];
  salaryText?: string;
}

interface SampleJobPosting {
  title: string;
  provinceSlug: string;
  workplace: string;
  employmentType: "full_time" | "part_time" | "internship" | "contract";
  salaryText?: string;
  salaryMinVnd?: number;
  salaryMaxVnd?: number;
  quantity: number;
  /** Số ngày từ hôm nay đến hạn chót; âm = đã hết hạn (để xem băng "hết hạn" + noindex). */
  deadlineInDays: number;
  /** Có thì tin thuộc danh mục "Kinh doanh"; bỏ qua thì để trống (danh mục là tuỳ chọn, ERD §4.10). */
  withCategory: boolean;
  description: readonly string[];
  requirements: readonly string[];
  benefits?: readonly string[];
  /** Có thì tin có bản EN (`hasEnglish`), để kiểm tra `/en`. */
  english?: SampleEnglish;
}

/**
 * Tin tuyển dụng mẫu (FR-ADM-05). Chỉ dữ liệu dev/staging: KHÔNG chạy ở production. Đều `published` để dựng trang công khai: hai tin còn hạn dài,
 * một tin còn 3 ngày (badge cảnh báo), một tin không danh mục/không lương, một tin ĐÃ HẾT HẠN. `provinceSlug` là slug tỉnh do `pnpm seed` nạp.
 */
export const SAMPLE_JOB_POSTINGS: readonly SampleJobPosting[] = [
  {
    title: "Chuyên viên tư vấn bất động sản",
    provinceSlug: "ho-chi-minh",
    workplace: "Văn phòng TAMI, Quận 1, TP. Hồ Chí Minh",
    employmentType: "full_time",
    salaryText: "15 - 30 triệu + hoa hồng",
    salaryMinVnd: 15_000_000,
    salaryMaxVnd: 30_000_000,
    quantity: 5,
    deadlineInDays: 60,
    withCategory: true,
    description: ["Tư vấn khách hàng về dự án và căn hộ cho thuê.", "Chăm sóc khách hàng sau giao dịch."],
    requirements: ["Giao tiếp tốt, có tinh thần học hỏi.", "Ưu tiên ứng viên có kinh nghiệm bất động sản."],
    benefits: ["Hoa hồng hấp dẫn.", "Được đào tạo bài bản."],
    english: {
      title: "Real estate consultant",
      description: ["Advise customers on projects and rental apartments.", "Take care of customers after each transaction."],
      requirements: ["Good communication and a willingness to learn.", "Real estate experience is a plus."],
      salaryText: "15 - 30 million + commission",
    },
  },
  {
    title: "Thực tập sinh Marketing",
    provinceSlug: "ha-noi",
    workplace: "Văn phòng TAMI, Hà Nội",
    employmentType: "internship",
    salaryText: "Thỏa thuận",
    quantity: 2,
    deadlineInDays: 3,
    withCategory: true,
    description: ["Hỗ trợ lên nội dung bài đăng và quản lý kênh mạng xã hội."],
    requirements: ["Sinh viên năm cuối ngành Marketing hoặc liên quan.", "Viết tiếng Việt tốt."],
    english: {
      title: "Marketing intern",
      description: ["Help plan post content and manage social media channels."],
      requirements: ["Final-year student in Marketing or a related field.", "Strong writing skills."],
      salaryText: "Negotiable",
    },
  },
  {
    title: "Nhân viên chăm sóc khách hàng bán thời gian",
    provinceSlug: "ha-noi",
    workplace: "Văn phòng TAMI, Hà Nội",
    employmentType: "part_time",
    quantity: 1,
    deadlineInDays: 30,
    withCategory: false,
    description: ["Trả lời khách qua điện thoại và Zalo, ghi nhận nhu cầu."],
    requirements: ["Giọng nói rõ ràng, làm việc theo ca."],
  },
  {
    title: "Trưởng nhóm kinh doanh (đã đóng)",
    provinceSlug: "ho-chi-minh",
    workplace: "Văn phòng TAMI, Quận 1, TP. Hồ Chí Minh",
    employmentType: "contract",
    salaryMinVnd: 25_000_000,
    quantity: 1,
    deadlineInDays: -10,
    withCategory: true,
    description: ["Quản lý nhóm tư vấn và chỉ tiêu doanh số."],
    requirements: ["Từ 3 năm kinh nghiệm quản lý nhóm kinh doanh."],
    english: {
      title: "Sales team lead (closed)",
      description: ["Lead the consulting team and sales targets."],
      requirements: ["At least 3 years of sales team management experience."],
    },
  },
];

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
  const existing = found.docs[0];
  const id =
    existing?.id ??
    (
      await payload.create({
        collection: "categories",
        data: { name: SAMPLE_JOB_CATEGORY_NAME, scope: "job" } as never,
        locale: "vi",
        depth: 0,
        overrideAccess: true,
      })
    ).id;
  // Chip nhóm công việc ở `/en` chỉ hiện danh mục có bản EN.
  if (!existing || existing.hasEnglish !== true) {
    await payload.update({
      collection: "categories",
      id,
      data: { name: SAMPLE_JOB_CATEGORY_NAME_EN, hasEnglish: true } as never,
      locale: "en",
      depth: 0,
      overrideAccess: true,
    });
  }
  return id;
}

async function findProvinceId(payload: Payload, slug: string): Promise<string> {
  const province = (
    await payload.find({ collection: "provinces", where: { slug: { equals: slug } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!province) throw new Error(`Thiếu tỉnh/thành "${slug}": chạy pnpm seed (địa giới) trước.`);
  return province.id;
}

async function addEnglish(payload: Payload, id: string, english: SampleEnglish): Promise<void> {
  await payload.update({
    collection: "job-postings",
    id,
    data: {
      title: english.title,
      description: paragraphsToLexical(english.description) as never,
      requirements: paragraphsToLexical(english.requirements) as never,
      ...(english.salaryText ? { salaryText: english.salaryText } : {}),
      hasEnglish: true,
    } as never,
    locale: "en",
    depth: 0,
    overrideAccess: true,
  });
}

async function createJobPosting(payload: Payload, sample: SampleJobPosting, authorId: string, now: Date): Promise<void> {
  const { title, provinceSlug, description, requirements, benefits, english, withCategory, deadlineInDays, ...rest } = sample;
  // Tra tỉnh/danh mục sau khi biết còn tin cần tạo: chạy lại khi đã đủ dữ liệu không đụng tới danh mục.
  const province = await findProvinceId(payload, provinceSlug);
  const category = withCategory ? await findOrCreateJobCategory(payload) : undefined;
  const created = await payload.create({
    collection: "job-postings",
    data: {
      ...rest,
      title,
      description: paragraphsToLexical(description) as never,
      requirements: paragraphsToLexical(requirements) as never,
      ...(benefits ? { benefits: paragraphsToLexical(benefits) as never } : {}),
      deadline: pickerDeadline(deadlineInDays, now),
      ...(category ? { category } : {}),
      province,
      author: authorId,
      status: "published",
    } as never,
    locale: "vi",
    overrideAccess: true,
  });
  if (english) await addEnglish(payload, created.id, english);
}

/**
 * Tin mẫu bản nháp từ lần seed cũ (trước L6-T08): xuất bản và bổ sung bản EN để trang công khai có dữ liệu. Tin đã không còn là nháp
 * (sale/admin đã chỉnh hoặc xuất bản) thì giữ nguyên.
 */
async function completeLegacyDraft(
  payload: Payload,
  sample: SampleJobPosting,
  existing: { id: string; status?: string | null; hasEnglish?: boolean | null },
): Promise<void> {
  if (existing.status !== "draft") return;
  await payload.update({ collection: "job-postings", id: existing.id, data: { status: "published" }, locale: "vi", depth: 0, overrideAccess: true });
  if (sample.english && existing.hasEnglish !== true) await addEnglish(payload, existing.id, sample.english);
}

/**
 * Tạo tin tuyển dụng mẫu (bản `vi`, `published`), idempotent theo tiêu đề `vi` (kể cả bản đã xoá mềm); chạy lại không nhân đôi. Cần địa giới
 * (`pnpm seed`) và ít nhất một admin để làm tác giả; thiếu thì ném lỗi rõ ràng thay vì tạo dữ liệu dở.
 */
export async function seedSampleJobPostings(payload: Payload, now: Date = new Date()): Promise<SeedResult> {
  const author = (
    await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, depth: 0, limit: 1, pagination: false, overrideAccess: true })
  ).docs[0];
  if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả tin tuyển dụng mẫu: tạo admin trước.");

  const result: SeedResult = { created: 0, skipped: 0 };
  for (const sample of SAMPLE_JOB_POSTINGS) {
    const found = await payload.find({
      collection: "job-postings",
      where: { title: { equals: sample.title } },
      locale: "vi",
      fallbackLocale: false,
      trash: true,
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
    });
    const existing = found.docs[0];
    if (!existing) {
      await createJobPosting(payload, sample, author.id, now);
      result.created += 1;
      continue;
    }
    // Bản nháp cũ được hoàn thiện (không tạo mới) nên tính là đã có.
    await completeLegacyDraft(payload, sample, existing);
    result.skipped += 1;
  }
  return result;
}
