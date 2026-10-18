import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { createXlsxStream, needsQuotePrefix } from "./xlsx-stream";

async function collect(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const all = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  return all;
}

async function* generate(rows: (string | number | null)[][]) {
  for (const row of rows) yield row;
}

/** Đọc lại sheet1: mảng dòng, mỗi dòng là mảng text ô (ô rỗng = ""). */
function readSheet(bytes: Uint8Array): string[][] {
  const sheet = strFromU8(unzipSync(bytes)["xl/worksheets/sheet1.xml"]!);
  return [...sheet.matchAll(/<row>(.*?)<\/row>/g)].map(([, cells]) =>
    [...cells!.matchAll(/<c[^>]*?(?:\/>|>(.*?)<\/c>)/g)].map(([, inner]) =>
      (inner ?? "").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
    ),
  );
}

describe("needsQuotePrefix", () => {
  it.each(["=SUM(A1)", "+84901234567", "-1+1", "@cmd", "\tabc", "\rabc", "\nabc"])("%j cần quotePrefix", (value) => {
    expect(needsQuotePrefix(value)).toBe(true);
  });
  it.each(["Nguyễn Văn A", "0901234567", "a=b", " =x", "", "Đã ẩn danh"])("%j không cần", (value) => {
    expect(needsQuotePrefix(value)).toBe(false);
  });
});

describe("createXlsxStream", () => {
  it("file hợp lệ: đủ phần OOXML, tiêu đề + đúng số dòng, giữ số 0 đầu, escape XML/công thức", async () => {
    const bytes = await collect(
      createXlsxStream(["Mã", "Họ tên"], generate([["L1", '=HYPERLINK("x")'], ["L2", "A & B <script>"], ["09001", null]])),
    );
    expect(Object.keys(unzipSync(bytes)).sort()).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/workbook.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    const rows = readSheet(bytes);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual(["Mã", "Họ tên"]);
    expect(rows[1]).toEqual(["L1", '=HYPERLINK("x")']);
    expect(rows[2]).toEqual(["L2", "A & B <script>"]);
    expect(rows[3]).toEqual(["09001", ""]);
    const sheet = strFromU8(unzipSync(bytes)["xl/worksheets/sheet1.xml"]!);
    expect(sheet).not.toContain("<f>");
    expect(sheet).not.toContain("<script>");
  });

  it("ô bắt đầu bằng ký tự công thức dùng style quotePrefix, không nối dấu nháy vào nội dung (SĐT +84 giữ nguyên)", async () => {
    const bytes = await collect(createXlsxStream(["a"], generate([["+84901234567"], ["0901234567"]])));
    const files = unzipSync(bytes);
    const sheet = strFromU8(files["xl/worksheets/sheet1.xml"]!);
    expect(sheet).toContain('<c s="2" t="inlineStr"><is><t xml:space="preserve">+84901234567</t>');
    expect(sheet).toContain('<c t="inlineStr"><is><t xml:space="preserve">0901234567</t>');
    expect(sheet).not.toContain("'+84");
    const styles = strFromU8(files["xl/styles.xml"]!);
    expect(styles).toContain('<cellXfs count="3">');
    expect(styles).toContain('quotePrefix="1"/></cellXfs>');
  });

  it("cắt ô dài trước khi escape: không chẻ entity, không chẻ cặp surrogate", async () => {
    const ampersands = "&".repeat(40_000);
    const emoji = `${"a".repeat(32_766)}😀tail`;
    const bytes = await collect(createXlsxStream(["a"], generate([[ampersands], [emoji]])));
    const sheet = strFromU8(unzipSync(bytes)["xl/worksheets/sheet1.xml"]!);
    expect(sheet).not.toMatch(/&(?!amp;|lt;|gt;)/);
    const rows = readSheet(bytes);
    expect(rows[1]![0]).toBe("&".repeat(32_767));
    expect(rows[2]![0]).toBe("a".repeat(32_766));
  });

  it("bỏ ký tự điều khiển, cắt ô quá dài, stream nhiều dòng", async () => {
    const many = Array.from({ length: 2000 }, (_, index) => [`L${index}`, "x\u0001y"]);
    many.push(["long", "a".repeat(40_000)]);
    const rows = readSheet(await collect(createXlsxStream(["a", "b"], generate(many))));
    expect(rows).toHaveLength(2002);
    expect(rows[1]![1]).toBe("xy");
    expect(rows.at(-1)![1]).toHaveLength(32_767);
  });

  it("nguồn dòng lỗi: stream báo lỗi, không đóng như thành công", async () => {
    async function* broken() {
      yield ["ok"];
      throw new Error("db down");
    }
    await expect(collect(createXlsxStream(["a"], broken()))).rejects.toThrow("db down");
  });

  it("huỷ stream thì ngừng đọc nguồn dòng", async () => {
    let started = false;
    let closed = false;
    async function* source() {
      started = true;
      try {
        // Như nguồn DB thật: mỗi dòng cách một lượt I/O, nên huỷ stream có cơ hội chen vào.
        for (let index = 0; ; index += 1) {
          await new Promise((resolve) => setImmediate(resolve));
          yield [`r${index}`.repeat(2000)];
        }
      } finally {
        closed = true;
      }
    }
    const reader = createXlsxStream(["a"], source()).getReader();
    // Đọc tới khi nguồn dòng đã chạy (vài chunk đầu là phần khung của file, chưa đụng tới nguồn).
    while (!started) await reader.read();
    await reader.cancel();
    expect(closed).toBe(true);
  });
});
