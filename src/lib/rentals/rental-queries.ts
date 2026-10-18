import { NotFound, type Payload, type Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Media, Rental, Staff } from "../../payload-types";
import { findPublicBySlug, findPublicList } from "../content/public-queries";
import { relationId } from "../payload/relation-id";

/** Tin tương tự cuối trang chi tiết: 4 thẻ; tin đã thuê cần nhiều gợi ý hơn để khách còn lựa chọn (design-spec S07 "4-8 tin"). */
export const SIMILAR_RENTALS_COUNT = 4;
export const SIMILAR_RENTALS_COUNT_WHEN_RENTED = 8;

const RENTAL_SORT = ["-publishedAt", "-createdAt"];

/** Trường thẻ tin cho thuê dùng: bỏ mô tả richText, điều khoản, `searchText`... khỏi truy vấn danh sách. */
const RENTAL_CARD_FIELDS = {
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

/**
 * Tin tương tự: CÙNG danh mục và CÙNG tỉnh, loại tin hiện tại, mới nhất trước. Chỉ tin còn trống (`published`) kể cả khi trang đang xem là
 * tin đã thuê: không gợi ý một căn cũng đã cho thuê. Đi qua `findPublicList` nên `/en` chỉ gồm tin có bản EN. Thiếu cả danh mục lẫn tỉnh thì
 * không có gì để so khớp → rỗng.
 */
export async function findSimilarRentals(payload: Payload, locale: Locale, current: Pick<Rental, "id" | "category" | "province" | "status">): Promise<Rental[]> {
  const categoryId = relationId(current.category);
  const provinceId = relationId(current.province);
  const sameArea: Where[] = [
    ...(categoryId ? [{ category: { equals: categoryId } }] : []),
    ...(provinceId ? [{ province: { equals: provinceId } }] : []),
  ];
  if (sameArea.length === 0) return [];
  const { docs } = await findPublicList<Rental>(payload, "rentals", locale, {
    where: { and: [...sameArea, { id: { not_equals: current.id } }, { status: { equals: "published" } }] },
    sort: RENTAL_SORT,
    limit: current.status === "rented" ? SIMILAR_RENTALS_COUNT_WHEN_RENTED : SIMILAR_RENTALS_COUNT,
    depth: 1,
    select: RENTAL_CARD_FIELDS,
  });
  return withCoverImages(payload, docs);
}

/**
 * Thẻ chỉ cần ảnh ĐẦU: không populate cả thư viện (tối đa 8 tin × n ảnh mỗi lần dựng ISR). Đọc id thư viện ở `depth: 0` rồi lấy đúng các ảnh bìa
 * một lượt, với quyền khách (media công khai, `uploadedBy` bị chặn). Thẻ không có ảnh bìa dùng được thì `gallery` rỗng.
 */
async function withCoverImages(payload: Payload, docs: Rental[]): Promise<Rental[]> {
  if (docs.length === 0) return docs;
  const { docs: galleries } = await payload.find({
    collection: "rentals",
    where: { id: { in: docs.map((doc) => doc.id) } },
    depth: 0,
    pagination: false,
    overrideAccess: false,
    select: { gallery: true },
  });
  const coverIdByRental = new Map(galleries.map((entry) => [entry.id, relationId(entry.gallery?.[0])] as const));
  const coverIds = [...new Set([...coverIdByRental.values()].flatMap((id) => (id ? [id] : [])))];
  if (coverIds.length === 0) return docs;
  const { docs: covers } = await payload.find({ collection: "media", where: { id: { in: coverIds } }, depth: 0, pagination: false, overrideAccess: false });
  const coverById = new Map(covers.map((cover) => [cover.id, cover] as const));
  return docs.map((doc) => {
    const cover = coverById.get(coverIdByRental.get(doc.id) ?? "");
    return { ...doc, gallery: cover ? [cover] : [] };
  });
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
