import "server-only";

import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { ListingPageKey } from "../../globals/site-settings/listing-pages";
import type { Locale } from "../../i18n/routing";
import type { SiteSetting } from "../../payload-types";
import { logger } from "../logger";
import { getSiteSettings } from "./get-globals";
import { isInternalPathOrHttps } from "./internal-path";

export interface ListingLearnMoreView {
  eyebrow: string | undefined;
  title: string;
  /** Dòng 2 tiêu đề (màu vàng); chỉ có khi admin nhập. */
  titleAccent: string | undefined;
  description: string | undefined;
  image: MediaImage | undefined;
  videoUrl: string | undefined;
  /** Nút chỉ có khi đủ chữ (ngôn ngữ đang xem) + đường dẫn hợp lệ. */
  cta: { label: string; href: string } | undefined;
}

export interface ListingPageContent {
  quickSearch: string[];
  learnMore: ListingLearnMoreView | null;
  faqs: { question: string; answer: string }[];
  showStrengths: boolean;
}

type ListingSettings = Pick<SiteSetting, "listingPages" | "showProjectStrengths">;

const filled = (value: string | null | undefined): string | undefined => value?.trim() || undefined;

function toLearnMore(block: NonNullable<NonNullable<SiteSetting["listingPages"]>[ListingPageKey]>["learnMore"]): ListingLearnMoreView | null {
  const title = filled(block?.title);
  if (!block || !title) return null;
  const image = block.image && typeof block.image === "object" && block.image.url ? block.image : undefined;
  const label = filled(block.ctaLabel);
  const href = filled(block.ctaHref);
  return {
    eyebrow: filled(block.eyebrow),
    title,
    titleAccent: filled(block.titleAccent),
    description: filled(block.description),
    image,
    videoUrl: filled(block.videoUrl),
    cta: label && href && isInternalPathOrHttps(href) ? { label, href } : undefined,
  };
}

/**
 * Nội dung riêng của trang danh sách (BL-052) ở ngôn ngữ đang xem. Global đọc với `fallbackLocale: false` nên ở `/en` hàng thiếu chữ EN
 * bị bỏ (không lấy chữ Việt), khối "Tìm hiểu thêm" thiếu tiêu đề → `null`. `/du-an` dùng cờ `showProjectStrengths` sẵn có.
 * Thuần, không đọc DB.
 */
export function resolveListingPageContent(settings: ListingSettings | null | undefined, key: ListingPageKey): ListingPageContent {
  const page = settings?.listingPages?.[key];
  const flag = key === "projects" ? settings?.showProjectStrengths : page && "showStrengths" in page ? page.showStrengths : undefined;
  return {
    quickSearch: (page?.quickSearch ?? []).flatMap((row) => filled(row.label) ?? []),
    learnMore: toLearnMore(page?.learnMore),
    faqs: (page?.faqs ?? []).flatMap((row) => {
      const question = filled(row.question);
      const answer = filled(row.answer);
      return question && answer ? [{ question, answer }] : [];
    }),
    showStrengths: flag !== false,
  };
}

/** Đọc `site-settings` qua cache global sẵn có; global lỗi → nội dung trống (trang không vỡ), dải Điểm mạnh theo mặc định bật. */
export async function loadListingPageContent(locale: Locale, key: ListingPageKey): Promise<ListingPageContent> {
  try {
    return resolveListingPageContent(await getSiteSettings(locale), key);
  } catch (error) {
    logger.warn({ err: error, key }, "Không đọc được site-settings cho nội dung trang danh sách, bỏ các khối");
    return resolveListingPageContent(null, key);
  }
}
