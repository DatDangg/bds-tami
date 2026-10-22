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
  /** Tiêu đề hero tách 2 dòng (`splitJobTitle`); 1 phần tử = 1 dòng. */
  titleLines: JobTitleLines;
  /** Mô tả ngắn hero = đoạn dẫn của `description` (`splitDescriptionLead`); không tách được → `null` (ẩn). */
  intro: string | null;
  /** Phòng ban = tên danh mục `job` (`/en` chưa có bản EN → `null`). */
  categoryName: string | null;
  /** Id danh mục: "Vị trí khác" ưu tiên tin cùng danh mục. */
  categoryId: string | null;
  isUrgent: boolean;
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
  const title = doc.title ?? "";
  const category = doc.category;
  return {
    title,
    titleLines: splitJobTitle(title),
    intro: splitDescriptionLead(doc.description).intro,
    categoryName: visibleCategory(category, locale)?.name ?? null,
    categoryId: typeof category === "string" ? category : (category?.id ?? null),
    isUrgent: doc.isUrgent === true,
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

export type JobTitleLines = readonly [string] | readonly [string, string];

/** Gạch nối có khoảng trắng hai bên (`–`, `—`, `-`): ranh giới cụm tự nhiên của tên vị trí ("Nhân viên hành chính – nhân sự"). */
const TITLE_DASH = /\s+[–—-]\s+/;
/** Từ nối mở đầu cụm bổ nghĩa ("… cho thuê căn hộ", "… for rental apartments"): tách TRƯỚC từ này. */
const TITLE_CONNECTORS = new Set(["cho", "tại", "về", "mảng", "for", "at", "in", "of"]);
/** Tách theo từ nối chỉ khi tiêu đề từ ngần này tiếng (tên ngắn để 1 dòng). */
const TITLE_CONNECTOR_MIN_WORDS = 5;
/** Không có gạch / từ nối: từ ngần này tiếng trở lên mới chia đôi (ngắn hơn để 1 dòng). */
const TITLE_SPLIT_MIN_WORDS = 6;
/** Mỗi dòng giữ ít nhất 2 tiếng (không để dòng mồ côi một tiếng). */
const TITLE_MIN_LINE_WORDS = 2;

/**
 * Tách tên vị trí thành 2 dòng cho hero (BL-054, design: dòng 2 màu nhấn) theo quy tắc hiển thị, không thêm trường. Thứ tự: (1) gạch nối có khoảng trắng →
 * dòng 1 phần trước (giữ gạch ở cuối), dòng 2 phần sau; (2) tiêu đề ≥ 5 tiếng có từ nối (cuối cùng, chừa ≥ 2 tiếng mỗi bên) → dòng 2 bắt đầu từ từ nối; (3) ≥ 6 tiếng →
 * cắt ở tiếng chẵn gần nửa (tiếng Việt phần lớn là từ ghép 2 tiếng nên cắt chẵn ít tách đôi một từ); còn lại 1 dòng. Ghép 2 dòng bằng một khoảng trắng
 * luôn ra lại đúng tiêu đề (đã gộp khoảng trắng), nên `h1` vẫn đọc đủ tên.
 */
export function splitJobTitle(title: string): JobTitleLines {
  const flat = title.replace(/\s+/g, " ").trim();
  const dash = TITLE_DASH.exec(flat);
  if (dash && dash.index > 0 && dash.index + dash[0].length < flat.length) {
    return [`${flat.slice(0, dash.index)} ${dash[0].trim()}`, flat.slice(dash.index + dash[0].length)];
  }
  const words = flat.split(" ");
  const lineAt = (cut: number): JobTitleLines => [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
  for (let index = words.length - TITLE_MIN_LINE_WORDS; words.length >= TITLE_CONNECTOR_MIN_WORDS && index >= TITLE_MIN_LINE_WORDS; index -= 1) {
    if (TITLE_CONNECTORS.has((words[index] ?? "").toLocaleLowerCase("vi"))) return lineAt(index);
  }
  if (words.length < TITLE_SPLIT_MIN_WORDS) return [flat];
  return lineAt(Math.min(words.length - TITLE_MIN_LINE_WORDS, 2 * Math.ceil(words.length / 4)));
}

export interface DescriptionLead {
  /** Mô tả ngắn hero = đoạn dẫn chữ thuần (khoảng trắng đã gộp); `null` khi không tách được (hero ẩn mô tả ngắn). */
  intro: string | null;
  /** Thân mục "Mô tả công việc": mọi khối trừ đúng đoạn dẫn (và các đoạn rỗng trước nó) khi đã đưa lên hero; không tách thì là chính `content`. */
  body: unknown;
}

interface LexicalNode {
  type?: string;
  format?: number | string;
  style?: string;
  indent?: number;
  text?: string;
  children?: unknown[];
}

/**
 * Đoạn rỗng: `paragraph` mà mọi con chỉ là `text` rỗng/khoảng trắng hoặc `linebreak` (không chữ, không nút nội dung nào khác).
 * Chỉ loại khối này được bỏ qua khi tìm đoạn dẫn — ảnh/upload, HR, relationship… không có chữ nhưng vẫn là nội dung.
 */
function isEmptyParagraph(block: LexicalNode): boolean {
  if (block.type !== "paragraph") return false;
  return (block.children ?? []).every((child) => {
    const node = child as LexicalNode;
    return node.type === "linebreak" || (node.type === "text" && !(node.text ?? "").trim());
  });
}

/**
 * Đoạn chữ thuần: căn lề mặc định (`format` rỗng), không thụt lề (`indent` 0), mọi con là nút `text` không định dạng (`format` 0 — không
 * đậm/nghiêng/gạch chân/gạch ngang/code…, không `style` riêng). Có link, xuống dòng, định dạng, căn lề/thụt lề hay nút khác → `false`: hero hiện
 * chữ thuần căn trái, tách đoạn đó ra sẽ làm mất link / định dạng / trình bày.
 */
function isPlainTextParagraph(block: LexicalNode): boolean {
  if (block.type !== "paragraph" || block.format || block.indent) return false;
  return (block.children ?? []).every((child) => {
    const node = child as LexicalNode;
    return node.type === "text" && !node.format && !node.style;
  });
}

/**
 * Tách đoạn dẫn của `description` cho chi tiết tuyển dụng (BL-054 C11, tiền lệ BL-056 "đoạn dẫn + phần còn lại"). Quy tắc bảo thủ — không có
 * đường mất nội dung: bỏ qua CHỈ các đoạn rỗng ở đầu (`isEmptyParagraph`); khối đầu tiên còn lại phải là ĐOẠN CHỮ THUẦN (`isPlainTextParagraph`)
 * và phần sau còn chữ → đoạn đó lên hero (toàn văn, không cắt dòng), thân = các khối sau nó (chỉ bỏ đoạn dẫn + đoạn rỗng trước nó). Khối khác đứng
 * trước (ảnh/upload, HR, relationship, tiêu đề, danh sách, trích dẫn, block…) / đoạn đầu có link, định dạng, căn lề, thụt lề / chỉ có một khối có
 * chữ → không tách: thân là chính `content`, hero không hiện mô tả ngắn.
 * Chỉ dùng cho hiển thị: JSON-LD `description` và meta vẫn đọc `description` đầy đủ.
 */
export function splitDescriptionLead(content: unknown): DescriptionLead {
  const root = (content as { root?: { children?: unknown[] } } | null | undefined)?.root;
  const blocks = (root?.children ?? []) as LexicalNode[];
  const leadIndex = blocks.findIndex((block) => !isEmptyParagraph(block));
  const lead = blocks[leadIndex];
  if (!lead || !isPlainTextParagraph(lead)) return { intro: null, body: content };
  // Mọi khối trước leadIndex đều là đoạn rỗng (findIndex) → bỏ cùng đoạn dẫn không mất nội dung.
  const rest = blocks.slice(leadIndex + 1);
  if (!hasRichText({ root: { children: rest } })) return { intro: null, body: content };
  return {
    intro: lexicalPlainText({ root: lead }).replace(/\s+/g, " ").trim(),
    body: { ...(content as object), root: { ...root, children: rest } },
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
