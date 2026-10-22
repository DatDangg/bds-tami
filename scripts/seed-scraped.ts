// Nạp dữ liệu demo lấy từ site tham chiếu (`seed/scraped/data.json` + `seed/scraped/images/`, gitignore, không vào image)
// vào DB dev/staging để xem/test giao diện với nội dung "giống thật". Bị chặn khi APP_ENV=production.
// Chạy: `pnpm payload run scripts/seed-scraped.ts` (thêm tham số `remove` để xoá hẳn đúng các bản ghi do script này tạo).
// Idempotent theo tiêu đề `vi`; không xếp job dịch AI (context `translationJob`), nên không tốn ngân sách dịch.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";
import { englishSeedBlockReason, runSeedEnglish } from "../seed/english";
import { TRANSLATION_JOB_CONTEXT_KEY } from "../src/hooks/translation/translation-targets";

type Block = { type: "p" | "h" | "li"; text: string };
interface Listing {
  sourceUrl: string;
  title: string;
  address: string;
  priceText: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  info: Record<string, string>;
  intro: Block[];
  location: [number, number] | null;
  images: string[];
  kind?: string;
}
interface ScrapedProject {
  sourceUrl: string;
  title: string;
  address: string;
  priceText: string;
  summary: string;
  blocks: Block[];
  developer: string | null;
  images: string[];
  kind: string;
}
interface ScrapedNews {
  sourceUrl: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  blocks: Block[];
  images: string[];
  kind: string;
}
interface Bundle {
  rentals: Listing[];
  sales: Listing[];
  projects: ScrapedProject[];
  news: ScrapedNews[];
}

const DIR = path.resolve(process.cwd(), "seed/scraped");
/** Context mới cho mỗi lần gọi: hook/plugin ghi cờ vào `context`, dùng chung một object sẽ làm lần gọi sau bị bỏ qua bước (vd upload S3). */
const context = () => ({ [TRANSLATION_JOB_CONTEXT_KEY]: true });
const Q = { depth: 0, limit: 1, pagination: false, overrideAccess: true } as const;

/** Số giả ngẫu nhiên nhưng cố định theo chuỗi: chạy lại cho cùng giá/trạng thái. */
function rand(seed: string, salt = ""): number {
  return createHash("sha1").update(seed + salt).digest().readUInt32BE(0) / 0xffffffff;
}
const pick = <T>(seed: string, items: readonly T[], salt = ""): T => items[Math.floor(rand(seed, salt) * items.length)];
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const truncate = (s: string, max: number) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(" ", max - 1)) + "…");

// ---------- Lexical ----------
const textNode = (text: string) => ({ type: "text", version: 1, text, detail: 0, format: 0, mode: "normal", style: "" });
const base = { version: 1, direction: "ltr", format: "", indent: 0 };
function blocksToLexical(blocks: readonly Block[]) {
  const children: unknown[] = [];
  let list: { items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    children.push({
      ...base,
      type: "list",
      listType: "bullet",
      tag: "ul",
      start: 1,
      children: list.items.map((t, i) => ({ ...base, type: "listitem", value: i + 1, children: [textNode(t)] })),
    });
    list = null;
  };
  for (const b of blocks) {
    if (b.type === "li") {
      list ??= { items: [] };
      list.items.push(b.text);
      continue;
    }
    flush();
    if (b.type === "h") children.push({ ...base, type: "heading", tag: "h2", children: [textNode(b.text)] });
    else children.push({ ...base, type: "paragraph", textFormat: 0, children: [textNode(b.text)] });
  }
  flush();
  return { root: { ...base, type: "root", children } };
}

