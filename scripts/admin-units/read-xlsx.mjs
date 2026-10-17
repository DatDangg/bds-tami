// Đọc tối thiểu file .xlsx (zip + XML) bằng Node thuần, đủ cho bảng chuỗi/số đơn giản: tránh thêm devDependency
// chỉ để chạy một lần `build-admin-units.mjs`. Không hỗ trợ zip64, mã hoá, công thức, ngày.
import { inflateRawSync } from "node:zlib";

function readZipEntries(buffer) {
  const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Không phải file zip/xlsx hợp lệ");
  const total = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < total; i++) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    const dataStart = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);
    entries.set(name, method === 0 ? raw : inflateRawSync(raw));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const decodeXml = (text) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&");

function readSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );
}

const columnIndex = (ref) => [...ref.replace(/\d+/g, "")].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

/** Trả về { sheetNames, rows(sheetName) -> string[][] } (ô trống = ""). */
export function openXlsx(buffer) {
  const entries = readZipEntries(buffer);
  const text = (name) => entries.get(name)?.toString("utf8");
  const shared = readSharedStrings(text("xl/sharedStrings.xml"));
  const workbook = text("xl/workbook.xml");
  const rels = text("xl/_rels/workbook.xml.rels");
  const sheets = [...workbook.matchAll(/<sheet [^>]*>/g)].map((m) => {
    const name = decodeXml(/name="([^"]*)"/.exec(m[0])[1]);
    const rid = /r:id="([^"]*)"/.exec(m[0])[1];
    const relTag = [...rels.matchAll(/<Relationship [^>]*>/g)].find((r) => r[0].includes(`Id="${rid}"`))[0];
    const target = /Target="([^"]*)"/.exec(relTag)[1].replace(/^\/?(xl\/)?/, "xl/");
    return { name, target };
  });
  return {
    sheetNames: sheets.map((s) => s.name),
    rows(sheetName) {
      const sheet = sheets.find((s) => s.name === sheetName);
      if (!sheet) throw new Error(`Không có sheet "${sheetName}"`);
      const xml = text(sheet.target);
      const rows = [];
      for (const rowMatch of xml.matchAll(/<row [^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
        const cells = [];
        for (const cell of (rowMatch[1] ?? "").matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
          const ref = /r="([A-Z]+)\d+"/.exec(cell[1])[1];
          const type = /t="([^"]*)"/.exec(cell[1])?.[1];
          const body = cell[2] ?? "";
          let value = "";
          if (type === "s") value = shared[Number(/<v>([\s\S]*?)<\/v>/.exec(body)[1])];
          else if (type === "inlineStr") value = decodeXml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""));
          else value = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
          cells[columnIndex(ref)] = value;
        }
        rows.push(Array.from(cells, (v) => v ?? ""));
      }
      return rows;
    },
  };
}
