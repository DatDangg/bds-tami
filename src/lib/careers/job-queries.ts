import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, JobPosting } from "../../payload-types";
import { findPublicBySlug, findPublicList, type PublicListResult } from "../content/public-queries";
import { startOfVietnamDay } from "./deadline";

/** 12 vị trí/trang. */
export const JOB_PAGE_SIZE = 12;

const JOB_SORT = ["-publishedAt", "-createdAt"];
const CATEGORY_SORT = ["sortOrder", "createdAt"];
/** Danh mục nền ít, tối đa 2 cấp (ERD §4.3). */
const CATEGORY_LIMIT = 50;
const JOB_CATEGORY_SCOPE: Where = { scope: { equals: "job" } };

/** Trường thẻ tuyển dụng cần: bỏ `description`/`requirements`/`benefits` (richText dài) khỏi truy vấn danh sách. */
const JOB_CARD_FIELDS = {
  title: true,
  slug: true,
  province: true,
  workplace: true,
  employmentType: true,
  salaryMinVnd: true,
  salaryMaxVnd: true,
  salaryText: true,
  deadline: true,
  publishedAt: true,
} as const;

/** Danh mục `job` cấp 1 của một ngôn ngữ (chip của S12). `/en` chỉ gồm danh mục đã có bản EN. */
export function listRootJobCategories(payload: Payload, locale: Locale): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [JOB_CATEGORY_SCOPE, { parent: { exists: false } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục con (cấp 2) của một danh mục `job`. */
export function listChildJobCategories(payload: Payload, locale: Locale, parentId: string): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [JOB_CATEGORY_SCOPE, { parent: { equals: parentId } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục `job` theo slug của ngôn ngữ đang xem (slug chỉ duy nhất trong cùng scope). `parent` đã populate. */
export function findJobCategoryBySlug(payload: Payload, locale: Locale, slug: string): Promise<Category | null> {
  return findPublicBySlug<Category>(payload, "categories", locale, slug, { where: JOB_CATEGORY_SCOPE, depth: 1 });
}

export interface JobPageQuery {
  page: number;
  /** Lọc theo các danh mục này (danh mục + con của nó). Bỏ trống = mọi danh mục. */
  categoryIds?: readonly string[];
  provinceId?: string;
  /** Mốc "hôm nay" (test truyền cố định). */
  now?: Date;
}

/**
 * Một trang vị trí đang tuyển, mới đăng trước. Qua `findPublicList` nên luôn kèm `publicWhere` (đã xuất bản, chưa xoá mềm, `/en` cần
 * `hasEnglish`); thêm `deadline >= 00:00 hôm nay giờ VN` (`startOfVietnamDay`, đúng bằng phủ định của `isPastDeadline`). Tin hết hạn
 * chỉ bị loại khỏi DANH SÁCH: trang chi tiết dùng `findPublicJobBySlug` không lọc hạn (SPECIFICATIONS F6).
 */
export function listOpenJobs(payload: Payload, locale: Locale, query: JobPageQuery): Promise<PublicListResult<JobPosting>> {
  const conditions: Where[] = [
    { deadline: { greater_than_equal: startOfVietnamDay(query.now ?? new Date()).toISOString() } },
    ...(query.categoryIds ? [{ category: { in: [...query.categoryIds] } }] : []),
    ...(query.provinceId ? [{ province: { equals: query.provinceId } }] : []),
  ];
  return findPublicList<JobPosting>(payload, "job-postings", locale, {
    where: { and: conditions },
    sort: JOB_SORT,
    page: query.page,
    limit: JOB_PAGE_SIZE,
    depth: 1,
    select: JOB_CARD_FIELDS,
  });
}

/** Vị trí công khai theo slug (KỂ CẢ đã hết hạn: URL đã chia sẻ vẫn mở, trang hiện băng "hết hạn"). `depth: 1` populate tỉnh/danh mục. */
export function findPublicJobBySlug(payload: Payload, locale: Locale, slug: string): Promise<JobPosting | null> {
  return findPublicBySlug<JobPosting>(payload, "job-postings", locale, slug, { depth: 1 });
}

/** Số vị trí gợi ý cuối trang chi tiết hết hạn. */
export const OTHER_OPEN_JOBS_COUNT = 3;

/** Tối đa 3 vị trí khác đang tuyển (mới đăng trước, loại vị trí hiện tại): gợi ý ở trang chi tiết đã hết hạn. */
export async function findOtherOpenJobs(payload: Payload, locale: Locale, currentId: string, now: Date = new Date()): Promise<JobPosting[]> {
  const { docs } = await findPublicList<JobPosting>(payload, "job-postings", locale, {
    where: { and: [{ deadline: { greater_than_equal: startOfVietnamDay(now).toISOString() } }, { id: { not_equals: currentId } }] },
    sort: JOB_SORT,
    limit: OTHER_OPEN_JOBS_COUNT,
    depth: 1,
    select: JOB_CARD_FIELDS,
  });
  return docs;
}