// ---------- Địa giới ----------
const PROVINCE_HINTS: [RegExp, string][] = [
  [/Nha Trang|Cam Ranh|Khánh Hòa|Khánh Hoà/i, "khanh-hoa"],
  [/Phú Quốc|Kiên Giang|Hà Tiên/i, "an-giang"],
  [/Quy Nhơn|Bình Định/i, "gia-lai"],
  [/Hạ Long|Quảng Ninh|Vân Đồn|Cẩm Phả/i, "quang-ninh"],
  [/Văn Giang|Hưng Yên|Thái Bình|Ecopark/i, "hung-yen"],
  [/Bắc Ninh|Bắc Giang|Từ Sơn/i, "bac-ninh"],
  [/Hải Phòng|Hải Dương/i, "hai-phong"],
  [/Hồ Chí Minh|TP\.? ?HCM|Sài Gòn|Thủ Đức|Vũng Tàu/i, "ho-chi-minh"],
  [/Đà Nẵng|Hội An|Quảng Nam/i, "da-nang"],
  [/Phan Thiết|Bình Thuận|Đà Lạt|Lâm Đồng/i, "lam-dong"],
  [/Vĩnh Phúc|Hòa Bình|Hoà Bình|Phú Thọ/i, "phu-tho"],
  [/Thanh Hóa|Sầm Sơn/i, "thanh-hoa"],
  [/Huế/i, "hue"],
];

interface WardDoc {
  id: string;
  name: string;
  legacyNames?: { name: string }[] | null;
}
const geoCache = new Map<string, { provinceId: string; wards: WardDoc[] }>();
async function loadProvince(payload: Payload, slug: string) {
  const cached = geoCache.get(slug);
  if (cached) return cached;
  const province = (await payload.find({ collection: "provinces", where: { slug: { equals: slug } }, ...Q })).docs[0];
  if (!province) throw new Error(`Thiếu tỉnh/thành "${slug}": chạy pnpm seed trước.`);
  const wards = (
    await payload.find({ collection: "wards", where: { province: { equals: province.id } }, sort: "name", depth: 0, limit: 0, pagination: false, overrideAccess: true })
  ).docs as unknown as WardDoc[];
  const entry = { provinceId: province.id as string, wards };
  geoCache.set(slug, entry);
  return entry;
}

const norm = (s: string) => s.toLowerCase().normalize("NFC").replace(/\s+/g, " ");

/** Tỉnh theo gợi ý địa danh (mặc định Hà Nội); phường theo tên cũ "Phường X, Quận Y" → tên mới → quận cũ → phường đầu. */
async function resolvePlace(payload: Payload, text: string) {
  const slug = PROVINCE_HINTS.find(([re]) => re.test(text))?.[1] ?? "ha-noi";
  const { provinceId, wards } = await loadProvince(payload, slug);
  const t = norm(text);
  const ward = t.match(/(?:phường|xã|thị trấn)\s+([^,\-–]+)/)?.[1]?.trim();
  const district = t.match(/(?:quận|huyện|thị xã|thành phố)\s+([^,\-–]+)/)?.[1]?.trim();
  const legacy = (w: WardDoc) => (w.legacyNames ?? []).map((l) => norm(l.name));
  let found =
    (ward && district && wards.find((w) => legacy(w).some((l) => l.startsWith(`phường ${ward},`) || l.startsWith(`xã ${ward},`)) && legacy(w).some((l) => l.endsWith(district)))) ||
    (ward && wards.find((w) => norm(w.name).endsWith(` ${ward}`))) ||
    (ward && wards.find((w) => legacy(w).some((l) => l.startsWith(`phường ${ward},`) || l.startsWith(`xã ${ward},`)))) ||
    (district && wards.find((w) => legacy(w).some((l) => l.endsWith(`quận ${district}`) || l.endsWith(`huyện ${district}`)))) ||
    wards.find((w) => t.includes(norm(w.name).replace(/^(phường|xã|đặc khu) /, "")));
  found ||= pick(text, wards, "ward");
  return { province: provinceId, ward: found.id };
}

