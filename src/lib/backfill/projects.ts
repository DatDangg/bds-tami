import type { Payload } from "payload";

import { MAX_PRODUCTS } from "../../collections/projects/listing-fields";
import type { Project } from "../../payload-types";
import {
  PROJECT_FEATURE_ADMIN_LABELS,
  PROPERTY_TYPE_ADMIN_LABELS,
  type ProjectFeature,
  type PropertyType,
} from "../../shared/listing-options";
import { capitalize, findPhrase, normalizeText, parseViNumber, phraseRegex, richTextToPlain, snippetAround } from "./text";
import type { BackfillAdapter, Confidence, DocPlan, FilledValue, ReviewNote } from "./types";

/**
 * Bộ trích dữ liệu cũ cho Dự án (BL-052 P1-T07): `productTypes`, `featuredAmenities`, `products` từ nội dung tiếng Việt sẵn có.
 * Chỉ điền ô đang trống; nguồn "cao" = tên / danh mục / bảng giá / danh sách tiện ích, "trung bình" = mô tả ngắn / tổng quan
 * (dễ nhắc tới loại hình hay tiện ích của nơi khác) → vào mục "cần admin soát". `products` chỉ điền khi có đủ
 * "<số> <loại> … <diện tích> m²" trong cùng câu; thiếu số lượng hoặc diện tích → chỉ ghi gợi ý.
 */

type ProjectProduct = NonNullable<Project["products"]>[number];

export interface ProjectSource {
  id: string;
  title: string;
  status?: string | null;
  category?: string | null;
  summary?: string | null;
  overviewText: string;
  priceUnitTypes: string[];
  amenities: string[];
  nearby: { category: string; name: string }[];
  productTypes?: readonly string[] | null;
  featuredAmenities?: readonly string[] | null;
  products?: readonly unknown[] | null;
}

interface TextSource {
  label: string;
  text: string;
  confidence: Confidence;
}

/** Cụm từ khoá (regex con, chữ thường) → loại sản phẩm. Loại trừ cụm dễ nhầm: "căn hộ khách sạn" (condotel), "văn phòng bán hàng". */
export const PRODUCT_TYPE_KEYWORDS: Record<PropertyType, readonly string[]> = {
  apartment: ["căn hộ(?! khách sạn)", "chung cư", "apartment"],
  townhouse: ["nhà liền kề", "liền kề", "nhà phố(?! thương mại)", "townhouse"],
  villa: ["biệt thự", "villa"],
  shophouse: ["shophouse", "shop house", "nhà phố thương mại"],
  land: ["đất nền"],
  // "nghỉ dưỡng" đứng một mình hay là lời quảng cáo ("thiên đường nghỉ dưỡng") → chỉ nhận khi đi sau danh từ loại hình.
  resort: ["(?:khu|biệt thự|căn hộ|đô thị|tổ hợp|quần thể|dự án|bất động sản) nghỉ dưỡng", "resort"],
  condotel: ["condotel", "căn hộ khách sạn"],
  office: ["văn phòng(?! (?:bán hàng|đại diện|giao dịch|công ty|chủ đầu tư|tư vấn))", "officetel"],
};

export const PROJECT_FEATURE_KEYWORDS: Record<ProjectFeature, readonly string[]> = {
  near_school: ["trường (?:học|mầm non|tiểu học|thcs|thpt|liên cấp|quốc tế|đại học|chuyên|song ngữ)", "nhà trẻ", "vinschool"],
  near_hospital: ["bệnh viện", "phòng khám", "vinmec"],
  near_mall: ["trung tâm thương mại", "tttm", "vincom", "aeon mall", "mega mall", "shopping mall"],
  near_metro: ["metro", "tàu điện", "đường sắt đô thị"],
  water_view: ["(?:view|ven|hướng|nhìn ra|bên|sát|giáp) (?:sông|hồ(?! bơi))"],
  pool_gym_spa: ["hồ bơi", "bể bơi", "gym", "phòng tập", "spa"],
  green_park: ["công viên"],
};

