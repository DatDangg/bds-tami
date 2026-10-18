import { type PostgresAdapter, sql } from "@payloadcms/db-postgres";
import { commitTransaction, initTransaction, killTransaction } from "payload";

import { missingEnglishFields } from "../hooks/require-english-fields";
import { TRANSLATION_JOB_CONTEXT_KEY } from "../hooks/translation/translation-targets";
import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";
import { buildEnglishWrite, type TranslatableLeaf } from "../lib/translation/leaves";
import { type Context, type Doc, readDoc } from "./translate-content-context";

/**
 * Ghi bản `en` + nhóm `translation` (cờ context: hook enqueue/nhận diện sửa tay bỏ qua). Một lần `update`; thêm lần thứ hai chỉ để bật `hasEnglish` khi bản `en` đã lưu
 * đủ trường bắt buộc (slug `en` do hook sinh trong lần đầu nên chưa thể quyết định trước khi ghi). Trả bản `en` đã lưu.
 */
async function saveEnglish(ctx: Context, data: Doc, translation: Doc): Promise<Doc> {
  const { payload } = ctx.req;
  // `req` chung để lần ghi nằm trong transaction của `saveTranslatedLeaves`.
  const common = { locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true, req: ctx.req, context: { [TRANSLATION_JOB_CONTEXT_KEY]: true } } as const;
  if (ctx.target.kind === "global") {
    return (await payload.updateGlobal({ slug: ctx.target.slug as never, data: { ...data, translation } as never, ...common })) as unknown as Doc;
  }
  const update = (extra: Doc) =>
    payload.update({ collection: ctx.target.slug as never, id: ctx.input.docId!, data: { ...data, translation, ...extra } as never, ...common }) as unknown as Promise<Doc>;
  // `pages` (BR-08): bản AI luôn chờ admin duyệt. Đặt `hasEnglish = false` cả khi trang đã duyệt trước đó (dịch lại / tự dịch khi sửa bản Việt): ẩn `/en` tới khi
  // admin duyệt lại (hook `approveEnglish` ghi audit khi false -> true).
  if (ctx.target.slug === "pages") return update({ hasEnglish: false });
  // Ghi bản dịch trước (hook sinh slug `en` ở bước này), rồi chỉ bật `hasEnglish` nếu bản `en` ĐÃ LƯU đủ trường bắt buộc, theo cùng vị từ với hook
  // `requireEnglishFields`. Không "thử bật rồi bắt lỗi": hook từ chối làm Payload rollback và gỡ `transactionID` khỏi `req`, nên lần ghi dự phòng sẽ chạy
  // ngoài transaction (mất khoá dòng và tính nguyên tử của lần ghi).
  const saved = await update({});
  if (saved.hasEnglish === true) return saved;
  if (missingEnglishFields(requiredEnglishFields(ctx), saved).length > 0) {
    payload.logger.warn({ slug: ctx.target.slug }, "Dịch: chưa đủ trường EN bắt buộc, lưu bản dịch nhưng chưa bật hasEnglish");
    return saved;
  }
  return (await payload.update({ collection: ctx.target.slug as never, id: ctx.input.docId!, data: { hasEnglish: true } as never, ...common })) as unknown as Doc;
}

/** Trường EN bắt buộc để bật `hasEnglish` của collection (`withContentDefaults` ghi vào `custom.englishRequiredFields`). */
function requiredEnglishFields(ctx: Context): readonly string[] {
  const config = ctx.req.payload.collections[ctx.target.slug as keyof typeof ctx.req.payload.collections]?.config;
  const required = (config?.custom as { englishRequiredFields?: readonly string[] } | undefined)?.englishRequiredFields;
  return required ?? ["title", "slug"];
}

export interface TranslatedLeaf {
  leaf: TranslatableLeaf;
  value: unknown;
}

/**
 * Khoá dòng chính (`SELECT ... FOR UPDATE`) của bản ghi/global trên kết nối của transaction hiện tại, TRƯỚC khi đọc lại: lần lưu của admin chen vào sau đó
 * phải chờ job commit (rồi mới ghi, trên dữ liệu đã có bản dịch), nên không còn khe hở giữa "đọc lại" và `update`. Tên bảng suy từ slug trong allowlist (đã
 * qua `resolveTarget`) và kiểm tra có trong schema Drizzle; truyền qua `sql.identifier`, id là tham số.
 */
async function lockRow(ctx: Context): Promise<void> {
  const { req, target } = ctx;
  const transactionId = await req.transactionID;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const session = transactionId ? adapter.sessions[String(transactionId)] : undefined;
  if (!session) throw new Error("Cần transaction đang mở để khoá dòng khi ghi bản dịch");
  const table = target.slug.replace(/-/g, "_");
  if (!adapter.tables[table]) throw new Error(`Không tìm thấy bảng "${table}" để khoá`);
  const where = target.kind === "collection" ? sql` WHERE "id" = ${ctx.input.docId}` : sql``;
  await adapter.execute({ db: session.db, sql: sql`SELECT 1 FROM ${sql.identifier(table)}${where} FOR UPDATE` });
}

/**
 * Ghi các lá đã dịch vào bản `en` mà KHÔNG làm mất thay đổi của admin xảy ra trong lúc gọi API (có thể hàng chục giây).
 * Array/group không localized (hàng footer, link, ảnh, `seo`...) dùng chung cho hai ngôn ngữ và Payload buộc ghi cả array khi sửa một lá bên trong, nên:
 *  1. đọc LẠI bản ghi trong transaction ngay trước khi ghi, và `updatedAt` phải còn bằng giá trị lúc job bắt đầu đọc bản `vi` (`sourceUpdatedAt`);
 *     đã đổi (admin lưu vi hoặc en) → bỏ lần ghi, trả `null` (bên gọi xếp lại job);
 *  2. dựng dữ liệu ghi từ chính bản vừa đọc đó (không từ bản đọc trước khi gọi API).
 * Dòng chính bị khoá (`lockRow`) từ trước lần đọc lại tới khi commit nên không còn khe hở: lần lưu của admin chen vào phải chờ. Nếu nó đã bắt đầu
 * trước khi job lấy được khoá, job thấy `updatedAt` đổi (hoặc, tệ nhất, mất bản dịch lần này) chứ không ghi đè dữ liệu của admin.
 */
export async function saveTranslatedLeaves(ctx: Context, args: { sourceUpdatedAt: unknown; translated: TranslatedLeaf[]; translation: Doc }): Promise<Doc | null> {
  const { req } = ctx;
  const ownsTransaction = await initTransaction(req);
  try {
    await lockRow(ctx);
    const fresh = await preserveRequestLocale(req, () => readDoc(ctx, "en", req));
    if (!fresh || fresh.updatedAt !== args.sourceUpdatedAt) return await abandon(ctx, ownsTransaction);
    const write = buildEnglishWrite(fresh, args.translated);
    if (!write) return await abandon(ctx, ownsTransaction);
    const saved = await preserveRequestLocale(req, () => saveEnglish(ctx, write, args.translation));
    if (ownsTransaction) await commitTransaction(req);
    return saved;
  } catch (error) {
    if (ownsTransaction) await killTransaction(req);
    throw error;
  }
}

async function abandon(ctx: Context, ownsTransaction: boolean): Promise<null> {
  if (ownsTransaction) await killTransaction(ctx.req);
  return null;
}
