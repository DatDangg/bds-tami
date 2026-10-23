import { extractTextNodes, type LexicalRoot } from "../../src/lib/translation/lexical";
import { readAtPath } from "../../src/lib/translation/leaves";
import { leafKey, type ResolvedEntry, sameLeafValue } from "./format";

/**
 * Quyết định thuần của "gói EN" (BL-072): không đụng DB để test được không cần Payload. Engine ghi nằm ở `pack.ts`.
 * Gói = `seed/english/packs/<tên>/` cùng định dạng `data/*.json` của BL-064, nhưng chỉ ghi bản ghi có khoá trong gói và không ghi đè EN biên tập viên đã nhập.
 */

export const PACK_CONFIRM_ENV = "ENGLISH_PACK_CONFIRM";
/** Tên gói là tên thư mục: chặn `..`, dấu `/`, khoảng trắng. */
export const PACK_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export interface PackArgs {
  pack: string | null;
  apply: boolean;
  overwrite: boolean;
  /** Tham số lạ (gõ sai `aply`…): bên gọi từ chối thay vì lặng lẽ chạy dry-run. */
  unknown: string[];
}

/** `argv` = tham số vị trí sau tên script (`payload run` nuốt cờ `--x`, nên dùng từ khoá `apply` / `overwrite`). */
export function parsePackArgs(argv: readonly string[]): PackArgs {
  const parsed: PackArgs = { pack: null, apply: false, overwrite: false, unknown: [] };
  for (const arg of argv) {
    if (arg === "apply") parsed.apply = true;
    else if (arg === "overwrite") parsed.overwrite = true;
    else if (parsed.pack === null) parsed.pack = arg;
    else parsed.unknown.push(arg);
  }
  return parsed;
}

/** Lý do KHÔNG được ghi, hoặc `null`. Dry-run không cần confirm; `apply` cần env bằng đúng tên gói. */
export function packConfirmProblem(pack: string, apply: boolean, env: Record<string, string | undefined>): string | null {
  if (!apply) return null;
  return env[PACK_CONFIRM_ENV] === pack ? null : `apply cần ${PACK_CONFIRM_ENV}=${pack} (hiện: ${env[PACK_CONFIRM_ENV] ? "khác tên gói" : "chưa đặt"})`;
}

/** `host:port/tên-db` của DATABASE_URL để người chạy thấy mình đang ghi vào đâu; không bao giờ in user/mật khẩu. */
export function describeDatabaseTarget(url: string | undefined): string {
  if (!url) return "(chưa đặt DATABASE_URL)";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return "(DATABASE_URL không đọc được)";
  }
}

export type KeyMatch = "unique" | "multiple" | "missing" | "duplicate";
/** Chỉ `categories`: cùng tên ở nhiều scope (vd "Căn hộ chung cư" cho dự án + cho thuê) là thiết kế, cùng một mục gói áp cho MỌI bản khớp (như BL-064). */
export const allowsMultipleMatches = (group: string): boolean => group === "categories";
/** Khoá gói phải khớp ĐÚNG 1 bản ghi chưa xoá mềm: 0 = thiếu, ≥ 2 = mơ hồ (không ghi bản nào) — trừ nhóm cho phép nhiều bản (`allowMultiple`) thì ≥ 2 = `multiple`. */
export const classifyKeyMatches = (count: number, allowMultiple = false): KeyMatch =>
  count === 1 ? "unique" : count === 0 ? "missing" : allowMultiple ? "multiple" : "duplicate";

/** Giá trị EN "chưa nhập": thiếu, chuỗi trắng, hoặc cây richText không có ô chữ nào có chữ. */
export function isEmptyEnglishValue(current: unknown): boolean {
  if (current === null || current === undefined) return true;
  if (typeof current === "string") return current.trim() === "";
  try {
    return extractTextNodes(current as LexicalRoot).every((text) => text.trim() === "");
  } catch {
    return false; // dạng lạ: coi là có nội dung để không ghi đè nhầm
  }
}

/** Khoá các lá mà EN hiện tại đã có chữ nhưng KHÁC dữ liệu gói. `overwrite` = không bảo vệ gì. */
export function existingEnglishConflicts(translated: ResolvedEntry["translated"], en: Record<string, unknown>, overwrite: boolean): string[] {
  if (overwrite) return [];
  return translated
    .filter(({ leaf, value }) => {
      const current = readAtPath(en, leaf.path);
      return !isEmptyEnglishValue(current) && !sameLeafValue(current, value);
    })
    .map(({ leaf }) => leafKey(leaf));
}

export type MediaAltDecision = "write" | "unchanged" | "conflict";
export function decideMediaAlt(current: string, target: string, overwrite: boolean): MediaAltDecision {
  const existing = current.trim();
  if (existing === target) return "unchanged";
  return existing === "" || overwrite ? "write" : "conflict";
}

export type PackLineStatus = "write" | "unchanged" | "skip" | "missing";
export interface PackLine {
  group: string;
  key: string;
  status: PackLineStatus;
  reason?: string;
}

/** Bỏ qua/thiếu = vấn đề cần người đọc (dry-run và apply đều exit 1). */
export const countPackProblems = (lines: readonly PackLine[]): number => lines.filter((line) => line.status === "skip" || line.status === "missing").length;

const STATUS_LABEL: Record<PackLineStatus, string> = { write: "sẽ ghi", unchanged: "không đổi", skip: "bỏ qua", missing: "thiếu bản vi" };
export const formatPackLine = (line: PackLine, apply: boolean): string => {
  const label = line.status === "write" && apply ? "đã ghi" : STATUS_LABEL[line.status];
  return `[${line.group}] ${label}: ${line.key}${line.reason ? ` — ${line.reason}` : ""}`;
};
