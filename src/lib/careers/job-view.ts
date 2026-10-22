import type { EmploymentType } from "../../collections/JobPostings";
import type { Locale } from "../../i18n/routing";
import type { JobPosting, Province } from "../../payload-types";
import { CONTENT_ROUTES } from "../content/content-paths";
import { publicDetailPath } from "../content/redirect-paths";
import { formatDate, formatVndCompact } from "../format";
import { visibleCategory } from "../news/news-view";
import { lexicalPlainText } from "../news/read-time";
import { daysUntilDeadline, isPastDeadline } from "./deadline";

/** Còn từ ngần này ngày trở xuống thì thẻ hiện badge cảnh báo (design-spec S12). */
export const DEADLINE_WARNING_DAYS = 3;

/** Mức lương hiển thị: chữ admin nhập (`salaryText`, theo ngôn ngữ) thắng; không có thì khoảng từ min/max (VNĐ rút gọn). */
export type JobSalary = { kind: "text"; text: string } | { kind: "range"; min?: string; max?: string };

export interface JobCardData {
  id: string;
  title: string;
  href: string;
  provinceName: string | null;
  /** Phòng ban = tên danh mục `job` (BL-054); thiếu / `/en` chưa có bản EN → `null` (không hiện chữ Việt ở `/en`). */
  categoryName: string | null;
  /** "Tuyển gấp" (`isUrgent`, BL-054). */
  isUrgent: boolean;
  employmentType: EmploymentType;
  salary: JobSalary | null;
  /** ISO, cho `<time datetime>`. */
  deadlineIso: string;
  deadlineLabel: string;
  /** Số ngày còn lại (0 = hôm nay) khi ≤ `DEADLINE_WARNING_DAYS`, ngược lại `null` (không hiện badge). */
  warningDaysLeft: number | null;
}

function provinceLabel(province: JobPosting["province"]): string | null {
  if (!province || typeof province !== "object") return null;
  return (province as Province).shortName || (province as Province).name || null;
}

export function toJobSalary(doc: Pick<JobPosting, "salaryText" | "salaryMinVnd" | "salaryMaxVnd">, locale: Locale): JobSalary | null {
  const text = doc.salaryText?.trim();
  if (text) return { kind: "text", text };
  const min = typeof doc.salaryMinVnd === "number" && doc.salaryMinVnd > 0 ? formatVndCompact(doc.salaryMinVnd, locale) : undefined;
  const max = typeof doc.salaryMaxVnd === "number" && doc.salaryMaxVnd > 0 ? formatVndCompact(doc.salaryMaxVnd, locale) : undefined;
  if (!min && !max) return null;
  return { kind: "range", ...(min ? { min } : {}), ...(max ? { max } : {}) };
}

/** Chuỗi lương: `15 triệu – 30 triệu`, hoặc "Từ …"/"Đến …" khi chỉ có một đầu (nhãn do i18n của nơi gọi truyền vào). */
export function formatJobSalary(salary: JobSalary, labels: { from: (amount: string) => string; upTo: (amount: string) => string }): string {
  if (salary.kind === "text") return salary.text;
  if (salary.min && salary.max) return salary.min === salary.max ? salary.min : `${salary.min} – ${salary.max}`;
  if (salary.min) return labels.from(salary.min);
  return labels.upTo(salary.max ?? "");
}

export function toJobCardData(doc: JobPosting, locale: Locale, now: Date): JobCardData | null {
  // Tin không có tiêu đề/slug không dựng được thẻ có link: bỏ qua thay vì render thẻ rỗng.
  if (!doc.title || !doc.slug) return null;
  const daysLeft = daysUntilDeadline(doc.deadline, now);
  return {
    id: doc.id,
    title: doc.title,
    href: publicDetailPath(CONTENT_ROUTES["job-postings"], locale, doc.slug),
    provinceName: provinceLabel(doc.province),
    categoryName: visibleCategory(doc.category, locale)?.name ?? null,
    isUrgent: doc.isUrgent === true,
    employmentType: doc.employmentType,
    salary: toJobSalary(doc, locale),
    deadlineIso: doc.deadline,
    deadlineLabel: formatDate(doc.deadline, locale),
    warningDaysLeft: daysLeft !== null && daysLeft <= DEADLINE_WARNING_DAYS ? daysLeft : null,
  };
}

export function toJobCards(docs: readonly JobPosting[], locale: Locale, now: Date): JobCardData[] {
  return docs.flatMap((doc) => {
    const card = toJobCardData(doc, locale, now);
    return card ? [card] : [];
  });
}

export interface JobDetailView {
  title: string;
  provinceName: string | null;
  workplace: string | null;
  employmentType: EmploymentType;
  quantity: number | null;
  salary: JobSalary | null;
  deadlineIso: string;
  deadlineLabel: string;
  /** Quá hạn nộp (giờ VN): trang hiện băng, ẩn form, `noindex`, bỏ JSON-LD `JobPosting`. */
  expired: boolean;
}

export function toJobDetailView(doc: JobPosting, locale: Locale, now: Date): JobDetailView {
  return {
    title: doc.title ?? "",
    provinceName: provinceLabel(doc.province),
    workplace: doc.workplace?.trim() || null,
    employmentType: doc.employmentType,
    quantity: typeof doc.quantity === "number" && doc.quantity >= 1 ? doc.quantity : null,
    salary: toJobSalary(doc, locale),
    deadlineIso: doc.deadline,
    deadlineLabel: formatDate(doc.deadline, locale),
    expired: isPastDeadline(doc.deadline, now),
  };
}

/** richText có chữ thật không (khối trống không render `h2` mồ côi). */
export function hasRichText(content: unknown): boolean {
  return lexicalPlainText(content).trim() !== "";
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface LexicalBlock {
  type?: string;
  children?: LexicalBlock[];
}

function blockToHtml(block: LexicalBlock): string {
  const own = (node: LexicalBlock) => escapeHtml(lexicalPlainText({ root: node }).trim());
  if (block.type === "list") {
    const items = (block.children ?? []).map(own).filter(Boolean);
    return items.length > 0 ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : "";
  }
  const text = own(block);
  return text ? `<p>${text}</p>` : "";
}

/** HTML tối thiểu (đoạn, danh sách; chữ đã escape) của một richText, cho `description` của JSON-LD `JobPosting`. */
function richTextToHtml(content: unknown): string {
  const blocks = (content as { root?: LexicalBlock } | null | undefined)?.root?.children ?? [];
  return blocks.map(blockToHtml).join("");
}

/** `description` JSON-LD: Google yêu cầu mô tả đầy đủ công việc (HTML); gộp Mô tả, Yêu cầu, Quyền lợi kèm tiêu đề từng phần (đúng ngôn ngữ trang). */
export function jobDescriptionHtml(
  doc: Pick<JobPosting, "description" | "requirements" | "benefits">,
  headings: { description: string; requirements: string; benefits: string },
): string {
  return (
    [
      ["description", doc.description],
      ["requirements", doc.requirements],
      ["benefits", doc.benefits],
    ] as const
  )
    .flatMap(([key, content]) => {
      const html = richTextToHtml(content);
      return html ? [`<h2>${escapeHtml(headings[key])}</h2>${html}`] : [];
    })
    .join("");
}
