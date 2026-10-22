import { NEWS_BLOCK_SLUGS } from "./index";

/**
 * Trường CHỮ của từng khối chèn Tin tức (theo `blockType`): `fields` = trường chữ trực tiếp, `arrays` = trường chữ trong từng hàng của
 * trường array. Là nguồn duy nhất cho bộ dịch (`translation/lexical.ts`: chỉ các ô này được gửi đi/ghép lại) và "N phút đọc"
 * (`news/read-time.ts`). Mọi thứ khác của khối (`id`, `blockType`, `blockName`, quan hệ `project`, ảnh `image`, select `imagePosition`)
 * không phải chữ. Khối không có ở đây (vd `projectMention`, hay khối lạ) không có chữ. Test `index.test.ts` buộc khớp với cấu hình khối.
 */
export const NEWS_BLOCK_TEXT_FIELDS: Readonly<Record<string, { fields?: readonly string[]; arrays?: Readonly<Record<string, readonly string[]>> }>> = {
  [NEWS_BLOCK_SLUGS.statHighlights]: { arrays: { items: ["value", "label"] } },
  [NEWS_BLOCK_SLUGS.imageText]: { fields: ["text"] },
};

type Holder = Record<string, unknown>;
const isRecord = (value: unknown): value is Holder => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Gọi `visit(holder, key)` cho từng ô chữ (`holder[key]` là chuỗi) trong `fields` của một node `block`, theo thứ tự khai báo.
 * Giá trị không phải chuỗi (khối dở dang, dữ liệu bẩn) hoặc `fields` sai dạng thì bỏ qua, không ném lỗi.
 */
export function forEachBlockTextSlot(fields: unknown, visit: (holder: Holder, key: string) => void): void {
  if (!isRecord(fields) || typeof fields.blockType !== "string") return;
  const spec = NEWS_BLOCK_TEXT_FIELDS[fields.blockType];
  if (!spec) return;
  for (const name of spec.fields ?? []) {
    if (typeof fields[name] === "string") visit(fields, name);
  }
  for (const [arrayName, names] of Object.entries(spec.arrays ?? {})) {
    const rows = fields[arrayName];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!isRecord(row)) continue;
      for (const name of names) if (typeof row[name] === "string") visit(row, name);
    }
  }
}
