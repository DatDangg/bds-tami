import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Homepage, Project, PropertyPost, Service } from "../../payload-types";
import { offerNotEndedWhere } from "../content/offer-status";
import { findPublicList } from "../content/public-queries";
import { relationId } from "../payload/relation-id";
import { POST_CARD_FIELDS } from "../posts/post-queries";
import { FEATURED_OFFERS_MAX, type HomeBlockKey, type HomeDocs } from "./home-view";

/** Tối đa 6 dự án nổi bật (ERD §4.15, S01). */
export const FEATURED_PROJECTS_MAX = 6;
/** Dịch vụ không có trần ở global; trần hiển thị để hàng cuộn ngang không dài vô hạn. */
export const HOME_SERVICES_MAX = 12;

const NEWEST_FIRST = ["-publishedAt", "-createdAt"];

/** Trường thẻ slide dự án: có `summary`, bỏ `overview` và các richText dài. */
const HOME_PROJECT_FIELDS = { title: true, slug: true, summary: true, province: true, category: true, gallery: true } as const;

type Collection = "projects" | "services" | "property-posts";

function selectedIds(values: readonly (string | { id: string })[] | null | undefined, max: number): string[] {
  const ids = (values ?? []).flatMap((value) => {
    const id = relationId(value);
    return id ? [id] : [];
  });
  return [...new Set(ids)].slice(0, max);
}

/**
 * Đọc lại bản ghi được chọn tay như khách (kèm `publicWhere`: đã xuất bản, chưa xoá mềm, `/en` chỉ bản có EN) rồi xếp theo thứ tự admin chọn.
 * Không dùng bản ghi populate sẵn trong global: depth 1 chỉ có id ảnh, và không lọc bản ghi ẩn/chưa dịch.
 */
async function findSelected<T extends { id: string }>(
  payload: Payload,
  collection: Collection,
  locale: Locale,
  ids: readonly string[],
  options: { where?: Where; select?: Record<string, true> },
): Promise<T[]> {
  const where: Where = { and: [{ id: { in: [...ids] } }, ...(options.where ? [options.where] : [])] };
  const { docs } = await findPublicList<T>(payload, collection, locale, { where, limit: ids.length, depth: 1, ...(options.select ? { select: options.select } : {}) });
  const position = new Map(ids.map((id, index) => [id, index]));
  return [...docs].sort((a, b) => (position.get(String(a.id)) ?? 0) - (position.get(String(b.id)) ?? 0));
}

async function findFeaturedFallback<T>(
  payload: Payload,
  collection: Collection,
  locale: Locale,
  options: { where?: Where; limit: number; sort: string[]; select?: Record<string, true> },
): Promise<T[]> {
  const where: Where = { and: [{ isFeatured: { equals: true } }, ...(options.where ? [options.where] : [])] };
  const { docs } = await findPublicList<T>(payload, collection, locale, {
    where,
    sort: options.sort,
    limit: options.limit,
    depth: 1,
    ...(options.select ? { select: options.select } : {}),
  });
  return docs;
}

function loadProjects(payload: Payload, locale: Locale, homepage: Homepage): Promise<Project[]> {
  const ids = selectedIds(homepage.featuredProjects?.projects, FEATURED_PROJECTS_MAX);
  // Chọn tay thì theo lựa chọn; trống thì `isFeatured` mới nhất.
  return ids.length > 0
    ? findSelected<Project>(payload, "projects", locale, ids, { select: HOME_PROJECT_FIELDS })
    : findFeaturedFallback<Project>(payload, "projects", locale, { limit: FEATURED_PROJECTS_MAX, sort: NEWEST_FIRST, select: HOME_PROJECT_FIELDS });
}

function loadServices(payload: Payload, locale: Locale, homepage: Homepage): Promise<Service[]> {
  const ids = selectedIds(homepage.services?.items, HOME_SERVICES_MAX);
  return ids.length > 0 ? findSelected<Service>(payload, "services", locale, ids, {}) : Promise.resolve([]);
}

function loadOffers(payload: Payload, locale: Locale, homepage: Homepage, now: Date): Promise<PropertyPost[]> {
  const ids = selectedIds(homepage.featuredOffers?.posts, FEATURED_OFFERS_MAX);
  // Bài hết hạn không lên trang chủ (BR-06): `offerNotEndedWhere` cùng nguồn với `isOfferEnded`.
  const where = offerNotEndedWhere(now);
  return ids.length > 0
    ? findSelected<PropertyPost>(payload, "property-posts", locale, ids, { where, select: POST_CARD_FIELDS })
    : findFeaturedFallback<PropertyPost>(payload, "property-posts", locale, { where, limit: FEATURED_OFFERS_MAX, sort: NEWEST_FIRST, select: POST_CARD_FIELDS });
}

/** Chỉ truy vấn bản ghi của khối sẽ hiển thị (`visible`): khối tắt/ẩn không tốn truy vấn. Các truy vấn chạy song song. */
export async function loadHomeDocs(payload: Payload, locale: Locale, homepage: Homepage, visible: readonly HomeBlockKey[], now: Date): Promise<HomeDocs> {
  const has = (block: HomeBlockKey) => visible.includes(block);
  const [projects, services, offers] = await Promise.all([
    has("featuredProjects") ? loadProjects(payload, locale, homepage) : [],
    has("services") ? loadServices(payload, locale, homepage) : [],
    has("featuredOffers") ? loadOffers(payload, locale, homepage, now) : [],
  ]);
  return { projects, services, offers };
}
