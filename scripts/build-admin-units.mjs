// Dựng `seed/data/administrative-units.json` (34 tỉnh/thành + 3.321 phường/xã/đặc khu sau 01/07/2025 kèm tên cũ)
// từ hai nguồn đã commit trong `seed/data/`. Chạy tay khi nguồn đổi: `node scripts/build-admin-units.mjs`.
// Seed lúc chạy chỉ đọc JSON đầu ra (không parse xlsx). Script thất bại nếu số liệu không khớp bất biến bên dưới.
// Import trực tiếp `src/lib/slug.ts` và `admin-units/vietnamese-key.ts` (Node >= 22.18 tự bỏ kiểu).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { appendUniqueSuffix, slugify } from "../src/lib/slug.ts";
import { openXlsx } from "./admin-units/read-xlsx.mjs";
import { matchKey } from "./admin-units/vietnamese-key.ts";

const dataDir = new URL("../seed/data/", import.meta.url);
const XLSX_FILE = "danh-muc-phuong-xa-moi.xlsx";
const CSV_FILE = "vietnam-sap-nhap-phuong-xa.csv";
const OUTPUT_FILE = "administrative-units.json";
/** Ngày chốt số liệu nguồn (đưa vào header JSON; cố định để chạy lại cho ra file giống hệt). */
const DATA_AS_OF = "2026-10-17";

const EXPECTED = { provinces: 34, wards: 3321, phuong: 687, xa: 2621, dac_khu: 13 };

/**
 * Tên xlsx -> tên trong csv, chỉ cho các cặp CÙNG MỘT phường (cùng tỉnh) khác nhau về chính tả mà `matchKey` không
 * gộp được (khoảng trắng/gạch nối, tách từ, ỹ/ĩ). Dấu nháy cong, gạch ngang dài, vị trí dấu thanh đã do `matchKey`
 * xử lý. Mỗi mục phải được dùng đúng 1 lần.
 */
const WARD_NAME_ALIASES = {
  "Tỉnh Gia Lai": { "Xã Albá": "Xã Al Bá" },
  "Tỉnh Lâm Đồng": {
    "Phường Langbiang - Đà Lạt": "Phường Lang Biang - Đà Lạt",
    "Phường B' Lao": "Phường B'Lao",
    "Xã Đinh Văn - Lâm Hà": "Xã Đinh Văn Lâm Hà",
    "Xã Phú Sơn - Lâm Hà": "Xã Phú Sơn Lâm Hà",
    "Xã Nam Hà - Lâm Hà": "Xã Nam Hà Lâm Hà",
    "Xã Nam Ban - Lâm Hà": "Xã Nam Ban Lâm Hà",
    "Xã Tân Hà - Lâm Hà": "Xã Tân Hà Lâm Hà",
    "Xã Phúc Thọ - Lâm Hà": "Xã Phúc Thọ Lâm Hà",
  },
  "Tỉnh Vĩnh Long": { "Xã Lục Sỹ Thành": "Xã Lục Sĩ Thành" },
};

/**
 * Mã phường xlsx -> tên đã sửa, áp dụng TRƯỚC khi so khớp khoá và ghi ra JSON (tên + slug theo tên đã sửa).
 * Quyết định của user 2026-10-17: xlsx ghi sai chính tả "Phường Đào Duy Tư" (Thanh Hóa); csv ghi "Phường Đào Duy Từ"
 * (danh nhân Đào Duy Từ). Mỗi mục phải được dùng đúng 1 lần.
 */
const WARD_NAME_OVERRIDES = { "40153016": { from: "Phường Đào Duy Tư", to: "Phường Đào Duy Từ" } };

/** Tên ngắn không suy ra được bằng cách bỏ tiền tố "Tỉnh"/"Thành phố". */
const PROVINCE_SHORT_NAME_OVERRIDES = { "Thành phố Hồ Chí Minh": "TP.HCM" };

const WARD_TYPES = [
  ["Phường ", "phuong"],
  ["Xã ", "xa"],
  ["Đặc khu ", "dac_khu"],
];

function fail(message) {
  throw new Error(`build-admin-units: ${message}`);
}

const clean = (text) => text.normalize("NFC").replace(/\s+/g, " ").trim();
const normalizeProvinceName = (name) => clean(name).replace(/^Tp\.? /i, "Thành phố ");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell !== ""));
}

