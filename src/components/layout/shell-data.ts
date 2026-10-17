import { isHttpUrl, type PageLinkKey, resolveNavLink } from "@/lib/content/nav-link";
import type { Locale } from "@/i18n/routing";

/**
 * Chuyển dữ liệu global `header` / `footer` / `site-settings` thành view model CHỈ gồm trường hiển thị. Client component
 * (MobileMenu...) nhận đúng view model này, không bao giờ nhận doc global nguyên (tránh đưa trường nội bộ vào bundle client).
 * Thuần (không import Payload/Next) nên test được mà không cần DB.
 */

/** Bảy mục menu chính theo design-spec §2.1 (không có "Mua bán"). Cũng là menu cố định khi global thiếu dữ liệu cho ngôn ngữ. */
export const MAIN_MENU_KEYS = [
  "home",
  "projects",
  "rentals",
  "property-posts",
  "news",
  "careers",
  "contact",
] as const satisfies readonly PageLinkKey[];
export type MainMenuKey = (typeof MAIN_MENU_KEYS)[number];

export interface LinkView {
  label: string;
  href: string;
  external: boolean;
}

export interface NavItemView extends LinkView {
  children: LinkView[];
}

export interface FooterColumnView {
  title: string;
  links: LinkView[];
}

export interface FooterContactView {
  hotline?: { label: string; telHref: string };
  email?: string;
  address?: string;
}

export interface SocialLinkView {
  platform: string;
  url: string;
}

/** Ba đích của nút liên hệ nổi (FR-PUB-12). Thiếu đích nào thì ẩn nút đó. */
export interface FloatingContactView {
  hotline?: { label: string; telHref: string };
  zaloUrl?: string;
  fanpageUrl?: string;
}

export interface ShellView {
  navItems: NavItemView[];
  contact: FooterContactView;
  floatingContact: FloatingContactView;
  footer: {
    columns: FooterColumnView[];
    tagline: string;
    copyright: string;
    socials: SocialLinkView[];
  };
}

interface RawLink {
  label?: string | null;
  link?: string | null;
}
interface RawNavItem extends RawLink {
  children?: RawLink[] | null;
}
interface RawFooterColumn {
  title?: string | null;
  links?: RawLink[] | null;
}

function toLinkView(raw: RawLink, locale: Locale): LinkView | null {
  const label = raw.label?.trim();
  const target = resolveNavLink(raw.link, locale);
  return label && target ? { label, ...target } : null;
}

function toLinkViews(raws: readonly RawLink[] | null | undefined, locale: Locale): LinkView[] {
  return (raws ?? []).flatMap((raw) => toLinkView(raw, locale) ?? []);
}

/** Menu cố định: nhãn lấy từ file messages của CHÍNH ngôn ngữ đang xem (không bao giờ mượn chữ tiếng Việt cho bản EN). */
export function fixedMenuItems(locale: Locale, labels: Record<MainMenuKey, string>): NavItemView[] {
  return MAIN_MENU_KEYS.map((key) => ({
    label: labels[key],
    href: resolveNavLink(key, locale)?.href ?? "/",
    external: false,
    children: [],
  }));
}

/**
 * Dùng menu trong CMS chỉ khi nó ĐẦY ĐỦ cho ngôn ngữ này: có mục và mọi mục có nhãn + link hợp lệ. Thiếu bản EN
 * (hoặc một phần nhãn EN) thì dùng cả menu cố định, tránh menu EN cụt mất vài trang (Spec § Quy tắc biên, BR-07).
 * Mục con thiếu nhãn/link bị bỏ riêng từng mục.
 */
export function buildNavItems(
  navItems: readonly RawNavItem[] | null | undefined,
  locale: Locale,
  fixedLabels: Record<MainMenuKey, string>,
): NavItemView[] {
  const views = (navItems ?? []).map((item) => {
    const view = toLinkView(item, locale);
    return view ? { ...view, children: toLinkViews(item.children, locale) } : null;
  });
  const complete = views.length > 0 && views.every((view) => view !== null);
  return complete ? views : fixedMenuItems(locale, fixedLabels);
}

/** Cột footer: cùng quy tắc "đầy đủ hoặc dùng cột cố định". Cột cần tiêu đề và ít nhất một link hợp lệ. */
export function buildFooterColumns(
  columns: readonly RawFooterColumn[] | null | undefined,
  locale: Locale,
  fixedColumns: FooterColumnView[],
): FooterColumnView[] {
  const views = (columns ?? []).map((column) => {
    const title = column.title?.trim();
    const links = toLinkViews(column.links, locale);
    return title && links.length > 0 ? { title, links } : null;
  });
  const complete = views.length > 0 && views.every((view) => view !== null);
  return complete ? views : fixedColumns;
}

/** Số điện thoại → `tel:` (chỉ giữ chữ số và dấu + đầu). Rỗng nếu không có chữ số nào. */
export function toTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  const normalized = digits.startsWith("+") ? `+${digits.slice(1).replace(/\+/g, "")}` : digits.replace(/\+/g, "");
  return /\d/.test(normalized) ? `tel:${normalized}` : "";
}

export function buildContact(settings: { hotline?: string | null; email?: string | null; address?: string | null } | null): FooterContactView {
  const hotline = settings?.hotline?.trim();
  const telHref = hotline ? toTelHref(hotline) : "";
  const email = settings?.email?.trim();
  const address = settings?.address?.trim();
  return {
    ...(hotline && telHref ? { hotline: { label: hotline, telHref } } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address } : {}),
  };
}

/** Chỉ nhận http(s): URL này thành `href`, chặn `javascript:`... */
export function buildSocialLinks(links: readonly { platform: string; url: string }[] | null | undefined): SocialLinkView[] {
  return (links ?? []).flatMap((link) => (isHttpUrl(link.url) ? [{ platform: link.platform, url: link.url }] : []));
}

/** Nút nổi: hotline → `tel:`; Zalo/Fanpage chỉ nhận http(s) (URL này thành `href`, chặn `javascript:`...). */
export function buildFloatingContact(
  settings: { hotline?: string | null; zaloUrl?: string | null; fanpageUrl?: string | null } | null,
): FloatingContactView {
  const hotline = settings?.hotline?.trim();
  const telHref = hotline ? toTelHref(hotline) : "";
  const zaloUrl = settings?.zaloUrl?.trim();
  const fanpageUrl = settings?.fanpageUrl?.trim();
  return {
    ...(hotline && telHref ? { hotline: { label: hotline, telHref } } : {}),
    ...(zaloUrl && isHttpUrl(zaloUrl) ? { zaloUrl } : {}),
    ...(fanpageUrl && isHttpUrl(fanpageUrl) ? { fanpageUrl } : {}),
  };
}