/** Nhóm "Tiện ích xung quanh" → tiện ích nổi bật (giao thông chỉ tính khi tên có metro / tàu điện). */
const NEARBY_TO_FEATURE: Partial<Record<string, ProjectFeature>> = {
  education: "near_school",
  healthcare: "near_hospital",
  shopping: "near_mall",
  park: "green_park",
};

const isEmpty = (value: readonly unknown[] | null | undefined) => !Array.isArray(value) || value.length === 0;

function matchKeywords<T extends string>(keywords: Record<T, readonly string[]>, sources: readonly TextSource[], field: string, labels: Record<T, string>) {
  const found = new Map<T, FilledValue>();
  for (const source of sources) {
    for (const value of Object.keys(keywords) as T[]) {
      if (found.has(value)) continue;
      const hit = findPhrase(source.text, keywords[value]);
      if (!hit) continue;
      found.set(value, { field, value: `${labels[value]} (${value})`, source: source.label, snippet: snippetAround(source.text, hit.index, hit.length), confidence: source.confidence });
    }
  }
  return found;
}

// ── products: "<số> [căn|lô] <loại> [≤2 chữ] … <a>[–<b>] m²" trong cùng câu ──
const PRODUCT_NOUNS = "căn hộ|chung cư|biệt thự|nhà liền kề|liền kề|nhà phố thương mại|nhà phố|shophouse|condotel|officetel|đất nền|townhouse|villa";
const STOP_WORDS = "diện|với|có|gồm|tại|và|từ|đến|được|là|của|trên|thuộc|cùng|mỗi";
const COUNT_TYPE = new RegExp(
  `(?<![\\p{L}\\p{N}.,])(\\d{1,3}(?:\\.\\d{3})+|\\d{1,5})\\s+(?:(căn|lô|sản phẩm)\\s+)?((?:${PRODUCT_NOUNS})(?:\\s+(?!(?:${STOP_WORDS})(?![\\p{L}]))[\\p{L}]+){0,2})(?![\\p{L}\\p{N}])`,
  "gu",
);
const TYPE_AREA = phraseRegex(`(${PRODUCT_NOUNS})[\\p{L} ]{0,25}:\\s*(?:khoảng\\s+)?(\\d+(?:[.,]\\d+)*)\\s*(?:m²|m2)?\\s*(?:[-–—~]|đến)\\s*(\\d+(?:[.,]\\d+)*)\\s*(?:m²|m2)`, "gu");
const AREA = /(\d+(?:[.,]\d+)*)\s*(?:m²|m2)?\s*(?:(?:[-–—~]|đến)\s*(\d+(?:[.,]\d+)*)\s*)?(?:m²|m2)(?![\p{L}\p{N}])/u;
const SENTENCE_END = /[.;!?\n](?:\s|$)|\n/u;
const MAX_COUNT = 50_000;
const MAX_AREA = 100_000;

const validArea = (value: number | null): value is number => value !== null && value > 0 && value <= MAX_AREA;

export interface ProductExtraction {
  products: (Omit<ProjectProduct, "id"> & { snippet: string })[];
  suggestions: ReviewNote[];
}

