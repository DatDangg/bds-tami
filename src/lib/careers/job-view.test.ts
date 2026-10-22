import { describe, expect, it } from "vitest";

import type { JobPosting } from "../../payload-types";
import { formatJobSalary, hasRichText, jobDescriptionHtml, splitDescriptionLead, splitJobTitle, toJobCardData, toJobCards, toJobDetailView, toJobSalary } from "./job-view";
import { toJobPostingJsonLdInput } from "./job-json-ld";

const NOW = new Date("2026-10-17T10:00:00.000Z");
const text = (value: string) => ({ type: "text", version: 1, text: value });
const paragraph = (value: string) => ({ type: "paragraph", version: 1, children: [text(value)] });
const list = (...items: string[]) => ({ type: "list", version: 1, children: items.map((item) => ({ type: "listitem", version: 1, children: [text(item)] })) });
interface Block {
  [key: string]: unknown;
  type: string;
  version: number;
  children: unknown[];
}
const richText = (...blocks: Block[]) => ({ root: { type: "root", version: 1, direction: "ltr" as const, format: "" as const, indent: 0, children: blocks } });

const job = (overrides: Partial<JobPosting> = {}): JobPosting =>
  ({
    id: "j1",
    title: "Tư vấn",
    slug: "tu-van",
    employmentType: "full_time",
    deadline: "2026-10-20T12:00:00.000Z",
    createdAt: "2026-09-30T00:00:00.000Z",
    updatedAt: "2026-09-30T00:00:00.000Z",
    publishedAt: "2026-10-01T00:00:00.000Z",
    description: richText(paragraph("Mô tả")),
    requirements: richText(paragraph("Yêu cầu")),
    ...overrides,
  }) as JobPosting;

const labels = { from: (amount: string) => `Từ ${amount}`, upTo: (amount: string) => `Đến ${amount}` };

describe("lương", () => {
  it("chữ admin nhập thắng số; không chữ thì khoảng min/max; chỉ một đầu → Từ/Đến; không có gì → null", () => {
    expect(toJobSalary({ salaryText: " Thỏa thuận ", salaryMinVnd: 1, salaryMaxVnd: 2 }, "vi")).toEqual({ kind: "text", text: "Thỏa thuận" });
    expect(formatJobSalary(toJobSalary({ salaryMinVnd: 15_000_000, salaryMaxVnd: 30_000_000 }, "vi")!, labels)).toBe("15 triệu – 30 triệu");
    expect(formatJobSalary(toJobSalary({ salaryMinVnd: 15_000_000 }, "vi")!, labels)).toBe("Từ 15 triệu");
    expect(formatJobSalary(toJobSalary({ salaryMaxVnd: 2_000_000_000 }, "en")!, labels)).toBe("Đến 2 billion VND");
    expect(formatJobSalary(toJobSalary({ salaryMinVnd: 20_000_000, salaryMaxVnd: 20_000_000 }, "vi")!, labels)).toBe("20 triệu");
    expect(toJobSalary({ salaryText: "  ", salaryMinVnd: 0 }, "vi")).toBeNull();
  });
});

describe("thẻ + chi tiết", () => {
  it("badge cảnh báo chỉ khi còn ≤ 3 ngày theo lịch VN; 0 = hôm nay", () => {
    const daysLeft = (deadline: string) => toJobCardData(job({ deadline }), "vi", NOW)?.warningDaysLeft;
    expect(daysLeft("2026-10-17T12:00:00.000Z")).toBe(0);
    expect(daysLeft("2026-10-20T12:00:00.000Z")).toBe(3);
    expect(daysLeft("2026-10-21T12:00:00.000Z")).toBeNull();
    expect(daysLeft("2026-10-16T12:00:00.000Z")).toBeNull();
  });

  it("thẻ thiếu tiêu đề/slug bị bỏ; href theo ngôn ngữ", () => {
    expect(toJobCards([job({ title: null }), job({ slug: null }), job()], "vi", NOW)).toHaveLength(1);
    expect(toJobCardData(job(), "en", NOW)?.href).toBe("/en/careers/tu-van");
    expect(toJobCardData(job(), "vi", NOW)?.href).toBe("/tuyen-dung/tu-van");
  });

  it("BL-054: phòng ban = tên danh mục (/en chỉ khi danh mục có bản EN), Tuyển gấp theo isUrgent, hạn dd/mm/yyyy (vi) · MM/DD/YYYY (en)", () => {
    const category = { id: "c1", name: "Kinh doanh", slug: "kinh-doanh", scope: "job", hasEnglish: false, createdAt: "", updatedAt: "" } as const;
    const vi = toJobCardData(job({ category, isUrgent: true, deadline: "2026-11-30T12:00:00.000Z" }), "vi", NOW);
    expect(vi).toMatchObject({ categoryName: "Kinh doanh", isUrgent: true, deadlineLabel: "30/11/2026" });
    const en = toJobCardData(job({ category, deadline: "2026-11-30T12:00:00.000Z" }), "en", NOW);
    expect(en).toMatchObject({ categoryName: null, isUrgent: false, deadlineLabel: "11/30/2026" });
    expect(toJobCardData(job({ category: { ...category, name: "Sales", hasEnglish: true } }), "en", NOW)?.categoryName).toBe("Sales");
    expect(toJobCardData(job({ category: "c1" }), "vi", NOW)?.categoryName).toBeNull();
  });

  it("chi tiết: expired theo giờ VN; số lượng < 1 hoặc thiếu → null", () => {
    expect(toJobDetailView(job({ deadline: "2026-10-17T12:00:00.000Z" }), "vi", NOW).expired).toBe(false);
    expect(toJobDetailView(job({ deadline: "2026-10-16T12:00:00.000Z" }), "vi", NOW).expired).toBe(true);
    expect(toJobDetailView(job({ quantity: 0 }), "vi", NOW).quantity).toBeNull();
    expect(toJobDetailView(job({ quantity: 3 }), "vi", NOW).quantity).toBe(3);
  });
});

