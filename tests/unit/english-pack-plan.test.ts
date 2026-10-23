import { describe, expect, it } from "vitest";

import {
  allowsMultipleMatches,
  classifyKeyMatches,
  countPackProblems,
  decideMediaAlt,
  describeDatabaseTarget,
  existingEnglishConflicts,
  formatPackLine,
  isEmptyEnglishValue,
  PACK_NAME_PATTERN,
  packConfirmProblem,
  parsePackArgs,
} from "../../seed/english/pack-plan";
import type { ResolvedEntry } from "../../seed/english/format";
import type { TranslatableLeaf } from "../../src/lib/translation/leaves";

const rich = (...texts: string[]) => ({ root: { type: "root", children: [{ type: "paragraph", children: texts.map((text) => ({ type: "text", text })) }] } });
const textLeaf = (name: string): TranslatableLeaf => ({ key: name, path: [name], kind: "text", value: "vi" });
const richLeaf = (name: string): TranslatableLeaf => ({ key: name, path: [name], kind: "richText", value: rich("vi") as never });
const translated = (...items: Array<[TranslatableLeaf, unknown]>): ResolvedEntry["translated"] => items.map(([leaf, value]) => ({ leaf, value }));

describe("parsePackArgs", () => {
  it("mặc định dry-run: chỉ tên gói", () => {
    expect(parsePackArgs(["2026-10-23-real-content"])).toEqual({ pack: "2026-10-23-real-content", apply: false, overwrite: false, unknown: [] });
  });
  it("nhận apply/overwrite ở mọi vị trí, gom tham số lạ", () => {
    expect(parsePackArgs(["apply", "gói", "overwrite", "aply"])).toEqual({ pack: "gói", apply: true, overwrite: true, unknown: ["aply"] });
  });
  it("không có tên gói → pack null", () => {
    expect(parsePackArgs(["apply"]).pack).toBeNull();
  });
});

describe("PACK_NAME_PATTERN", () => {
  it.each(["2026-10-23-real-content", "a.b_c"])("chấp nhận %s", (name) => expect(PACK_NAME_PATTERN.test(name)).toBe(true));
  it.each(["../x", "a/b", "a b", "", ".hidden"])("từ chối %j", (name) => expect(PACK_NAME_PATTERN.test(name)).toBe(false));
});

describe("packConfirmProblem", () => {
  it("dry-run không cần confirm", () => expect(packConfirmProblem("g", false, {})).toBeNull());
  it("apply thiếu confirm → từ chối", () => expect(packConfirmProblem("g", true, {})).toContain("ENGLISH_PACK_CONFIRM=g"));
  it("apply confirm sai tên → từ chối", () => expect(packConfirmProblem("g", true, { ENGLISH_PACK_CONFIRM: "khac" })).toContain("khác tên gói"));
  it("apply confirm đúng → cho phép (kể cả production)", () => expect(packConfirmProblem("g", true, { ENGLISH_PACK_CONFIRM: "g", APP_ENV: "production" })).toBeNull());
});

describe("describeDatabaseTarget", () => {
  it("che user và mật khẩu", () => {
    const text = describeDatabaseTarget("postgres://tami:S3cret@db.internal:5433/tami_prod");
    expect(text).toBe("db.internal:5433/tami_prod");
    expect(text).not.toContain("S3cret");
  });
  it("thiếu/hỏng → thông báo, không ném", () => {
    expect(describeDatabaseTarget(undefined)).toContain("chưa đặt");
    expect(describeDatabaseTarget("không phải url")).toContain("không đọc được");
  });
});

describe("classifyKeyMatches", () => {
  it("0 thiếu · 1 duy nhất · ≥2 trùng", () => {
    expect([0, 1, 2, 5].map((count) => classifyKeyMatches(count))).toEqual(["missing", "unique", "duplicate", "duplicate"]);
  });
  it("categories (nhiều scope) ≥2 bản → áp cho mọi bản; nhóm khác vẫn bỏ qua", () => {
    expect(allowsMultipleMatches("categories")).toBe(true);
    expect(["projects", "news", "developers", "media"].some(allowsMultipleMatches)).toBe(false);
    expect(classifyKeyMatches(2, allowsMultipleMatches("categories"))).toBe("multiple");
    expect(classifyKeyMatches(2, allowsMultipleMatches("projects"))).toBe("duplicate");
    expect(classifyKeyMatches(0, true)).toBe("missing");
    expect(classifyKeyMatches(1, true)).toBe("unique");
  });
});

describe("isEmptyEnglishValue", () => {
  it("rỗng: null, undefined, chuỗi trắng, richText không chữ", () => {
    expect([null, undefined, "", "  ", rich(), rich("  ")].map(isEmptyEnglishValue)).toEqual([true, true, true, true, true, true]);
  });
  it("có chữ: chuỗi, richText có ô chữ", () => {
    expect([isEmptyEnglishValue("Hi"), isEmptyEnglishValue(rich("Hi"))]).toEqual([false, false]);
  });
});

describe("existingEnglishConflicts (D4: không ghi đè EN đang có)", () => {
  const title = textLeaf("title");
  const overview = richLeaf("overview");
  const entry = translated([title, "Pack title"], [overview, rich("Pack text")]);

  it("EN trống → không xung đột", () => expect(existingEnglishConflicts(entry, {}, false)).toEqual([]));
  it("EN đã bằng gói → không xung đột (idempotent)", () => {
    expect(existingEnglishConflicts(entry, { title: "Pack title", overview: rich("Pack text") }, false)).toEqual([]);
  });
  it("EN có chữ khác gói → báo khoá, kể cả richText", () => {
    expect(existingEnglishConflicts(entry, { title: "Editor title", overview: rich("Other") }, false)).toEqual(["title", "overview"]);
  });
  it("overwrite → không bảo vệ", () => expect(existingEnglishConflicts(entry, { title: "Editor title" }, true)).toEqual([]));
});

describe("decideMediaAlt", () => {
  it("trống → ghi · bằng gói → không đổi · khác → xung đột trừ overwrite", () => {
    expect(decideMediaAlt("", "A", false)).toBe("write");
    expect(decideMediaAlt("A", "A", false)).toBe("unchanged");
    expect(decideMediaAlt("B", "A", false)).toBe("conflict");
    expect(decideMediaAlt("B", "A", true)).toBe("write");
  });
});

describe("countPackProblems / formatPackLine", () => {
  const lines = [
    { group: "projects", key: "A", status: "write" as const },
    { group: "projects", key: "B", status: "unchanged" as const },
    { group: "projects", key: "C", status: "skip" as const, reason: "khoá trùng 2 bản ghi" },
    { group: "news", key: "D", status: "missing" as const },
  ];
  it("chỉ skip + missing là vấn đề", () => expect(countPackProblems(lines)).toBe(2));
  it("dry-run ghi 'sẽ ghi', apply ghi 'đã ghi'", () => {
    expect(formatPackLine(lines[0]!, false)).toBe("[projects] sẽ ghi: A");
    expect(formatPackLine(lines[0]!, true)).toBe("[projects] đã ghi: A");
    expect(formatPackLine(lines[2]!, true)).toBe("[projects] bỏ qua: C — khoá trùng 2 bản ghi");
  });
});
