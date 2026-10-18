import { strToU8, Zip, ZipDeflate } from "fflate";

/** Ô tối đa của Excel; dài hơn bị cắt để file không bị coi là hỏng. */
const MAX_CELL_CHARS = 32_767;
/** Ký tự điều khiển (trừ tab, xuống dòng) và U+FFFE/U+FFFF không hợp lệ trong XML 1.0: Excel báo file hỏng nếu có. */
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
/** Ô mở đầu bằng ký tự này có thể bị Excel/Sheets diễn giải thành công thức khi người dùng sửa ô hoặc dán sang CSV. */
const FORMULA_TRIGGER = /^[=+\-@\t\r\n]/;

export type CellValue = string | number | null | undefined;

/**
 * Chống CSV/formula injection (OWASP): ô văn bản bắt đầu bằng `=`, `+`, `-`, `@`, tab, CR, LF dùng kiểu ô `quotePrefix`
 * (như khi gõ `'` ở đầu ô trong Excel: văn bản thuần, không hiện dấu nháy, SĐT `+84…` giữ nguyên). Dữ liệu khách tự nhập
 * (họ tên, lời nhắn) không bao giờ được tin.
 */
export function needsQuotePrefix(value: string): boolean {
  return FORMULA_TRIGGER.test(value);
}

/** Cắt theo ký tự Unicode (không chẻ đôi cặp surrogate của emoji). Excel đếm UTF-16 nên tính theo code unit, lùi 1 nếu rơi giữa cặp. */
function truncateCodePoints(text: string, maxUnits: number): string {
  if (text.length <= maxUnits) return text;
  const lastKept = text.charCodeAt(maxUnits - 1);
  const cut = lastKept >= 0xd800 && lastKept <= 0xdbff ? maxUnits - 1 : maxUnits;
  return text.slice(0, cut);
}

function escapeXml(text: string): string {
  return text.replace(INVALID_XML_CHARS, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cellXml(value: CellValue, styleId?: number): string {
  if (value === null || value === undefined || value === "") return "<c/>";
  if (typeof value === "number") {
    const numberStyle = styleId === undefined ? "" : ` s="${styleId}"`;
    return Number.isFinite(value) ? `<c${numberStyle}><v>${value}</v></c>` : "<c/>";
  }
  const effectiveStyle = styleId ?? (needsQuotePrefix(value) ? QUOTE_PREFIX_STYLE_ID : undefined);
  const style = effectiveStyle === undefined ? "" : ` s="${effectiveStyle}"`;
  // Cắt TRƯỚC khi escape: cắt sau có thể chẻ đôi `&amp;` thành XML hỏng và tính giới hạn trên chuỗi đã phình ra.
  const text = escapeXml(truncateCodePoints(value, MAX_CELL_CHARS));
  return `<c${style} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

const rowXml = (cells: readonly CellValue[], styleId?: number) => `<row>${cells.map((cell) => cellXml(cell, styleId)).join("")}</row>`;

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const PACKAGE_FILES: Record<string, string> = {
  "[Content_Types].xml": `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  "_rels/.rels": `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  "xl/workbook.xml": `${XML_HEADER}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Leads" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  "xl/_rels/workbook.xml.rels": `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  // Kiểu 0 = mặc định, 1 = chữ đậm (dòng tiêu đề), 2 = quotePrefix (ô bắt đầu bằng ký tự công thức).
  "xl/styles.xml": `${XML_HEADER}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" quotePrefix="1"/></cellXfs></styleSheet>`,
};
const HEADER_STYLE_ID = 1;
const QUOTE_PREFIX_STYLE_ID = 2;
const SHEET_OPEN = `${XML_HEADER}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>`;
const SHEET_CLOSE = "</sheetData></worksheet>";

/**
 * File `.xlsx` (OOXML) một sheet, sinh dần: mỗi lần client kéo (pull) mới đọc thêm dòng từ `rows`, nén và đẩy ra, nên bộ nhớ
 * không phụ thuộc số dòng. Mọi ô là chuỗi/số inline (không có công thức), ô văn bản bắt đầu bằng ký tự công thức dùng style `quotePrefix` (`needsQuotePrefix`).
 * Huỷ stream (client ngắt) thì dừng đọc `rows`.
 */
export function createXlsxStream(header: readonly string[], rows: AsyncIterable<readonly CellValue[]>): ReadableStream<Uint8Array> {
  const queue: Uint8Array[] = [];
  let zipError: Error | undefined;
  let zipFinished = false;
  const zip = new Zip((error, chunk, final) => {
    if (error) zipError = error;
    else queue.push(chunk);
    if (final) zipFinished = true;
  });
  for (const [name, content] of Object.entries(PACKAGE_FILES)) {
    const file = new ZipDeflate(name, { level: 6 });
    zip.add(file);
    file.push(strToU8(content), true);
  }
  const sheet = new ZipDeflate("xl/worksheets/sheet1.xml", { level: 6 });
  zip.add(sheet);
  sheet.push(strToU8(SHEET_OPEN + rowXml(header, HEADER_STYLE_ID)));

  const iterator = rows[Symbol.asyncIterator]();
  let rowsDone = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        // ZipDeflate gom dữ liệu rồi mới phát; lặp tới khi có byte để đẩy hoặc zip đã đóng.
        while (queue.length === 0 && !zipFinished && !rowsDone) {
          if (zipError) throw zipError;
          const next = await iterator.next();
          if (next.done) {
            rowsDone = true;
            sheet.push(strToU8(SHEET_CLOSE), true);
            zip.end();
          } else {
            sheet.push(strToU8(rowXml(next.value)));
          }
        }
        if (zipError) throw zipError;
        const chunk = queue.shift();
        if (chunk) controller.enqueue(chunk);
        if (queue.length === 0 && zipFinished) controller.close();
      } catch (error) {
        controller.error(error);
        await iterator.return?.();
      }
    },
    async cancel() {
      zip.terminate();
      await iterator.return?.();
    },
  });
}
