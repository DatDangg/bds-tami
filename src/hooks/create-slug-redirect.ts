import type { PostgresAdapter } from "@payloadcms/db-postgres";
import type { CollectionAfterChangeHook, PayloadRequest } from "payload";

import { type Locale, locales } from "../i18n/routing";
import { type ContentRoute } from "../lib/content/content-paths";
import { ADVISORY_LOCK_KEYS } from "../lib/db/advisory-lock-keys";
import { publicDetailPath } from "../lib/content/redirect-paths";
import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";
import type { ContentDoc } from "./content-doc";
import { isPubliclyVisible } from "./revalidate-content";

type LocalizedSlugDoc = ContentDoc & { hasEnglish?: unknown };

/** Slug của một ngôn ngữ: bản đọc theo locale của request chỉ có slug của locale đó; bản `locale: "all"` có object theo ngôn ngữ. */
function slugAt(doc: LocalizedSlugDoc | undefined, locale: Locale, req: PayloadRequest): string | undefined {
  const value = doc?.slug;
  const slug = typeof value === "string" ? (req.locale === locale ? value : undefined) : (value as Record<string, unknown> | null | undefined)?.[locale];
  return typeof slug === "string" && slug !== "" ? slug : undefined;
}

/** Khoá advisory theo transaction (tự nhả khi commit/rollback) tuần tự hoá việc ghi redirect: hai lần lưu đồng thời không đua nhau tạo cùng `from` (unique violation sẽ huỷ cả transaction lưu nội dung). */
const REDIRECT_WRITE_LOCK_KEY = ADVISORY_LOCK_KEYS.slugRedirectWrite;

async function lockRedirectWrites(req: PayloadRequest): Promise<void> {
  const transactionId = await req.transactionID;
  if (!transactionId) return;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const session = adapter.sessions[String(transactionId)];
  if (!session) return;
  await adapter.execute({ db: session.db, raw: `SELECT pg_advisory_xact_lock(${REDIRECT_WRITE_LOCK_KEY})` });
}

async function pointRedirect(req: PayloadRequest, from: string, to: string): Promise<void> {
  const { payload } = req;
  const base = { collection: "redirects", depth: 0, pagination: false, overrideAccess: true, req } as const;
  await lockRedirectWrites(req);

  // Không tạo chuỗi: mọi redirect đang trỏ tới `from` (A → from) chuyển thẳng tới `to` (A → to). Nếu A chính là `to` (đổi slug
  // quay về slug cũ) thì xoá, vì giữ lại sẽ thành vòng.
  const inbound = await payload.find({ ...base, where: { to: { equals: from } } });
  for (const redirect of inbound.docs) {
    if (redirect.from === to) await payload.delete({ ...base, id: redirect.id });
    else await payload.update({ ...base, id: redirect.id, data: { to } });
  }

  const existing = await payload.find({ ...base, where: { from: { equals: from } }, limit: 1 });
  const current = existing.docs[0];
  if (current) await payload.update({ ...base, id: current.id, data: { to, type: "301" } });
  else await payload.create({ ...base, data: { from, to, type: "301" } });
}

/**
 * Hook `afterChange` (BR-05, FR-PUB-15): slug của bản ghi ĐÃ xuất bản đổi thì tạo redirect 301 `URL cũ → URL mới` cho đúng ngôn
 * ngữ (vi: `/tin-tuc/cu` → `/tin-tuc/moi`; en: `/en/news/old` → `/en/news/new`). Bản nháp đổi slug không tạo (chưa có URL công khai);
 * ngôn ngữ en chỉ tạo khi bản cũ đã có bản EN (`hasEnglish`), vì trước đó `/en/...` là 404. Dùng `afterChange` thay vì
 * `beforeChange` để thấy slug cuối cùng (field hook có thể chỉnh slug sau hook cấp collection) và chung transaction với lần lưu.
 *
 * Ngoài ra khi bản ghi đang công khai, xoá redirect có `from` trùng URL hiện tại của nó: proxy chạy TRƯỚC trang nên redirect
 * cũ sẽ che trang thật (slug cũ được dùng lại cho bài mới, hoặc đổi slug quay lại).
 */
export function createSlugRedirect(options: { route: ContentRoute; publicStatuses: readonly string[] }): CollectionAfterChangeHook {
  const { route, publicStatuses } = options;
  return async ({ doc, previousDoc, operation, req }) => {
    const visibleNow = isPubliclyVisible(doc, publicStatuses);
    const visibleBefore = operation === "update" && isPubliclyVisible(previousDoc, publicStatuses);
    if (!visibleNow && !visibleBefore) return doc;

    await preserveRequestLocale(req, async () => {
      for (const locale of locales) {
        const slug = slugAt(doc, locale, req);
        const previousSlug = slugAt(previousDoc, locale, req);
        const hadPage = locale === "vi" || previousDoc?.hasEnglish === true;
        const slugChanged = slug !== undefined && previousSlug !== undefined && slug !== previousSlug;

        if (visibleNow && slug) {
          await req.payload.delete({
            collection: "redirects",
            where: { from: { equals: publicDetailPath(route, locale, slug) } },
            overrideAccess: true,
            req,
          });
        }
        if (visibleBefore && !doc.deletedAt && slugChanged && hadPage) {
          await pointRedirect(req, publicDetailPath(route, locale, previousSlug), publicDetailPath(route, locale, slug));
        }
      }
    });
    return doc;
  };
}
