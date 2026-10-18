import { type PostgresAdapter, sql } from "@payloadcms/db-postgres";
import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from "payload";

import { defaultLocale, type Locale, locales } from "../../i18n/routing";
import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { relationId } from "../../lib/payload/relation-id";
import { normalizeSearchText } from "../../lib/search/normalize";

/** Phần dữ liệu của tin cho thuê mà `searchText` đọc (ERD §6). Quan hệ có thể là id hoặc bản ghi đã populate. */
interface RentalSearchSource {
  code?: unknown;
  title?: unknown;
  address?: unknown;
  province?: unknown;
  ward?: unknown;
  project?: unknown;
}

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * Chuỗi tìm kiếm không dấu (ERD §6): mã + tiêu đề + địa chỉ + phường + tỉnh + tên cũ của phường + tên dự án. Phần rỗng bị bỏ.
 * Dùng chung `normalizeSearchText` với từ khoá người dùng nhập để hai phía luôn khớp.
 */
export function composeSearchText(parts: ReadonlyArray<string | null | undefined>): string {
  return normalizeSearchText(parts.filter((part): part is string => Boolean(part)).join(" "));
}

async function readName(req: PayloadRequest, collection: "provinces" | "projects", id: string, locale: Locale): Promise<string> {
  const doc = await preserveRequestLocale(req, () =>
    req.payload.findByID({
      collection,
      id,
      locale,
      fallbackLocale: false,
      depth: 0,
      trash: true,
      select: collection === "provinces" ? { name: true } : { title: true },
      overrideAccess: true,
      disableErrors: true,
      req,
    }),
  );
  if (!doc) return "";
  return asText("name" in doc ? doc.name : (doc as { title?: unknown }).title);
}

/** Tên phường + `legacyNames[].name` (mảng `{ name }`, ERD §4.2: "<phường cũ>, <quận/huyện cũ>"). */
async function readWardNames(req: PayloadRequest, id: string): Promise<string[]> {
  const ward = await req.payload.findByID({
    collection: "wards",
    id,
    depth: 0,
    select: { name: true, legacyNames: true },
    overrideAccess: true,
    disableErrors: true,
    req,
  });
  if (!ward) return [];
  return [ward.name, ...(ward.legacyNames ?? []).map((legacy) => asText(legacy.name))];
}

/** Dựng `searchText` của MỘT ngôn ngữ từ nguồn đã gộp (tiêu đề của ngôn ngữ đó, còn lại dùng chung). Tên dự án thiếu bản `locale` thì lấy bản `vi`. */
export async function buildForLocale(req: PayloadRequest, source: RentalSearchSource, locale: Locale): Promise<string> {
  const provinceId = relationId(source.province);
  const wardId = relationId(source.ward);
  const projectId = relationId(source.project);
  const projectName = projectId
    ? ((await readName(req, "projects", projectId, locale)) || (locale === defaultLocale ? "" : await readName(req, "projects", projectId, defaultLocale)))
    : "";
  return composeSearchText([
    asText(source.code),
    asText(source.title),
    asText(source.address),
    ...(wardId ? await readWardNames(req, wardId) : []),
    provinceId ? await readName(req, "provinces", provinceId, locale) : "",
    projectName,
  ]);
}

/**
 * `beforeChange` (ERD §6): ghi `searchText` của ngôn ngữ đang lưu. `data` của lần sửa một phần có thể thiếu trường nguồn nên
 * lấy giá trị đã lưu (`originalDoc`, cùng ngôn ngữ) cho phần thiếu. Chạy sau `assignRentalCode` nên `data.code` đã có khi tạo.
 */
export const buildRentalSearchText: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const stored = (originalDoc ?? {}) as RentalSearchSource;
  const incoming = data as RentalSearchSource;
  const pick = (key: keyof RentalSearchSource) => (incoming[key] !== undefined ? incoming[key] : stored[key]);
  const source: RentalSearchSource = {
    code: pick("code"),
    title: pick("title"),
    address: pick("address"),
    province: pick("province"),
    ward: pick("ward"),
    project: pick("project"),
  };
  return { ...data, searchText: await buildForLocale(req, source, req.locale as Locale) };
};

/**
 * Ghi `searchText` đã dựng vào `rentals_locales` và dòng phiên bản mới nhất (`created_at` lớn nhất) của `_rentals_v_locales`, trong transaction của `req`
 * (nếu có). UPDATE tham số hoá, không qua `payload.update` (tránh audit, revalidate, redirect, tạo phiên bản). Dùng chung với lệnh/hook reindex.
 */
export async function writeStoredSearchText(req: PayloadRequest, rentalId: string, locale: Locale, searchText: string): Promise<void> {
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const transactionId = await req.transactionID;
  const session = transactionId ? adapter.sessions[String(transactionId)] : undefined;
  const db = session?.db ?? adapter.drizzle;
  await adapter.execute({
    db,
    sql: sql`UPDATE "rentals_locales" SET "search_text" = ${searchText} WHERE "_parent_id" = ${rentalId} AND "_locale" = ${locale}`,
  });
  // Bản phiên bản mới nhất cũng cần khớp, để khôi phục phiên bản không đưa lại chuỗi cũ.
  await adapter.execute({
    db,
    sql: sql`UPDATE "_rentals_v_locales" SET "version_search_text" = ${searchText} WHERE "_locale" = ${locale} AND "_parent_id" = (SELECT "id" FROM "_rentals_v" WHERE "parent_id" = ${rentalId} ORDER BY "created_at" DESC, "id" DESC LIMIT 1)`,
  });
}

/** `true` nếu đổi một trong các trường không phụ thuộc ngôn ngữ mà `searchText` của MỌI ngôn ngữ đọc (địa chỉ, tỉnh, phường, dự án). */
const sharedSourceChanged = (before: RentalSearchSource, after: RentalSearchSource): boolean =>
  asText(before.address) !== asText(after.address) ||
  relationId(before.province) !== relationId(after.province) ||
  relationId(before.ward) !== relationId(after.ward) ||
  relationId(before.project) !== relationId(after.project);

/**
 * `afterChange`: lần lưu chỉ ghi ngôn ngữ của request, nên khi đổi phường/tỉnh/dự án/địa chỉ (dùng chung hai bản) `searchText`
 * của ngôn ngữ còn lại sẽ lệch. Dựng lại bản đó (chỉ khi nó đã có tiêu đề) bằng UPDATE trực tiếp trên `rentals_locales` và dòng phiên bản mới nhất (`created_at` lớn nhất) `_rentals_v_locales`,
 * cùng transaction, thay vì `payload.update` lồng nhau (kéo theo audit, revalidate, redirect, phiên bản).
 * Đổi tên dự án/tên cũ của phường làm mới tin đã có ở hook của `projects`/`wards` và lệnh `reindex:rentals-search` (xem `reindex-rental-search-text.ts`).
 */
export const refreshOtherLocaleSearchText: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || !sharedSourceChanged(previousDoc as RentalSearchSource, doc as RentalSearchSource)) return doc;
  for (const locale of locales.filter((candidate) => candidate !== req.locale)) {
    const title = await preserveRequestLocale(req, async () => {
      const other = await req.payload.findByID({
        collection: "rentals",
        id: doc.id,
        locale,
        fallbackLocale: false,
        depth: 0,
        trash: true,
        select: { title: true },
        overrideAccess: true,
        req,
      });
      return other.title;
    });
    if (!title) continue;
    const searchText = await buildForLocale(req, { ...(doc as RentalSearchSource), title }, locale);
    await writeStoredSearchText(req, String(doc.id), locale, searchText);
  }
  return doc;
};
