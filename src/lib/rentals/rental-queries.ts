import { NotFound, type Payload, type Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Media, Rental, Staff } from "../../payload-types";
import { findPublicBySlug, findPublicList } from "../content/public-queries";
import { relationId } from "../payload/relation-id";

/** Tin tương tự cuối trang chi tiết: 4 thẻ; tin đã thuê cần nhiều gợi ý hơn để khách còn lựa chọn (design-spec S07 "4-8 tin"). */
export const SIMILAR_RENTALS_COUNT = 4;
export const SIMILAR_RENTALS_COUNT_WHEN_RENTED = 8;

/** Giá tin tương tự lệch tối đa ±30% so với tin đang xem (design-spec S07, D2 đã duyệt 2026-10-18). */
export const SIMILAR_PRICE_TOLERANCE = 0.3;

/** Ảnh ứng viên cho thẻ: lấy vài ảnh đầu để thẻ vẫn có ảnh khi ảnh đầu không dùng được (bị xoá, không phải ảnh, thiếu URL). */
const COVER_CANDIDATES = 3;

const RENTAL_SORT = ["-publishedAt", "-createdAt"];

/** Trường thẻ tin cho thuê dùng: bỏ mô tả richText, điều khoản, `searchText`... khỏi truy vấn danh sách. */
export const RENTAL_CARD_FIELDS = {
  code: true,
  title: true,
  slug: true,
  status: true,
  province: true,
  ward: true,
  priceMonthlyVnd: true,
  priceNegotiable: true,
  areaM2: true,
  bedrooms: true,
  bathrooms: true,
} as const;

/** Tin cho thuê công khai (`published` hoặc `rented`) theo slug của ngôn ngữ đang xem; `depth: 1` populate ảnh, tỉnh, phường, danh mục, dự án. */
export function findPublicRentalBySlug(payload: Payload, locale: Locale, slug: string): Promise<Rental | null> {
  return findPublicBySlug<Rental>(payload, "rentals", locale, slug, { depth: 1 });
}

type SimilarSource = Pick<Rental, "id" | "category" | "province" | "status"> & Partial<Pick<Rental, "priceMonthlyVnd" | "priceNegotiable">>;

/** Khoảng giá ±30% quanh giá tin hiện tại; tin thương lượng / chưa có giá thì không có khoảng giá để so. */
function priceBand(current: SimilarSource): Where | null {
  const price = current.priceMonthlyVnd;
  if (current.priceNegotiable === true || typeof price !== "number" || price <= 0) return null;
  return {
    priceMonthlyVnd: { greater_than_equal: Math.floor(price * (1 - SIMILAR_PRICE_TOLERANCE)), less_than_equal: Math.ceil(price * (1 + SIMILAR_PRICE_TOLERANCE)) },
  };
}

/**
 * Tin tương tự: CÙNG danh mục và CÙNG tỉnh, giá ±30% (D2), loại tin hiện tại, mới nhất trước. Chỉ ra dưới `SIMILAR_RENTALS_COUNT` tin theo giá thì
 * BỎ điều kiện giá (giữ danh mục + tỉnh) để khối không trống/quá thưa. Chỉ tin còn trống (`published`) kể cả khi trang đang xem là tin đã thuê:
 * không gợi ý một căn cũng đã cho thuê. Đi qua `findPublicList` nên `/en` chỉ gồm tin có bản EN. Thiếu cả danh mục lẫn tỉnh thì không có gì
 * để so khớp → rỗng.
 */
export async function findSimilarRentals(payload: Payload, locale: Locale, current: SimilarSource): Promise<Rental[]> {
  const categoryId = relationId(current.category);
  const provinceId = relationId(current.province);
  const sameArea: Where[] = [
    ...(categoryId ? [{ category: { equals: categoryId } }] : []),
    ...(provinceId ? [{ province: { equals: provinceId } }] : []),
  ];
  if (sameArea.length === 0) return [];
  const find = (extra: Where[]) =>
    findPublicList<Rental>(payload, "rentals", locale, {
      where: { and: [...sameArea, ...extra, { id: { not_equals: current.id } }, { status: { equals: "published" } }] },
      sort: RENTAL_SORT,
      limit: current.status === "rented" ? SIMILAR_RENTALS_COUNT_WHEN_RENTED : SIMILAR_RENTALS_COUNT,
      depth: 1,
      select: RENTAL_CARD_FIELDS,
    });
  const band = priceBand(current);
  let { docs } = await find(band ? [band] : []);
  if (band && docs.length < SIMILAR_RENTALS_COUNT) ({ docs } = await find([]));
  return withCoverImages(payload, docs, locale);
}