function readXlsxUnits() {
  const book = openXlsx(readFileSync(new URL(XLSX_FILE, dataDir)));
  const sheet = book.sheetNames.find((name) => name.startsWith("1.DM"));
  if (!sheet) fail('xlsx thiếu sheet "1.DM ..."');
  const provinces = new Map();
  const wards = [];
  // Cột (0 = A rỗng): 2 = C mã tỉnh BNV, 3 = D tên tỉnh, 8 = I mã phường/xã mới, 9 = J tên phường/xã mới.
  for (const row of book.rows(sheet).slice(1)) {
    const provinceCode = (row[2] ?? "").trim();
    const wardCode = (row[8] ?? "").trim();
    if (!wardCode) continue;
    const provinceName = normalizeProvinceName(row[3] ?? "");
    const known = provinces.get(provinceCode);
    if (known && known !== provinceName) fail(`mã tỉnh ${provinceCode} có hai tên: ${known} / ${provinceName}`);
    provinces.set(provinceCode, provinceName);
    wards.push({ provinceCode, provinceName, code: wardCode, name: clean(row[9] ?? "") });
  }
  return { provinces, wards };
}

/** Áp bảng sửa tên theo mã; thất bại nếu tên xlsx không đúng `from` hoặc mục không được dùng. */
function applyNameOverrides(xlsxWards) {
  const used = new Set();
  const fixed = xlsxWards.map((ward) => {
    const override = WARD_NAME_OVERRIDES[ward.code];
    if (!override) return ward;
    if (ward.name !== clean(override.from)) fail(`override ${ward.code}: xlsx ghi "${ward.name}", cần "${override.from}"`);
    used.add(ward.code);
    return { ...ward, name: clean(override.to) };
  });
  const unused = Object.keys(WARD_NAME_OVERRIDES).filter((code) => !used.has(code));
  if (unused.length) fail(`override không được dùng: ${unused.join("; ")}`);
  return fixed;
}

function wardTypeOf(name) {
  const found = WARD_TYPES.find(([prefix]) => name.startsWith(prefix));
  if (!found) fail(`không nhận ra loại đơn vị của "${name}"`);
  return found[1];
}

/**
 * Gom tên cũ theo (tỉnh mới, tên phường mới) từ csv; mỗi nhóm phải được dùng ít nhất 1 lần. Hai cách viết khác nhau
 * của cùng một khoá so khớp là dấu hiệu gộp nhầm hai phường (hoặc csv viết không nhất quán) -> thất bại.
 */
function readLegacyIndex() {
  const [header, ...rows] = parseCsv(readFileSync(new URL(CSV_FILE, dataDir), "utf8").replace(/^﻿/, ""));
  if (header.length < 5) fail("csv thiếu cột");
  const index = new Map();
  for (const [oldWard, oldDistrict, , newProvince, newWard] of rows) {
    const legacy = clean(oldWard) ? `${clean(oldWard)}, ${clean(oldDistrict)}` : clean(oldDistrict);
    const key = `${matchKey(newProvince)}|${matchKey(newWard)}`;
    const label = `${clean(newProvince)} / ${clean(newWard)}`;
    const entry = index.get(key) ?? { names: [], used: false, label };
    if (entry.label !== label) fail(`csv: hai cách viết "${entry.label}" và "${label}" cùng khoá so khớp`);
    if (!entry.names.includes(legacy)) entry.names.push(legacy);
    index.set(key, entry);
  }
  return { index, rowCount: rows.length };
}

function aliasLookup() {
  const lookup = new Map();
  for (const [province, names] of Object.entries(WARD_NAME_ALIASES)) {
    for (const [from, to] of Object.entries(names)) {
      lookup.set(`${matchKey(province)}|${matchKey(from)}`, { to: matchKey(to), used: false });
    }
  }
  return lookup;
}

function buildProvinces(provinceMap) {
  return [...provinceMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, name]) => {
      const bare = name.replace(/^(Tỉnh|Thành phố) /, "");
      return {
        code,
        name,
        shortName: PROVINCE_SHORT_NAME_OVERRIDES[name] ?? bare,
        slug: slugify(bare),
        sortOrder: Number(code),
      };
    });
}

