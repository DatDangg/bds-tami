import { describe, expect, it } from "vitest";

import {
  checkNewsEntry,
  CONTENT_DATASET,
  countImportProblems,
  formatImportLine,
  importConfirmProblem,
  importExitCode,
  mallocTuningEnv,
  normaliseMarkdown,
  parseFrontmatter,
  parseImportArgs,
  parseTags,
  resolveImagePath,
} from "../../seed/content/import-plan";

describe("importConfirmProblem", () => {
  it("dry-run không cần confirm", () => expect(importConfirmProblem(CONTENT_DATASET, false, {})).toBeNull());
  it("apply thiếu confirm → từ chối", () => expect(importConfirmProblem(CONTENT_DATASET, true, {})).toContain("IMPORT_CONFIRM=2026-10-23"));
  it("apply confirm sai → từ chối", () => expect(importConfirmProblem(CONTENT_DATASET, true, { IMPORT_CONFIRM: "2026-10-22" })).toContain("khác tên bộ dữ liệu"));
  it("apply confirm đúng → cho phép, kể cả APP_ENV=production", () => expect(importConfirmProblem(CONTENT_DATASET, true, { IMPORT_CONFIRM: CONTENT_DATASET, APP_ENV: "production" })).toBeNull());
});

describe("parseImportArgs", () => {
  it("mặc định dry-run; apply là tham số vị trí; tham số lạ bị gom", () => {
    expect(parseImportArgs([])).toEqual({ apply: false, unknown: [] });
    expect(parseImportArgs(["apply"])).toEqual({ apply: true, unknown: [] });
    expect(parseImportArgs(["aply"])).toEqual({ apply: false, unknown: ["aply"] });
  });
});

describe("resolveImagePath", () => {
  it("tính từ IMPORT_IMG_DIR, bỏ tiền tố img/ của bản cũ, giữ đường dẫn tuyệt đối", () => {
    const posix = (value: string) => value.split("\\").join("/");
    expect(posix(resolveImagePath("/anh", "img/a/x.jpg"))).toBe("/anh/a/x.jpg");
    expect(posix(resolveImagePath("/anh", "a/x.jpg"))).toBe("/anh/a/x.jpg");
    expect(resolveImagePath("/anh", "/khac/x.jpg")).toBe("/khac/x.jpg");
  });
});

describe("normaliseMarkdown", () => {
  it("bảng → danh sách (bỏ cột STT), checklist → gạch đầu dòng", () => {
    const md = "| STT | Tên | Giá |\n|---|---|---|\n| 1 | A | 10 |\n| 2 | B | — |\n\n- [ ] việc";
    expect(normaliseMarkdown(md)).toBe("- **A** — Giá: 10\n- **B**\n\n\n- việc");
  });
});

describe("parseFrontmatter / parseTags", () => {
  const md = '---\ntitle: "Tiêu đề: thử"\nslug: tin-thu\ntags: [a, "b c"]\n---\n\nNội dung\n';
  it("tách meta và thân bài", () => {
    const { meta, body } = parseFrontmatter(md);
    expect(meta).toMatchObject({ title: "Tiêu đề: thử", slug: "tin-thu" });
    expect(body).toBe("Nội dung");
    expect(parseTags(meta.tags)).toEqual(["a", "b c"]);
  });
  it("thiếu frontmatter → ném lỗi", () => expect(() => parseFrontmatter("không có")).toThrow("Thiếu frontmatter"));
});

describe("checkNewsEntry (kế hoạch nhập tin)", () => {
  const ok = { file: "a.md", meta: { slug: "a", title: "A" }, body: "Nội dung", hasCover: true, status: "published" as const };
  it("hợp lệ → không lỗi", () => expect(checkNewsEntry(ok)).toEqual([]));
  it("còn [CẦN KIỂM TRA] → lỗi", () => expect(checkNewsEntry({ ...ok, body: "x [CẦN KIỂM TRA] y" })).toEqual(["a.md: còn [CẦN KIỂM TRA]"]));
  it("thiếu ảnh bìa: lỗi khi xuất bản, được khi nháp", () => {
    expect(checkNewsEntry({ ...ok, hasCover: false })).toHaveLength(1);
    expect(checkNewsEntry({ ...ok, hasCover: false, status: "draft" })).toEqual([]);
  });
  it("tin đã có trong DB: không kiểm ảnh bìa / [CẦN KIỂM TRA] (được báo 'đã có, bỏ qua' trước, không chặn apply)", () => {
    expect(checkNewsEntry({ ...ok, hasCover: false, body: "[CẦN KIỂM TRA]", alreadyExists: true })).toEqual([]);
  });
  it("thiếu slug/title → lỗi", () => expect(checkNewsEntry({ ...ok, meta: {} })).toHaveLength(2));
});

describe("báo cáo kế hoạch", () => {
  const lines = [
    { kind: "project" as const, key: "p", status: "create" as const, detail: "3 ảnh" },
    { kind: "news" as const, key: "n", status: "exists" as const },
    { kind: "media" as const, key: "f.jpg", status: "error" as const, detail: "thiếu file" },
  ];
  it("đếm lỗi, dry-run 'sẽ tạo' / apply 'đã tạo'", () => {
    expect(countImportProblems(lines)).toBe(1);
    expect(formatImportLine(lines[0]!, false)).toBe("[project] sẽ tạo: p — 3 ảnh");
    expect(formatImportLine(lines[0]!, true)).toBe("[project] đã tạo: p — 3 ảnh");
    expect(formatImportLine(lines[1]!, false)).toBe("[news] đã có, bỏ qua: n");
  });
});

describe("importExitCode", () => {
  it("0 khi không lỗi, 1 khi còn ít nhất một lỗi", () => {
    expect(importExitCode(0)).toBe(0);
    expect(importExitCode(1)).toBe(1);
    expect(importExitCode(7)).toBe(1);
  });
});

describe("mallocTuningEnv", () => {
  it("Linux glibc chưa đặt MALLOC_ARENA_MAX → đặt arena + ngưỡng mmap", () => {
    expect(mallocTuningEnv("linux", "2.36", {})).toEqual({ MALLOC_ARENA_MAX: "2", MALLOC_MMAP_THRESHOLD_: "131072" });
  });
  it("không re-exec: không phải Linux, không phải glibc (musl), hoặc người vận hành đã đặt MALLOC_ARENA_MAX", () => {
    expect(mallocTuningEnv("win32", undefined, {})).toBeNull();
    expect(mallocTuningEnv("darwin", undefined, {})).toBeNull();
    expect(mallocTuningEnv("linux", undefined, {})).toBeNull();
    expect(mallocTuningEnv("linux", "2.36", { MALLOC_ARENA_MAX: "4" })).toBeNull();
  });
  it("giữ MALLOC_MMAP_THRESHOLD_ do người vận hành đặt", () => {
    expect(mallocTuningEnv("linux", "2.36", { MALLOC_MMAP_THRESHOLD_: "65536" })).toEqual({ MALLOC_ARENA_MAX: "2", MALLOC_MMAP_THRESHOLD_: "65536" });
  });
});