describe("richText → HTML cho JSON-LD", () => {
  const headings = { description: "Mô tả công việc", requirements: "Yêu cầu", benefits: "Quyền lợi" };

  it("đoạn → <p>, danh sách → <ul><li>, chữ được escape, phần trống bị bỏ", () => {
    const html = jobDescriptionHtml(
      { description: richText(paragraph("A & B <b>"), list("Một", "Hai")), requirements: richText(paragraph("  ")), benefits: null },
      headings,
    );
    expect(html).toBe("<h2>Mô tả công việc</h2><p>A &amp; B &lt;b&gt;</p><ul><li>Một</li><li>Hai</li></ul>");
  });

  it("hasRichText: khối chỉ có khoảng trắng hoặc null là rỗng", () => {
    expect(hasRichText(richText(paragraph("  ")))).toBe(false);
    expect(hasRichText(null)).toBe(false);
    expect(hasRichText(richText(paragraph("x")))).toBe(true);
  });
});

describe("toJobPostingJsonLdInput", () => {
  const context = {
    locale: "vi" as const,
    url: "https://x.test/tuyen-dung/tu-van",
    hiringOrganization: { name: "TAMI", siteUrl: "https://x.test" },
    headings: { description: "Mô tả", requirements: "Yêu cầu", benefits: "Quyền lợi" },
  };

  it("đủ trường Google: title, description, datePosted, validThrough (cuối ngày hạn giờ VN), employmentType, hiringOrganization, jobLocation, baseSalary", () => {
    const input = toJobPostingJsonLdInput(job({ salaryMinVnd: 10_000_000, salaryMaxVnd: 20_000_000, workplace: "Số 1", employmentType: "internship" }), context);
    expect(input).toMatchObject({
      title: "Tư vấn",
      datePosted: "2026-10-01T00:00:00.000Z",
      validThrough: "2026-10-20T23:59:59+07:00",
      employmentType: "INTERN",
      hiringOrganization: { name: "TAMI" },
      location: { streetAddress: "Số 1", province: null },
      baseSalary: { currency: "VND", minValue: 10_000_000, maxValue: 20_000_000 },
    });
    expect(input?.description).toContain("<h2>Mô tả</h2><p>Mô tả</p>");
  });

  it("chỉ có chữ lương (không số) → không baseSalary; contract → CONTRACTOR; thiếu ngày đăng dùng createdAt", () => {
    const input = toJobPostingJsonLdInput(job({ salaryText: "Thỏa thuận", employmentType: "contract", publishedAt: null }), context);
    expect(input?.baseSalary).toBeNull();
    expect(input?.employmentType).toBe("CONTRACTOR");
    expect(input?.datePosted).toBe("2026-09-30T00:00:00.000Z");
  });

  it("thiếu mô tả, hạn hỏng hoặc không có ngày nào → null (bỏ JSON-LD thay vì phát dữ liệu Google từ chối)", () => {
    expect(toJobPostingJsonLdInput(job({ description: richText(paragraph(" ")), requirements: null }), context)).toBeNull();
    expect(toJobPostingJsonLdInput(job({ deadline: "hong" }), context)).toBeNull();
    expect(toJobPostingJsonLdInput(job({ publishedAt: null, createdAt: "" }), context)).toBeNull();
    expect(toJobPostingJsonLdInput(job({ title: null }), context)).toBeNull();
  });
});