export function extractProducts(text: string): ProductExtraction {
  const source = text.normalize("NFC");
  const lowered = normalizeText(source);
  const products: ProductExtraction["products"] = [];
  const suggestions: ReviewNote[] = [];
  const seen = new Set<string>();
  const matches = [...lowered.matchAll(COUNT_TYPE)];
  for (const [i, match] of matches.entries()) {
    const [whole, rawCount = "", unit, rawType = ""] = match;
    const start = match.index;
    const end = start + whole.length;
    const count = parseViNumber(rawCount);
    const type = capitalize(source.slice(end - rawType.length, end).trim());
    const isYear = !unit && count !== null && count >= 1990 && count <= 2100;
    if (count === null || count <= 0 || count > MAX_COUNT || isYear) continue;
    const nextStart = matches[i + 1]?.index ?? lowered.length;
    const tail = lowered.slice(end, nextStart);
    const sentence = tail.slice(0, tail.search(SENTENCE_END) === -1 ? tail.length : tail.search(SENTENCE_END)).slice(0, 80);
    const area = AREA.exec(sentence);
    const snippet = snippetAround(source, start, whole.length + (area ? area.index + area[0].length : 0), 15);
    const areaFrom = area?.[1] ? parseViNumber(area[1]) : null;
    const areaTo = area?.[2] ? parseViNumber(area[2]) : null;
    if (!validArea(areaFrom) || (areaTo !== null && (!validArea(areaTo) || areaTo < areaFrom))) {
      suggestions.push({ field: "products", note: `Gợi ý: ${type} — ${count} (không thấy diện tích trong cùng câu, chưa điền)`, snippet });
      continue;
    }
    const key = normalizeText(type);
    if (seen.has(key) || products.length >= MAX_PRODUCTS) continue;
    seen.add(key);
    products.push({ type, count, areaFrom, areaTo: areaTo ?? null, snippet });
  }
  for (const match of lowered.matchAll(TYPE_AREA)) {
    const [whole, noun = "", from, to] = match;
    const type = capitalize(source.slice(match.index, match.index + noun.length));
    if (seen.has(normalizeText(type))) continue;
    suggestions.push({ field: "products", note: `Gợi ý: ${type} ${from}–${to} m² (không có số lượng, chưa điền)`, snippet: snippetAround(source, match.index, whole.length, 15) });
  }
  return { products, suggestions };
}

const formatProduct = (p: Omit<ProjectProduct, "id">) =>
  `${p.type} · số lượng ${p.count ?? "?"} · ${p.areaFrom}${p.areaTo !== null && p.areaTo !== undefined && p.areaTo !== p.areaFrom ? `–${p.areaTo}` : ""} m²`;

/** Kết quả trích cho MỘT ô trống: giá trị ghi (nếu có) + dòng báo cáo. */
interface FieldPlan {
  value?: unknown;
  filled: FilledValue[];
  review: ReviewNote[];
}

const weakSources = (project: ProjectSource): TextSource[] => [
  { label: "mô tả ngắn", text: project.summary ?? "", confidence: "trung bình" },
  { label: "tổng quan", text: project.overviewText, confidence: "trung bình" },
];

/** Giữ thứ tự chuẩn của danh sách cố định; rỗng → không điền. */
const orderedFill = <T extends string>(order: readonly T[], found: Map<T, FilledValue>): FieldPlan =>
  found.size > 0 ? { value: order.filter((v) => found.has(v)), filled: [...found.values()], review: [] } : { filled: [], review: [] };

function planProductTypes(project: ProjectSource): FieldPlan {
  const strong: TextSource[] = [
    { label: "tên", text: project.title, confidence: "cao" },
    { label: "danh mục", text: project.category ?? "", confidence: "cao" },
    { label: "bảng giá", text: project.priceUnitTypes.join("\n"), confidence: "cao" },
  ];
  const found = matchKeywords(PRODUCT_TYPE_KEYWORDS, [...strong, ...weakSources(project)], "productTypes", PROPERTY_TYPE_ADMIN_LABELS);
  return orderedFill(Object.keys(PRODUCT_TYPE_KEYWORDS) as PropertyType[], found);
}

function planFeaturedAmenities(project: ProjectSource): FieldPlan {
  const found = new Map<ProjectFeature, FilledValue>();
  for (const item of project.nearby) {
    const viaMetro = item.category === "transport" && findPhrase(item.name, PROJECT_FEATURE_KEYWORDS.near_metro) ? "near_metro" : undefined;
    const feature = NEARBY_TO_FEATURE[item.category] ?? viaMetro;
    if (feature && !found.has(feature)) {
      found.set(feature, { field: "featuredAmenities", value: `${PROJECT_FEATURE_ADMIN_LABELS[feature]} (${feature})`, source: "tiện ích xung quanh", snippet: item.name, confidence: "cao" });
    }
  }
  const textSources: TextSource[] = [{ label: "danh sách tiện ích", text: project.amenities.join("\n"), confidence: "cao" }, ...weakSources(project)];
  for (const [feature, value] of matchKeywords(PROJECT_FEATURE_KEYWORDS, textSources, "featuredAmenities", PROJECT_FEATURE_ADMIN_LABELS)) {
    if (!found.has(feature)) found.set(feature, value);
  }
  return orderedFill(Object.keys(PROJECT_FEATURE_KEYWORDS) as ProjectFeature[], found);
}

