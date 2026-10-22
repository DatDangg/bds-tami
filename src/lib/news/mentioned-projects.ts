import type { Payload } from "payload";

import { NEWS_BLOCK_SLUGS } from "../../blocks/news";
import type { Locale } from "../../i18n/routing";
import { relationId } from "../payload/relation-id";
import { findPublicProjectCardsByIds } from "../projects/project-queries";
import { type ProjectCardData, toProjectCardData } from "../projects/project-view";

/** Trần số dự án nhắc đến tải cho một bài (dữ liệu bẩn không làm truy vấn phình). */
const MAX_MENTIONED_PROJECTS = 20;
const MAX_DEPTH = 20;
/** Id dự án là UUID (`idType: "uuid"`): id sai dạng trong JSON bài không được đưa vào truy vấn (Postgres báo lỗi kiểu → trang 500). */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function collectIds(node: unknown, ids: Set<string>, depth: number): void {
  if (depth > MAX_DEPTH || typeof node !== "object" || node === null) return;
  const { type, fields, children } = node as { type?: unknown; fields?: { blockType?: unknown; project?: unknown } | null; children?: unknown };
  if (type === "block" && fields?.blockType === NEWS_BLOCK_SLUGS.projectMention) {
    const id = relationId(fields.project);
    if (id && UUID_PATTERN.test(id) && ids.size < MAX_MENTIONED_PROJECTS) ids.add(id);
  }
  if (Array.isArray(children)) for (const child of children) collectIds(child, ids, depth + 1);
}

/** Id dự án của các khối "Dự án nhắc đến" trong richText (theo thứ tự, không trùng, ≤ 20). */
export function mentionedProjectIds(content: unknown): string[] {
  const ids = new Set<string>();
  collectIds((content as { root?: unknown } | null | undefined)?.root, ids, 0);
  return [...ids];
}

/**
 * Thẻ dự án cho khối "Dự án nhắc đến" (BL-054) của một bài, theo id. Luôn tải qua truy vấn công khai theo `locale` (không tin dữ liệu
 * populate trong bài): dự án chưa xuất bản, đã xoá, hoặc chưa có bản EN ở `/en` không có trong map → `RichText` ẩn khối đó.
 */
export async function loadMentionedProjects(payload: Payload, locale: Locale, content: unknown): Promise<Map<string, ProjectCardData>> {
  const ids = mentionedProjectIds(content);
  if (ids.length === 0) return new Map();
  const docs = await findPublicProjectCardsByIds(payload, locale, ids);
  const cards = new Map<string, ProjectCardData>();
  for (const [id, doc] of docs) {
    const card = toProjectCardData(doc, locale);
    if (card) cards.set(id, card);
  }
  return cards;
}
