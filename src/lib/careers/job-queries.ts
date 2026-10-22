import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, JobPosting } from "../../payload-types";
import { MAX_PAGE_SIZE } from "../content/pagination";
import { findPublicBySlug, findPublicList, type PublicListResult } from "../content/public-queries";
import { startOfVietnamDay } from "./deadline";
import { matchesJobKeyword } from "./job-filters";

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
  /** Phòng ban của hàng (BL-054); populate ở `depth: 1`. */
  category: true,
  isUrgent: true,
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
  /** Từ khoá tìm theo tên vị trí, không dấu (BL-054, `matchesJobKeyword`). Bỏ trống = không tìm. */
  q?: string;
  /** Mốc "hôm nay" (test truyền cố định). */
  now?: Date;
}

/** Quét tối đa 10 trang x 50 = 500 tin còn hạn khi có `q`; vượt thì phần sau không được tìm (tin đang tuyển thực tế chỉ vài chục). */
const KEYWORD_SCAN_MAX_PAGES = 10;

/** Điều kiện chung của danh sách: còn hạn (giờ VN) + danh mục + tỉnh. */
function openJobConditions(query: JobPageQuery): Where {
  return {
    and: [
      { deadline: { greater_than_equal: startOfVietnamDay(query.now ?? new Date()).toISOString() } },
      ...(query.categoryIds ? [{ category: { in: [...query.categoryIds] } }] : []),
      ...(query.provinceId ? [{ province: { equals: query.provinceId } }] : []),
    ],
  };
}

/** Id (đúng thứ tự `JOB_SORT`) của mọi tin khớp điều kiện có tên chứa từ khoá: quét chỉ `title` rồi lọc ở bộ nhớ (không thêm cột `searchText`). */
async function scanKeywordJobIds(payload: Payload, locale: Locale, where: Where, q: string): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; page <= KEYWORD_SCAN_MAX_PAGES; page += 1) {
    const result = await findPublicList<Pick<JobPosting, "id" | "title">>(payload, "job-postings", locale, {
      where,
      sort: JOB_SORT,
      page,
      limit: MAX_PAGE_SIZE,
      depth: 0,
      select: { title: true },
    });
    ids.push(...result.docs.filter((doc) => matchesJobKeyword(doc.title, q)).map((doc) => doc.id));
    if (!result.hasNextPage) break;
    if (page === KEYWORD_SCAN_MAX_PAGES) payload.logger.warn({ cap: KEYWORD_SCAN_MAX_PAGES * MAX_PAGE_SIZE }, "Quét tin tuyển dụng chạm trần: tìm theo từ khoá bị cắt");
  }
  return ids;
}

/** Một trang của danh sách có từ khoá: phân trang trên id đã lọc rồi MỘT truy vấn lấy trường thẻ, trả đúng thứ tự quét. */
async function listKeywordJobs(payload: Payload, locale: Locale, query: JobPageQuery & { q: string }): Promise<PublicListResult<JobPosting>> {
  const where = openJobConditions(query);
  const ids = await scanKeywordJobIds(payload, locale, where, query.q);
  const totalPages = Math.ceil(ids.length / JOB_PAGE_SIZE);
  const pageIds = ids.slice((query.page - 1) * JOB_PAGE_SIZE, query.page * JOB_PAGE_SIZE);
  const docs =
    pageIds.length === 0
      ? []
      : (
          await findPublicList<JobPosting>(payload, "job-postings", locale, {
            where: { and: [where, { id: { in: pageIds } }] },
            limit: pageIds.length,
            depth: 1,
            select: JOB_CARD_FIELDS,
          })
        ).docs;
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  return {
    docs: pageIds.flatMap((id) => byId.get(id) ?? []),
    page: query.page,
    limit: JOB_PAGE_SIZE,
    totalDocs: ids.length,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPrevPage: query.page > 1,
  };
}

/**
 * Một trang vị trí đang tuyển, mới đăng trước. Qua `findPublicList` nên luôn kèm `publicWhere` (đã xuất bản, chưa xoá mềm, `/en` cần
 * `hasEnglish`); thêm `deadline >= 00:00 hôm nay giờ VN` (`startOfVietnamDay`, đúng bằng phủ định của `isPastDeadline`). Tin hết hạn
 * chỉ bị loại khỏi DANH SÁCH: trang chi tiết dùng `findPublicJobBySlug` không lọc hạn (SPECIFICATIONS F6). Có `q` (BL-054) → tìm tên vị trí
 * không dấu trên tập đã quét (`listKeywordJobs`), cùng cỡ trang `JOB_PAGE_SIZE`.
 */
export function listOpenJobs(payload: Payload, locale: Locale, query: JobPageQuery): Promise<PublicListResult<JobPosting>> {
  const q = query.q?.trim();
  if (q) return listKeywordJobs(payload, locale, { ...query, q });
  return findPublicList<JobPosting>(payload, "job-postings", locale, {
    where: openJobConditions(query),
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

/** Số thẻ "Vị trí khác" cuối trang chi tiết (BL-054: 4 thẻ). */
export const OTHER_OPEN_JOBS_COUNT = 4;

/** Vị trí đang xem: loại khỏi gợi ý; `categoryId` (có thể trống) để ưu tiên tin cùng danh mục. */
export interface OtherJobsContext {
  currentId: string;
  categoryId?: string | null;
}

/**
 * "Vị trí khác" (BL-054): tối đa 4 tin còn hạn khác cùng ngôn ngữ (qua `findPublicList`: công khai, `/en` cần `hasEnglish`), loại tin đang xem —
 * tin cùng danh mục trước (mới đăng trước), thiếu thì bù bằng tin mới nhất các danh mục khác (không trùng). Tối đa 2 truy vấn nhỏ. Dùng cho cả tin còn hạn
 * lẫn hết hạn (gợi ý thay thế).
 */
export async function findOtherOpenJobs(payload: Payload, locale: Locale, context: OtherJobsContext, now: Date = new Date()): Promise<JobPosting[]> {
  const open: Where = { deadline: { greater_than_equal: startOfVietnamDay(now).toISOString() } };
  const find = async (where: Where, limit: number) =>
    (await findPublicList<JobPosting>(payload, "job-postings", locale, { where, sort: JOB_SORT, limit, depth: 1, select: JOB_CARD_FIELDS })).docs;
  const sameCategory = context.categoryId
    ? await find({ and: [open, { id: { not_equals: context.currentId } }, { category: { equals: context.categoryId } }] }, OTHER_OPEN_JOBS_COUNT)
    : [];
  if (sameCategory.length >= OTHER_OPEN_JOBS_COUNT) return sameCategory;
  const exclude = [context.currentId, ...sameCategory.map((doc) => doc.id)];
  const rest = await find({ and: [open, { id: { not_in: exclude } }] }, OTHER_OPEN_JOBS_COUNT - sameCategory.length);
  return [...sameCategory, ...rest];
}