// ---------- Giá ----------
function parsePrice(text: string, monthly: boolean): number | null {
  const t = norm(text).replace(/,/g, ".");
  const n = Number(t.match(/[\d.]+/)?.[0]?.replace(/\.(?=\d{3}\b)/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (/tỷ/.test(t)) return Math.round(n * 1e9);
  if (/triệu/.test(t)) return Math.round(n * 1e6);
  if (/usd|\$/.test(t)) return Math.round(n * 25_000);
  return monthly && n < 1000 ? Math.round(n * 1e6) : null;
}

// ---------- Media ----------
async function upload(payload: Payload, file: string, alt: string): Promise<string> {
  const found = await payload.find({ collection: "media", where: { alt: { equals: alt } }, locale: "vi", fallbackLocale: false, ...Q });
  if (found.docs[0]) return found.docs[0].id as string;
  const data = await readFile(path.join(DIR, "images", file));
  const created = await payload.create({
    collection: "media",
    data: { alt },
    file: { data, mimetype: "image/webp", name: file, size: data.byteLength },
    locale: "vi",
    depth: 0,
    overrideAccess: true,
    context: context(),
  });
  return created.id as string;
}
/** Tuần tự: sharp sinh 4 cỡ ảnh mỗi file, chạy song song dễ vượt giới hạn RAM của container staging. */
async function uploadAll(payload: Payload, files: readonly string[], title: string): Promise<string[]> {
  const ids: string[] = [];
  for (const [i, f] of files.entries()) ids.push(await upload(payload, f, `${title} - ảnh ${i + 1}`));
  return ids;
}

// ---------- Danh mục ----------
async function categoryByName(payload: Payload, scope: string, vi: string, en?: string): Promise<string> {
  const found = await payload.find({
    collection: "categories",
    where: { and: [{ scope: { equals: scope } }, { name: { equals: vi } }] },
    locale: "vi",
    fallbackLocale: false,
    trash: true,
    ...Q,
  });
  if (found.docs[0]) return found.docs[0].id as string;
  const created = await payload.create({ collection: "categories", data: { name: vi, scope } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() });
  if (en) await payload.update({ collection: "categories", id: created.id, data: { name: en, hasEnglish: true } as never, locale: "en", depth: 0, overrideAccess: true, context: context() });
  return created.id as string;
}
async function categoryBySlug(payload: Payload, scope: string, slug: string): Promise<string> {
  const found = await payload.find({ collection: "categories", where: { and: [{ scope: { equals: scope } }, { slug: { equals: slug } }] }, locale: "vi", ...Q });
  if (!found.docs[0]) throw new Error(`Thiếu danh mục ${scope} "${slug}": chạy pnpm seed trước.`);
  return found.docs[0].id as string;
}

async function exists(payload: Payload, collection: "projects" | "rentals" | "property-posts" | "news", title: string) {
  const found = await payload.find({ collection, where: { title: { equals: title } }, locale: "vi", fallbackLocale: false, trash: true, ...Q });
  return found.docs[0]?.id as string | undefined;
}

/** Tiêu đề trùng trong bundle → thêm hậu tố để slug/idempotency không đụng nhau. */
function uniqueTitles<T extends { title: string }>(items: T[]): T[] {
  const count = new Map<string, number>();
  return items.map((it) => {
    const n = (count.get(it.title) ?? 0) + 1;
    count.set(it.title, n);
    return n === 1 ? it : { ...it, title: `${it.title} (${n})` };
  });
}

// ---------- Dự án ----------
const PROJECT_CATEGORY: Record<string, [string, string]> = {
  apartment: ["Căn hộ chung cư", "Apartments"],
  urban: ["Khu đô thị", "Urban areas"],
  villa: ["Nhà phố, biệt thự", "Townhouses and villas"],
  resort: ["Nghỉ dưỡng", "Resorts"],
};
const PROJECT_RANGES: Record<string, { price: [number, number]; area: [number, number] }> = {
  apartment: { price: [3.2e9, 14e9], area: [45, 180] },
  urban: { price: [5e9, 35e9], area: [60, 300] },
  villa: { price: [12e9, 65e9], area: [90, 450] },
  resort: { price: [4e9, 30e9], area: [40, 350] },
};
const AMENITY_KEYWORDS: [RegExp, string, string][] = [
  [/bể bơi|hồ bơi/i, "Bể bơi", "pool"],
  [/gym|phòng tập/i, "Phòng gym", "gym"],
  [/công viên|vườn/i, "Công viên cây xanh", "park"],
  [/trường (học|mầm non|quốc tế)|unis|sis/i, "Trường học", "school"],
  [/trung tâm thương mại|tttm|mall|siêu thị/i, "Trung tâm thương mại", "shopping"],
  [/bệnh viện|phòng khám/i, "Y tế", "hospital"],
  [/sân chơi|trẻ em|kids/i, "Sân chơi trẻ em", "playground"],
  [/bbq|nướng/i, "Khu BBQ", "bbq"],
  [/spa/i, "Spa", "spa"],
  [/golf/i, "Sân golf", "golf"],
  [/an ninh|bảo vệ 24/i, "An ninh 24/7", "security"],
  [/hầm|đỗ xe|bãi xe/i, "Hầm để xe", "parking"],
];

function scaleFrom(text: string) {
  const num = (re: RegExp) => {
    const m = text.match(re)?.[1];
    const n = m ? Number(m.replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".")) : NaN;
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const ha = num(/([\d.,]+)\s*(?:ha\b|hecta)/i);
  return {
    totalUnits: num(/([\d.]+)\s*căn hộ/i) ?? num(/số lượng căn[^:]*:\s*([\d.]+)/i),
    blocks: num(/(\d+)\s*(?:tòa|toà|block)/i),
    floors: num(/(\d+)\s*tầng/i),
    landAreaM2: num(/([\d.]+)\s*m²/i) ?? (ha ? Math.round(ha * 10_000) : undefined),
  };
}

async function findOrCreateDeveloper(payload: Payload, name: string): Promise<string> {
  const found = await payload.find({ collection: "developers", where: { name: { equals: name } }, locale: "vi", trash: true, ...Q });
  if (found.docs[0]) return found.docs[0].id as string;
  return (await payload.create({ collection: "developers", data: { name } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() })).id as string;
}

async function seedProjects(payload: Payload, items: ScrapedProject[], authorId: string) {
  let created = 0;
  const ids: { id: string; key: string }[] = [];
  for (const [index, p] of uniqueTitles(items).entries()) {
    const key = norm(p.title.split(/ - | – /)[0]).trim();
    const existing = await exists(payload, "projects", p.title);
    if (existing) {
      ids.push({ id: existing, key });
      continue;
    }
    const kind = PROJECT_CATEGORY[p.kind] ? p.kind : "apartment";
    const text = [p.title, p.address, p.summary, ...p.blocks.map((b) => b.text)].join(" ");
    const range = PROJECT_RANGES[kind];
    const priceFrom = parsePrice(p.priceText, false) ?? roundTo(range.price[0] + rand(p.title, "p") * (range.price[1] - range.price[0]) * 0.4, 1e8);
    const areaFrom = roundTo(range.area[0] + rand(p.title, "a") * 30, 1);
    const developerName = p.developer && p.developer.length <= 80 && !/một thành viên$/i.test(p.developer) ? p.developer : null;
    const gallery = await uploadAll(payload, p.images, p.title);
    const doc = await payload.create({
      collection: "projects",
      data: {
        title: p.title,
        summary: truncate(p.summary || p.blocks.find((b) => b.type === "p")?.text || p.title, 400),
        overview: blocksToLexical(p.blocks.slice(0, 60)) as never,
        category: await categoryByName(payload, "project", ...PROJECT_CATEGORY[kind]),
        ...(developerName ? { developer: await findOrCreateDeveloper(payload, developerName) } : {}),
        salesStatus: pick(p.title, ["selling", "selling", "selling", "upcoming", "upcoming", "handed_over"] as const, "s"),
        ...(await resolvePlace(payload, `${p.address} ${p.title}`)),
        address: p.address || undefined,
        priceFromVnd: priceFrom,
        priceToVnd: roundTo(priceFrom * (1.8 + rand(p.title, "pt") * 1.5), 1e8),
        areaFromM2: areaFrom,
        areaToM2: roundTo(areaFrom * (2 + rand(p.title, "at") * 2), 1),
        scale: { ...scaleFrom(text), handoverTime: pick(p.title, ["Quý IV/2026", "Quý II/2027", "Quý IV/2027", "2028", "Đã bàn giao"], "h") },
        amenities: AMENITY_KEYWORDS.filter(([re]) => re.test(text)).map(([, name, icon]) => ({ name, icon })),
        gallery,
        author: authorId,
        isFeatured: index < 8,
        status: "published",
      } as never,
      locale: "vi",
      overrideAccess: true,
      context: context(),
    });
    ids.push({ id: doc.id as string, key });
    created += 1;
  }
  return { created, total: items.length, ids };
}

function relatedProject(title: string, projects: { id: string; key: string }[]): string | undefined {
  const t = norm(title);
  return projects.filter((p) => p.key.length >= 6 && t.includes(p.key)).sort((a, b) => b.key.length - a.key.length)[0]?.id;
}

// ---------- Cho thuê ----------
const RENTAL_CATEGORY: Record<string, string> = {
  apartment: "Căn hộ chung cư",
  serviced: "Căn hộ dịch vụ",
  house: "Nhà nguyên căn",
  office: "Văn phòng",
  shop: "Mặt bằng kinh doanh",
};
const DIRECTION: [RegExp, string][] = [
  [/đông bắc/i, "NE"],
  [/đông nam/i, "SE"],
  [/tây bắc/i, "NW"],
  [/tây nam/i, "SW"],
  [/\bđông\b/i, "E"],
  [/\btây\b/i, "W"],
  [/\bnam\b/i, "S"],
  [/\bbắc\b/i, "N"],
];
const direction = (s: string | undefined) => (s ? DIRECTION.find(([re]) => re.test(s))?.[1] : undefined);
function furnishing(info: Record<string, string>, title: string) {
  const s = norm(`${info["Đồ đạc"] ?? ""} ${title}`);
  if (/đầy đủ|full|cao cấp/.test(s)) return "full";
  if (/cơ bản/.test(s)) return "basic";
  if (/nguyên bản|không|trống|thô/.test(s)) return "none";
  return undefined;
}
/** Giá thuê ước tính (VND/m²/tháng) khi tin gốc "Thỏa thuận". */
const RENT_PER_M2: Record<string, [number, number]> = {
  apartment: [190_000, 330_000],
  serviced: [260_000, 420_000],
  house: [150_000, 300_000],
  office: [280_000, 520_000],
  shop: [400_000, 900_000],
};

function rentalDescription(r: Listing): Block[] {
  const intro = r.intro.filter((b) => !/^liên hệ|^lh\b|hotline/i.test(b.text));
  const facts = [
    r.areaM2 && `Diện tích: ${r.areaM2} m²`,
    r.bedrooms && `Phòng ngủ: ${r.bedrooms}`,
    r.bathrooms && `Phòng tắm: ${r.bathrooms}`,
    r.info["Tầng"] && `Tầng: ${r.info["Tầng"]}`,
    r.info["Hướng"] && `Hướng: ${r.info["Hướng"]}`,
    r.info["Nhìn ra"] && `View: ${r.info["Nhìn ra"]}`,
    r.info["Đồ đạc"] && `Nội thất: ${r.info["Đồ đạc"]}`,
  ].filter(Boolean) as string[];
  const blocks: Block[] = intro.length >= 2 ? intro : [{ type: "p", text: `${r.title}.` }];
  if (facts.length) blocks.push({ type: "h", text: "Thông tin chính" }, ...facts.map((text) => ({ type: "li" as const, text })));
  blocks.push({ type: "p", text: "Liên hệ TAMI để được tư vấn và đặt lịch xem nhà." });
  return blocks;
}

async function seedRentals(payload: Payload, items: Listing[], authorId: string, projects: { id: string; key: string }[]) {
  let created = 0;
  for (const r of uniqueTitles(items)) {
    if (!r.areaM2 || r.images.length < 3 || (await exists(payload, "rentals", r.title))) continue;
    let kind = r.kind && RENTAL_CATEGORY[r.kind] ? r.kind : "apartment";
    if (/văn phòng/i.test(r.title)) kind = "office";
    else if (/shophouse|mặt bằng|ki ốt|kiot/i.test(r.title)) kind = "shop";
    else if (/biệt thự|liền kề|nhà phố|nguyên căn/i.test(r.title)) kind = "house";
    const categoryName = kind === "apartment" && (r.bedrooms ?? 2) <= 1 && r.areaM2 <= 45 ? "Studio" : RENTAL_CATEGORY[kind];
    const parsed = parsePrice(r.priceText, true);
    const negotiable = !parsed && rand(r.title, "neg") < 0.25;
    const [lo, hi] = RENT_PER_M2[kind];
    const estimate = roundTo(r.areaM2 * (lo + rand(r.title, "rp") * (hi - lo)), 500_000);
    const gallery = await uploadAll(payload, r.images, r.title);
    await payload.create({
      collection: "rentals",
      data: {
        title: r.title,
        category: await categoryByName(payload, "rental", categoryName),
        project: relatedProject(r.title, projects),
        ...(await resolvePlace(payload, `${r.address} ${r.title}`)),
        address: r.address || r.title,
        ...(r.location ? { location: r.location } : {}),
        priceMonthlyVnd: negotiable ? undefined : (parsed ?? estimate),
        priceNegotiable: negotiable,
        areaM2: r.areaM2,
        bedrooms: r.bedrooms ?? undefined,
        bathrooms: r.bathrooms ?? undefined,
        floor: r.info["Tầng"] || undefined,
        houseDirection: direction(r.info["Hướng"]) ?? direction(r.title.match(/hướng\s+([^\s,-]+(?:\s+(?:bắc|nam))?)/i)?.[1]),
        furnishing: furnishing(r.info, r.title),
        rentalTerms: {
          minLeaseMonths: pick(r.title, [6, 12, 12, 12], "ml"),
          depositMonths: pick(r.title, [1, 2, 2], "dp"),
          paymentCycle: pick(r.title, ["monthly", "quarterly", "quarterly", "semiannual"] as const, "pc"),
          includedServices: kind === "serviced" ? ["internet", "cleaning", "laundry", "management_fee", "security"] : pick(r.title, [["management_fee"], ["parking", "security"], []], "is"),
        },
        description: blocksToLexical(rentalDescription(r)) as never,
        gallery,
        author: authorId,
        status: rand(r.title, "st") < 0.08 ? "rented" : "published",
      } as never,
      locale: "vi",
      overrideAccess: true,
      context: context(),
    });
    created += 1;
  }
  return { created, total: items.length };
}

// ---------- Đăng tin BĐS (tin bán) ----------
async function seedSales(payload: Payload, items: Listing[], authorId: string, projects: { id: string; key: string }[]) {
  const category = await categoryBySlug(payload, "property_post", "tin-bds");
  let created = 0;
  for (const s of uniqueTitles(items)) {
    if (!s.images.length || (await exists(payload, "property-posts", s.title))) continue;
    const blocks = rentalDescription(s).filter((b) => !/xem nhà/.test(b.text));
    blocks.push({ type: "p", text: "Liên hệ TAMI để nhận bảng giá chi tiết và lịch xem thực tế." });
    const firstText = s.intro.find((b) => b.text.length > 30)?.text;
    const price = parsePrice(s.priceText, false);
    const [cover, ...gallery] = await uploadAll(payload, s.images, s.title);
    await payload.create({
      collection: "property-posts",
      data: {
        title: s.title,
        category,
        cover,
        gallery,
        excerpt: truncate(firstText ?? `${s.title}${s.areaM2 ? `, diện tích ${s.areaM2} m²` : ""}.`, 300),
        content: blocksToLexical(blocks) as never,
        priceVnd: price ?? undefined,
        priceNote: price ? s.priceText : "Giá thỏa thuận",
        ...(await resolvePlace(payload, `${s.address} ${s.title}`)),
        relatedProject: relatedProject(s.title, projects),
        author: authorId,
        status: "published",
      } as never,
      locale: "vi",
      overrideAccess: true,
      context: context(),
    });
    created += 1;
  }
  return { created, total: items.length };
}

// ---------- Tin tức ----------
async function seedNews(payload: Payload, items: ScrapedNews[], authorId: string) {
  const categories = {
    market: await categoryBySlug(payload, "news", "thi-truong"),
    life: await categoryBySlug(payload, "news", "doi-song"),
  };
  let created = 0;
  for (const n of uniqueTitles(items)) {
    if (await exists(payload, "news", n.title)) continue;
    const cover = await upload(payload, n.images[0], `${n.title} - ảnh bìa`);
    await payload.create({
      collection: "news",
      data: {
        title: n.title,
        excerpt: truncate(n.excerpt || n.blocks.find((b) => b.type === "p")?.text || n.title, 300),
        content: blocksToLexical(n.blocks.slice(0, 80)) as never,
        tags: n.kind === "life" ? ["nhà đẹp", "nội thất"] : ["thị trường", "dự án"],
        category: categories[n.kind === "life" ? "life" : "market"],
        cover,
        author: authorId,
        status: "published",
        ...(n.publishedAt && new Date(n.publishedAt) < new Date() ? { publishedAt: n.publishedAt } : {}),
      } as never,
      locale: "vi",
      overrideAccess: true,
      context: context(),
    });
    created += 1;
  }
  return { created, total: items.length };
}

// ---------- Xoá ----------
async function removeAll(payload: Payload, bundle: Bundle) {
  const groups: ["news" | "property-posts" | "rentals" | "projects", { title: string; images: string[] }[]][] = [
    ["news", bundle.news],
    ["property-posts", bundle.sales],
    ["rentals", bundle.rentals],
    ["projects", bundle.projects],
  ];
  for (const [collection, items] of groups) {
    let removed = 0;
    for (const it of uniqueTitles(items)) {
      const id = await exists(payload, collection, it.title);
      if (!id) continue;
      await payload.delete({ collection, id, overrideAccess: true, context: context() });
      removed += 1;
    }
    payload.logger.info(`Xoá ${collection}: ${removed}`);
  }
  const all = [...bundle.projects, ...bundle.rentals, ...bundle.sales, ...bundle.news];
  let media = 0;
  for (const it of uniqueTitles(all)) {
    const res = await payload.delete({
      collection: "media",
      where: { or: [{ alt: { like: `${it.title} - ảnh` } }] },
      overrideAccess: true,
      context: context(),
    });
    media += res.docs.length;
  }
  payload.logger.info(`Xoá media: ${media}`);
}

if (process.env.APP_ENV === "production") {
  console.error("Không nạp dữ liệu demo ở production (APP_ENV=production).");
  process.exit(1);
}
const bundle = JSON.parse(await readFile(path.join(DIR, "data.json"), "utf8")) as Bundle;
const payload = await getPayload({ config });
try {
  if (process.argv.slice(2).includes("remove")) {
    await removeAll(payload, bundle);
  } else {
    const author = (await payload.find({ collection: "staff", where: { role: { equals: "admin" } }, ...Q })).docs[0];
    if (!author) throw new Error("Chưa có tài khoản admin để làm tác giả: tạo admin trước.");
    const authorId = author.id as string;
    const projects = await seedProjects(payload, bundle.projects, authorId);
    payload.logger.info(`Dự án: tạo ${projects.created}/${projects.total}`);
    const rentals = await seedRentals(payload, bundle.rentals, authorId, projects.ids);
    payload.logger.info(`Cho thuê: tạo ${rentals.created}/${rentals.total}`);
    const sales = await seedSales(payload, bundle.sales, authorId, projects.ids);
    payload.logger.info(`Đăng tin BĐS: tạo ${sales.created}/${sales.total}`);
    const news = await seedNews(payload, bundle.news, authorId);
    payload.logger.info(`Tin tức: tạo ${news.created}/${news.total}`);
    // Bản EN viết sẵn (BL-064): nguồn vi của dữ liệu cào chỉ còn trong DB nên dữ liệu EN commit theo tiêu đề vi.
    const blocked = englishSeedBlockReason(process.env);
    if (blocked) payload.logger.info(`Seed EN: bỏ qua, không phải DB dev (${blocked})`);
    else await runSeedEnglish(payload);
  }
} finally {
  await payload.destroy();
}