describe("hero chi tiết (BL-054)", () => {
  it("splitJobTitle: gạch nối → từ nối → ≥ 6 tiếng cắt chẵn gần nửa → 1 dòng; mỗi dòng ≥ 2 tiếng; ghép lại đúng tiêu đề", () => {
    expect(splitJobTitle("Nhân viên hành chính – nhân sự")).toEqual(["Nhân viên hành chính –", "nhân sự"]);
    expect(splitJobTitle("Sales - Hà Nội")).toEqual(["Sales -", "Hà Nội"]);
    expect(splitJobTitle("Chuyên viên tư vấn cho thuê căn hộ")).toEqual(["Chuyên viên tư vấn", "cho thuê căn hộ"]);
    expect(splitJobTitle("Rental consultant for serviced apartments")).toEqual(["Rental consultant", "for serviced apartments"]);
    expect(splitJobTitle("Trưởng nhóm kinh doanh dự án")).toEqual(["Trưởng nhóm kinh doanh", "dự án"]);
    expect(splitJobTitle("Chuyên viên tư vấn bất động sản")).toEqual(["Chuyên viên tư vấn", "bất động sản"]);
    expect(splitJobTitle("Nhân viên chăm sóc khách hàng")).toEqual(["Nhân viên chăm sóc", "khách hàng"]);
    expect(splitJobTitle("Thực tập sinh kế toán")).toEqual(["Thực tập sinh kế toán"]);
    expect(splitJobTitle("Tư vấn cho thuê")).toEqual(["Tư vấn cho thuê"]);
    expect(splitJobTitle("Chuyên viên tư vấn")).toEqual(["Chuyên viên tư vấn"]);
    expect(splitJobTitle("Full-stack developer")).toEqual(["Full-stack developer"]);
    expect(splitJobTitle("– Kế toán")).toEqual(["– Kế toán"]);
    expect(splitJobTitle("  Kế   toán  ")).toEqual(["Kế toán"]);
    for (const title of ["Nhân viên hành chính – nhân sự", "Chuyên viên tư vấn cho thuê căn hộ", "Kế toán"]) {
      expect(splitJobTitle(title).join(" ")).toBe(title);
    }
  });

  it("splitDescriptionLead (C11): đoạn đầu có chữ lên hero, thân bỏ đoạn đó khi phần sau còn chữ; 1 đoạn / khối đầu là danh sách → không tách", () => {
    const multi = richText(paragraph(""), paragraph("Gia nhập  đội ngũ TAMI."), paragraph("Đoạn 2"), list("Ý 1"));
    const split = splitDescriptionLead(multi);
    expect(split.intro).toBe("Gia nhập đội ngũ TAMI.");
    const body = split.body as ReturnType<typeof richText>;
    expect(body.root.children).toEqual([paragraph("Đoạn 2"), list("Ý 1")]);
    expect(body.root.type).toBe("root");
    // Không đổi dữ liệu gốc (JSON-LD / meta đọc lại `description` đầy đủ).
    expect(multi.root.children).toHaveLength(4);
    const single = richText(paragraph("Chỉ một đoạn"), paragraph(" "));
    expect(splitDescriptionLead(single)).toEqual({ intro: null, body: single });
    const listFirst = richText(list("Ý 1", "Ý 2"), paragraph("Đoạn sau"));
    expect(splitDescriptionLead(listFirst)).toEqual({ intro: null, body: listFirst });
    expect(splitDescriptionLead(richText(paragraph(" "))).intro).toBeNull();
    expect(splitDescriptionLead(null)).toEqual({ intro: null, body: null });
  });

  it("splitDescriptionLead (C11 attempt 2): đoạn dẫn dài vẫn lấy toàn văn; đoạn có link / định dạng / style → không tách (không mất link, định dạng)", () => {
    const longLead = "Gia nhập đội ngũ TAMI, trở thành một phần của hành trình kiến tạo giá trị bền vững trong lĩnh vực bất động sản cho thuê, ".repeat(3).trim();
    expect(splitDescriptionLead(richText(paragraph(longLead), paragraph("Đoạn 2"))).intro).toBe(longLead);
    const link = { type: "link", version: 1, fields: { url: "https://tami.example" }, children: [text("trang tuyển dụng")] };
    const withLink = richText({ type: "paragraph", version: 1, children: [text("Xem "), link] }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(withLink)).toEqual({ intro: null, body: withLink });
    const bold = richText({ type: "paragraph", version: 1, children: [text("Mở đầu "), { ...text("đậm"), format: 1 }] }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(bold)).toEqual({ intro: null, body: bold });
    const styled = richText({ type: "paragraph", version: 1, children: [{ ...text("Màu"), format: 0, style: "color: red" }] }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(styled).intro).toBeNull();
    const lineBreak = richText({ type: "paragraph", version: 1, children: [text("Dòng 1"), { type: "linebreak", version: 1 }, text("Dòng 2")] }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(lineBreak).intro).toBeNull();
    // `format: 0` tường minh vẫn là chữ thuần.
    const explicitPlain = richText({ type: "paragraph", version: 1, children: [{ ...text("Thuần"), format: 0, style: "" }] }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(explicitPlain).intro).toBe("Thuần");
  });

  it("splitDescriptionLead (C11 attempt 3): chỉ bỏ qua đoạn rỗng ở đầu; ảnh / HR / relationship / tiêu đề đứng trước → không tách (không mất khối); đoạn căn lề / thụt lề → không tách", () => {
    const upload = { type: "upload", version: 1, relationTo: "media", value: { id: "m1", url: "/a.jpg", alt: "Ảnh", mimeType: "image/jpeg" }, children: [] };
    const imageFirst = richText(upload, paragraph("Gia nhập TAMI."), paragraph("Đoạn 2"));
    expect(splitDescriptionLead(imageFirst)).toEqual({ intro: null, body: imageFirst });
    const emptyThenImage = richText(paragraph(""), upload, paragraph("Gia nhập TAMI."), paragraph("Đoạn 2"));
    expect(splitDescriptionLead(emptyThenImage)).toEqual({ intro: null, body: emptyThenImage });
    const hrFirst = richText({ type: "horizontalrule", version: 1, children: [] }, paragraph("Gia nhập TAMI."), paragraph("Đoạn 2"));
    expect(splitDescriptionLead(hrFirst)).toEqual({ intro: null, body: hrFirst });
    const relationFirst = richText({ type: "relationship", version: 1, relationTo: "news", value: "n1", children: [] }, paragraph("A"), paragraph("B"));
    expect(splitDescriptionLead(relationFirst)).toEqual({ intro: null, body: relationFirst });
    const headingFirst = richText({ type: "heading", tag: "h3", version: 1, children: [text("Tiêu đề")] }, paragraph("A"), paragraph("B"));
    expect(splitDescriptionLead(headingFirst)).toEqual({ intro: null, body: headingFirst });

    // Đoạn rỗng (text trắng / không con / chỉ xuống dòng) ở đầu rồi đoạn chữ thuần → tách đúng, thân giữ mọi khối sau (kể cả ảnh).
    const emptyLeading = richText(
      paragraph("  "),
      { type: "paragraph", version: 1, children: [] },
      { type: "paragraph", version: 1, children: [{ type: "linebreak", version: 1 }] },
      paragraph("Gia nhập TAMI."),
      upload,
      paragraph("Đoạn 2"),
    );
    const split = splitDescriptionLead(emptyLeading);
    expect(split.intro).toBe("Gia nhập TAMI.");
    expect((split.body as { root: { children: unknown[] } }).root.children).toEqual([upload, paragraph("Đoạn 2")]);

    const centered = richText({ ...paragraph("Căn giữa"), format: "center" }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(centered)).toEqual({ intro: null, body: centered });
    const indented = richText({ ...paragraph("Thụt lề"), indent: 1 }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(indented)).toEqual({ intro: null, body: indented });
    const defaultFormat = richText({ ...paragraph("Mặc định"), format: "", indent: 0 }, paragraph("Đoạn 2"));
    expect(splitDescriptionLead(defaultFormat).intro).toBe("Mặc định");
  });

  it("toJobDetailView: phòng ban + id danh mục, Tuyển gấp, mô tả ngắn, tiêu đề 2 dòng; /en ẩn danh mục chưa có bản EN", () => {
    const category = { id: "c1", name: "Kinh doanh", slug: "kinh-doanh", scope: "job", hasEnglish: false, createdAt: "", updatedAt: "" } as never;
    const description = richText(paragraph("Mô tả"), paragraph("Chi tiết"));
    const view = toJobDetailView(job({ title: "Chuyên viên tư vấn cho thuê căn hộ", category, isUrgent: true, description }), "vi", NOW);
    expect(view).toMatchObject({ categoryName: "Kinh doanh", categoryId: "c1", isUrgent: true, intro: "Mô tả", titleLines: ["Chuyên viên tư vấn", "cho thuê căn hộ"] });
    // Chỉ 1 đoạn: giữ trong thân, hero không lặp.
    expect(toJobDetailView(job(), "vi", NOW).intro).toBeNull();
    expect(toJobDetailView(job({ category }), "en", NOW)).toMatchObject({ categoryName: null, categoryId: "c1" });
    expect(toJobDetailView(job({ category: "c9" }), "vi", NOW)).toMatchObject({ categoryName: null, categoryId: "c9", isUrgent: false });
    expect(toJobDetailView(job({ category: null }), "vi", NOW).categoryId).toBeNull();
  });
});