function planProducts(project: ProjectSource): FieldPlan {
  const { products, suggestions } = extractProducts(project.overviewText);
  if (products.length === 0) return { filled: [], review: suggestions };
  return {
    value: products.map(({ type, count, areaFrom, areaTo }) => ({ type, count, areaFrom, areaTo })),
    filled: products.map((p) => ({ field: "products", value: formatProduct(p), source: "tổng quan", snippet: p.snippet, confidence: "trung bình" as const })),
    review: [...suggestions, { field: "products", note: "Tên loại sản phẩm bản tiếng Anh để trống — nhập tay hoặc bấm \"Dịch lại bằng AI\" ở dự án." }],
  };
}

const FIELD_PLANNERS: { name: "productTypes" | "featuredAmenities" | "products"; plan: (p: ProjectSource) => FieldPlan }[] = [
  { name: "productTypes", plan: planProductTypes },
  { name: "featuredAmenities", plan: planFeaturedAmenities },
  { name: "products", plan: planProducts },
];

/** Kế hoạch điền cho một dự án (thuần, không đọc/ghi DB): chỉ ô trống; giá trị độ tin cậy "trung bình" vào mục cần soát. */
export function planProject(project: ProjectSource): DocPlan {
  const plan: DocPlan = { id: project.id, title: project.title, isPublic: project.status === "published", patch: {}, fieldStates: {}, filled: [], review: [] };
  for (const { name, plan: planField } of FIELD_PLANNERS) {
    if (!isEmpty(project[name])) {
      plan.fieldStates[name] = "has-value";
      continue;
    }
    const result = planField(project);
    plan.fieldStates[name] = result.value === undefined ? "not-found" : "fill";
    if (result.value !== undefined) plan.patch[name] = result.value;
    plan.filled.push(...result.filled);
    plan.review.push(...result.review);
  }
  for (const value of plan.filled) {
    if (value.confidence !== "cao") plan.review.push({ field: value.field, note: `Soát: ${value.value} (trích từ ${value.source})`, snippet: value.snippet });
  }
  return plan;
}

const titleOf = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);

export function toProjectSource(doc: Project, categoryTitles: ReadonlyMap<string, string>): ProjectSource {
  const categoryId = typeof doc.category === "string" ? doc.category : (doc.category?.id ?? null);
  return {
    id: doc.id,
    title: titleOf(doc.title) ?? "(chưa có tên)",
    status: (doc as { status?: string | null }).status ?? null,
    category: categoryId ? (categoryTitles.get(categoryId) ?? null) : null,
    summary: doc.summary,
    overviewText: richTextToPlain(doc.overview),
    priceUnitTypes: (doc.priceTable ?? []).map((row) => row.unitType).filter((v): v is string => Boolean(titleOf(v))),
    amenities: (doc.amenities ?? []).flatMap((row) => [row.name, row.description ?? ""]).filter((v) => Boolean(titleOf(v))),
    nearby: (doc.nearbyAmenities ?? []).map((row) => ({ category: row.category, name: row.name ?? "" })),
    productTypes: doc.productTypes,
    featuredAmenities: doc.featuredAmenities,
    products: doc.products,
  };
}

const READ = { locale: "vi", fallbackLocale: false, depth: 0, limit: 0, pagination: false, overrideAccess: true } as const;

export const projectsBackfill: BackfillAdapter = {
  collection: "projects",
  label: "Dự án",
  fields: [
    { name: "productTypes", label: "Loại sản phẩm" },
    { name: "featuredAmenities", label: "Tiện ích nổi bật" },
    { name: "products", label: "Sản phẩm" },
  ],
  async plan(payload: Payload) {
    const categories = await payload.find({ collection: "categories", where: { scope: { equals: "project" } }, ...READ });
    const categoryTitles = new Map(categories.docs.map((c) => [String(c.id), titleOf((c as { title?: unknown }).title) ?? ""]));
    const projects = await payload.find({ collection: "projects", sort: "createdAt", ...READ });
    return (projects.docs as Project[]).map((doc) => planProject(toProjectSource(doc, categoryTitles)));
  },
};
