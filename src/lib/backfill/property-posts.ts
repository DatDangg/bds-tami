import type { Payload } from "payload";

import type { PropertyPost } from "../../payload-types";
import { hasPostOffer } from "../posts/post-kind";
import { FIELD_PLANNERS, NO_FLOORS_TYPES, NONE, type TextSource } from "./property-post-extract";
import { richTextToPlain } from "./text";
import type { BackfillAdapter, DocPlan } from "./types";

/**
 * Bộ trích dữ liệu cũ cho Tin BĐS (BL-052 P3-T05): loại hình, diện tích, phòng ngủ / tắm, hướng nhà, mặt tiền, số tầng, địa chỉ từ
 * tiêu đề ("cao") + tóm tắt / nội dung ("trung bình" → mục cần soát). Chỉ điền ô trống. **Bỏ qua tin ưu đãi / voucher** (`hasPostOffer`: `offer.endAt` hợp lệ
 * hoặc `offer.voucherCode`). Giá trị mơ hồ (các nguồn cho nhiều giá trị khác nhau, chỉ có khoảng "75 – 120 m²", hướng ban công…) → không điền,
 * ghi "cần soát". Không trích `handoverCondition` / `location` (ngoài phạm vi task). Regex + quy tắc từng trường: `property-post-extract.ts`.
 */

export interface PropertyPostSource {
  id: string;
  title: string;
  status?: string | null;
  excerpt?: string | null;
  contentText: string;
  offer?: PropertyPost["offer"];
  propertyType?: string | null;
  areaM2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  houseDirection?: string | null;
  frontageM?: number | null;
  floors?: number | null;
  address?: string | null;
}

const sourcesOf = (post: PropertyPostSource): TextSource[] => [
  { label: "tiêu đề", text: post.title, confidence: "cao" },
  { label: "tóm tắt", text: post.excerpt ?? "", confidence: "trung bình" },
  { label: "nội dung", text: post.contentText, confidence: "trung bình" },
];

const hasValue = (value: unknown) => (typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined);

/**
 * Kế hoạch điền cho một tin (thuần, không đọc/ghi DB): chỉ ô trống; giá trị độ tin cậy "trung bình" vào mục cần soát.
 * Tin ưu đãi / voucher không mô tả một BĐS cụ thể → bỏ qua cả tin; phân loại dùng chung `hasPostOffer` (thẻ + chi tiết, BL-055 C-8):
 * `endAt` không parse được thành ngày thì không tính là ưu đãi.
 */
export function planPropertyPost(post: PropertyPostSource): DocPlan {
  const plan: DocPlan = { id: post.id, title: post.title, isPublic: post.status === "published", patch: {}, fieldStates: {}, filled: [], review: [] };
  if (hasPostOffer(post)) return { ...plan, skipped: "tin ưu đãi / voucher" };
  const sources = sourcesOf(post);
  for (const { name, plan: planField } of FIELD_PLANNERS) {
    if (hasValue(post[name])) {
      plan.fieldStates[name] = "has-value";
      continue;
    }
    const type = (plan.patch.propertyType as string | undefined) ?? post.propertyType ?? "";
    const result = name === "floors" && NO_FLOORS_TYPES.has(type) ? NONE : planField(sources);
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

export function toPropertyPostSource(doc: PropertyPost): PropertyPostSource {
  return {
    id: doc.id,
    title: typeof doc.title === "string" && doc.title.trim() ? doc.title : "(chưa có tiêu đề)",
    status: doc.status,
    excerpt: doc.excerpt,
    contentText: richTextToPlain(doc.content),
    offer: doc.offer,
    propertyType: doc.propertyType,
    areaM2: doc.areaM2,
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    houseDirection: doc.houseDirection,
    frontageM: doc.frontageM,
    floors: doc.floors,
    address: doc.address,
  };
}

export const propertyPostsBackfill: BackfillAdapter = {
  collection: "property-posts",
  label: "Tin BĐS",
  fields: [
    { name: "propertyType", label: "Loại hình" },
    { name: "areaM2", label: "Diện tích (m²)" },
    { name: "bedrooms", label: "Số phòng ngủ" },
    { name: "bathrooms", label: "Số phòng tắm" },
    { name: "houseDirection", label: "Hướng nhà" },
    { name: "frontageM", label: "Mặt tiền (m)" },
    { name: "floors", label: "Số tầng" },
    { name: "address", label: "Địa chỉ" },
  ],
  async plan(payload: Payload) {
    const posts = await payload.find({ collection: "property-posts", sort: "createdAt", locale: "vi", fallbackLocale: false, depth: 0, limit: 0, pagination: false, overrideAccess: true });
    return (posts.docs as PropertyPost[]).map((doc) => planPropertyPost(toPropertyPostSource(doc)));
  },
};