/**
 * Thẻ chỉ cần vài ảnh ĐẦU (`COVER_CANDIDATES`): không populate cả thư viện (tối đa 8 tin × n ảnh mỗi lần dựng ISR). Đọc id thư viện ở `depth: 0` rồi
 * lấy các ảnh ứng viên một lượt, với quyền khách (media công khai, `uploadedBy` bị chặn) và `alt` đúng `locale` đang xem. `gallery` của thẻ giữ
 * thứ tự thư viện và chỉ gồm ảnh đọc được: ảnh đầu không còn thì ảnh kế tiếp thế chỗ (`toRentalCardData` lấy ảnh dùng được đầu tiên); không ảnh nào
 * dùng được thì `gallery` rỗng.
 */
export async function withCoverImages(payload: Payload, docs: Rental[], locale: Locale): Promise<Rental[]> {
  if (docs.length === 0) return docs;
  const { docs: galleries } = await payload.find({
    collection: "rentals",
    where: { id: { in: docs.map((doc) => doc.id) } },
    depth: 0,
    pagination: false,
    overrideAccess: false,
    select: { gallery: true },
  });
  const candidateIdsByRental = new Map(
    galleries.map((entry) => [entry.id, (entry.gallery ?? []).flatMap((item) => relationId(item) ?? []).slice(0, COVER_CANDIDATES)] as const),
  );
  const candidateIds = [...new Set([...candidateIdsByRental.values()].flat())];
  if (candidateIds.length === 0) return docs;
  const { docs: covers } = await payload.find({
    collection: "media",
    where: { id: { in: candidateIds } },
    locale,
    fallbackLocale: false,
    depth: 0,
    pagination: false,
    overrideAccess: false,
  });
  const coverById = new Map(covers.map((cover) => [cover.id, cover] as const));
  return docs.map((doc) => ({ ...doc, gallery: (candidateIdsByRental.get(doc.id) ?? []).flatMap((id) => coverById.get(id) ?? []) }));
}

/**
 * Trường khách không đọc được qua `access.read` mà trang cần: người phụ trách (`author`, `staff` đóng với khách) và toạ độ khi tin ẩn
 * địa chỉ chính xác. Chỉ ĐỌC server-side với `overrideAccess`, `select` đúng hai trường; nơi gọi tuyệt đối không đưa `location` thô vào
 * props Client Component (phải qua `approximateLocation`, contract layer-2-task-08).
 */
export async function findRentalPrivateFields(payload: Payload, id: string): Promise<{ authorId: string | null; location: [number, number] | null }> {
  const doc = (await payload.findByID({
    collection: "rentals",
    id,
    depth: 0,
    overrideAccess: true,
    trash: false,
    select: { author: true, location: true },
  })) as Pick<Rental, "author" | "location">;
  return { authorId: relationId(doc.author), location: doc.location ?? null };
}

/** Sale phụ trách được hiện cho khách: chỉ tên, SĐT, ảnh. */
export type SaleContact = Pick<Staff, "fullName" | "phone"> & { avatar: Media | null };

/**
 * Hồ sơ công khai của sale phụ trách. `staff` đóng với khách nên đọc bằng `overrideAccess` với `depth: 0` + `select` chỉ 4 trường (không email, vai trò,
 * hash...). Ảnh đại diện KHÔNG populate theo staff (sẽ bỏ qua field access của media, lộ `uploadedBy`): đọc lại như khách theo `locale`
 * (đúng `alt` vi/en, `uploadedBy` bị chặn). Sale khoá (`active = false`) hoặc đã xoá → `null` để trang thay bằng hotline chung và không hiện tên
 * (SPECIFICATIONS § Quy tắc biên).
 */
export async function findActiveSaleContact(payload: Payload, locale: Locale, authorId: string | null): Promise<SaleContact | null> {
  if (!authorId) return null;
  try {
    const staff = (await payload.findByID({
      collection: "staff",
      id: authorId,
      depth: 0,
      overrideAccess: true,
      select: { fullName: true, phone: true, avatar: true, active: true },
    })) as Pick<Staff, "fullName" | "phone" | "avatar" | "active">;
    if (staff.active !== true) return null;
    return { fullName: staff.fullName, phone: staff.phone, avatar: await findPublicAvatar(payload, locale, relationId(staff.avatar)) };
  } catch (error) {
    // Sale đã bị xoá hẳn: coi như không còn người phụ trách. Lỗi khác (DB...) để trang tự xử lý.
    if (error instanceof NotFound) return null;
    throw error;
  }
}

/** Ảnh đại diện đọc với quyền khách; ảnh đã xoá → `null` (không có avatar thì vẫn hiện sale). */
async function findPublicAvatar(payload: Payload, locale: Locale, mediaId: string | null): Promise<Media | null> {
  if (!mediaId) return null;
  try {
    return await payload.findByID({ collection: "media", id: mediaId, locale, depth: 0, overrideAccess: false });
  } catch (error) {
    if (error instanceof NotFound) return null;
    throw error;
  }
}
