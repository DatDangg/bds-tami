import { commitTransaction, initTransaction, killTransaction, ValidationError } from "payload";

import { TRANSLATION_JOB_CONTEXT_KEY } from "../hooks/translation/translation-targets";
import { preserveRequestLocale } from "../lib/payload/preserve-request-locale";
import { buildEnglishWrite, type TranslatableLeaf } from "../lib/translation/leaves";
import { type Context, type Doc, readDoc } from "./translate-content-context";

/** Ghi bản `en` + nhóm `translation` bằng MỘT lần `update` (cờ context: hook enqueue/nhận diện sửa tay bỏ qua). Trả bản `en` đã lưu. */
async function saveEnglish(ctx: Context, data: Doc, translation: Doc): Promise<Doc> {
  const { payload } = ctx.req;
  // `req` chung để lần ghi nằm trong transaction của `saveTranslatedLeaves`.
  const common = { locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true, req: ctx.req, context: { [TRANSLATION_JOB_CONTEXT_KEY]: true } } as const;
  if (ctx.target.kind === "global") {
    return (await payload.updateGlobal({ slug: ctx.target.slug as never, data: { ...data, translation } as never, ...common })) as unknown as Doc;
  }
  const update = (extra: Doc) =>
    payload.update({ collection: ctx.target.slug as never, id: ctx.input.docId!, data: { ...data, translation, ...extra } as never, ...common }) as unknown as Promise<Doc>;
  // `pages`: dịch xong chờ admin duyệt, KHÔNG tự bật `hasEnglish` (BR-08). Còn lại bật khi đủ trường EN bắt buộc: hook `requireEnglishFields` là nguồn sự thật
  // của "đủ", nên thử bật rồi lùi về không bật nếu hook từ chối (bản `en` vẫn được lưu, chỉ chưa hiển thị).
  if (ctx.target.slug === "pages") return update({});
  try {
    return await update({ hasEnglish: true });
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    payload.logger.warn({ slug: ctx.target.slug }, "Dịch: chưa đủ trường EN bắt buộc, lưu bản dịch nhưng chưa bật hasEnglish");
    return update({});
  }
}

export interface TranslatedLeaf {
  leaf: TranslatableLeaf;
  value: unknown;
}

/**
 * Ghi các lá đã dịch vào bản `en` mà KHÔNG làm mất thay đổi của admin xảy ra trong lúc gọi API (có thể hàng chục giây).
 * Array/group không localized (hàng footer, link, ảnh, `seo`...) dùng chung cho hai ngôn ngữ và Payload buộc ghi cả array khi sửa một lá bên trong, nên:
 *  1. đọc LẠI bản ghi trong transaction ngay trước khi ghi, và `updatedAt` phải còn bằng giá trị lúc job bắt đầu đọc bản `vi` (`sourceUpdatedAt`);
 *     đã đổi (admin lưu vi hoặc en) → bỏ lần ghi, trả `null` (bên gọi xếp lại job);
 *  2. dựng dữ liệu ghi từ chính bản vừa đọc đó (không từ bản đọc trước khi gọi API).
 * Còn một khe hở cỡ mili-giây giữa lần đọc lại và `update` (không khoá dòng): một lần lưu chen đúng khe này vẫn được job kế tiếp dịch lại chữ,
 * nhưng phần không phải chữ của nó có thể bị ghi đè; chấp nhận để không phải viết SQL khoá dòng riêng cho từng loại bảng/global.
 */
export async function saveTranslatedLeaves(ctx: Context, args: { sourceUpdatedAt: unknown; translated: TranslatedLeaf[]; translation: Doc }): Promise<Doc | null> {
  const { req } = ctx;
  const ownsTransaction = await initTransaction(req);
  try {
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