/** Hai phường xlsx cùng tỉnh mà trùng khoá so khớp = không phân biệt được khi nối với csv -> thất bại. */
function assertDistinctWardKeys(xlsxWards) {
  const seen = new Map();
  for (const ward of xlsxWards) {
    const key = `${matchKey(ward.provinceName)}|${matchKey(ward.name)}`;
    const other = seen.get(key);
    if (other) fail(`xlsx: ${other.code} "${other.name}" và ${ward.code} "${ward.name}" (${ward.provinceName}) trùng khoá so khớp`);
    seen.set(key, ward);
  }
}

function buildWards(xlsxWards, index, aliases) {
  const takenSlugs = new Map();
  const missing = [];
  const wards = [...xlsxWards]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((ward) => {
      const provinceKey = matchKey(ward.provinceName);
      const direct = `${provinceKey}|${matchKey(ward.name)}`;
      const alias = aliases.get(direct);
      if (alias) alias.used = true;
      const entry = index.get(alias ? `${provinceKey}|${alias.to}` : direct);
      if (!entry) {
        missing.push(`${ward.code} "${ward.name}" (${ward.provinceName})`);
        return null;
      }
      if (entry.used) fail(`csv "${entry.label}" bị khớp bởi hơn một phường xlsx (lần sau: ${ward.code} "${ward.name}")`);
      entry.used = true;
      const taken = takenSlugs.get(ward.provinceCode) ?? new Set();
      takenSlugs.set(ward.provinceCode, taken);
      const slug = appendUniqueSuffix(slugify(ward.name), taken);
      taken.add(slug);
      return {
        provinceCode: ward.provinceCode,
        code: ward.code,
        name: ward.name,
        type: wardTypeOf(ward.name),
        slug,
        legacyNames: entry.names,
      };
    });
  if (missing.length) fail(`${missing.length} phường xlsx không có dòng tên cũ trong csv:\n  ${missing.join("\n  ")}`);
  return wards;
}

function assertInvariants({ provinces, wards, index, aliases }) {
  const unusedAliases = [...aliases].filter(([, a]) => !a.used).map(([key]) => key);
  const unmatchedCsv = [...index.values()].filter((e) => !e.used).map((e) => e.label);
  if (unusedAliases.length) fail(`alias không được dùng: ${unusedAliases.join("; ")}`);
  if (unmatchedCsv.length) fail(`${unmatchedCsv.length} phường trong csv không khớp xlsx: ${unmatchedCsv.slice(0, 5).join("; ")}`);

  const counts = { provinces: provinces.length, wards: wards.length };
  for (const type of ["phuong", "xa", "dac_khu"]) counts[type] = wards.filter((w) => w.type === type).length;
  for (const [key, expected] of Object.entries(EXPECTED)) {
    if (counts[key] !== expected) fail(`${key}: có ${counts[key]}, cần ${expected}`);
  }
  if (new Set(wards.map((w) => w.code)).size !== wards.length) fail("mã phường trùng");
  return counts;
}

function build() {
  const { provinces: provinceMap, wards: rawXlsxWards } = readXlsxUnits();
  const xlsxWards = applyNameOverrides(rawXlsxWards);
  const { index, rowCount } = readLegacyIndex();
  const aliases = aliasLookup();
  assertDistinctWardKeys(xlsxWards);
  const provinces = buildProvinces(provinceMap);
  const wards = buildWards(xlsxWards, index, aliases);
  const counts = assertInvariants({ provinces, wards, index, aliases });
  return { counts, csvRows: rowCount, data: { provinces, wards } };
}

const { counts, csvRows, data } = build();
const output = {
  _meta: {
    description:
      "34 tỉnh/thành và phường/xã/đặc khu sau 01/07/2025 kèm tên cũ. FILE SINH TỰ ĐỘNG: sửa nguồn rồi chạy `node scripts/build-admin-units.mjs`.",
    sources: {
      units: `seed/data/${XLSX_FILE} (sheet "1.DM Phường xã mới": mã tỉnh BNV, tên, mã phường/xã TMS 8 số)`,
      legacyNames: `seed/data/${CSV_FILE} (tên phường/xã, quận/huyện cũ trước 01/07/2025)`,
    },
    asOf: DATA_AS_OF,
    counts,
  },
  ...data,
};
writeFileSync(fileURLToPath(new URL(OUTPUT_FILE, dataDir)), `${JSON.stringify(output)}\n`);
console.log(`Đã ghi seed/data/${OUTPUT_FILE}: ${JSON.stringify(counts)} (csv ${csvRows} dòng)`);
