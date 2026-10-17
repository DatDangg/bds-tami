import { readFileSync } from "node:fs";
import type { Payload } from "payload";

import { MAIN_MENU_KEYS } from "../src/components/layout/shell-data";

type Locale = "vi" | "en";
interface LayoutMessages {
  layout: {
    nav: { items: Record<string, string> };
    footer: { copyright: string; tagline: string; columns: { explore: string; about: string }; links: Record<string, string> };
  };
}

const messages = (locale: Locale) =>
  JSON.parse(readFileSync(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), "utf8")) as LayoutMessages;

const FOOTER_LINK_KEYS = {
  explore: ["projects", "rentals", "news"],
  about: ["careers", "contact", "privacy-policy", "terms-of-use"],
} as const;

type Row = { id?: string | null };

/** Menu + chân trang mặc định (bản vi và en) lấy từ messages để khớp menu cố định. Admin sửa được sau khi seed. */
function shellContent(locale: Locale) {
  const { layout } = messages(locale);
  const label = (key: string) => layout.nav.items[key] ?? layout.footer.links[key] ?? key;
  return {
    navItems: MAIN_MENU_KEYS.map((key) => ({ label: label(key), link: key })),
    columns: (Object.keys(FOOTER_LINK_KEYS) as (keyof typeof FOOTER_LINK_KEYS)[]).map((column) => ({
      title: layout.footer.columns[column],
      links: FOOTER_LINK_KEYS[column].map((key) => ({ label: label(key), link: key })),
    })),
    contactBlock: layout.footer.tagline,
    copyright: layout.footer.copyright,
  };
}

/** Gắn `id` dòng mảng của bản vi vào bản en để Payload cập nhật đúng dòng thay vì tạo dòng mới. */
const withIds = <T extends object>(rows: T[], saved: Row[] | null | undefined) => rows.map((row, index) => ({ ...row, id: saved?.[index]?.id }));

/**
 * Tạo header/footer mặc định cho dev/staging, idempotent: global nào đã có dữ liệu (bản vi) thì bỏ qua, không ghi đè sửa của admin.
 * Chạy bằng Local API nên hook làm mới cache không có tác dụng trong script này (server đang chạy tự làm mới sau tối đa 60 giây).
 */
export async function seedShellGlobals(payload: Payload): Promise<{ header: boolean; footer: boolean }> {
  const vi = shellContent("vi");
  const en = shellContent("en");
  const options = { overrideAccess: true, depth: 0 } as const;

  const header = await payload.findGlobal({ slug: "header", locale: "vi", fallbackLocale: false, ...options });
  const seedHeader = (header.navItems?.length ?? 0) === 0;
  if (seedHeader) {
    const saved = await payload.updateGlobal({ slug: "header", locale: "vi", data: { navItems: vi.navItems }, ...options });
    await payload.updateGlobal({ slug: "header", locale: "en", data: { navItems: withIds(en.navItems, saved.navItems) }, ...options });
  }

  const footer = await payload.findGlobal({ slug: "footer", locale: "vi", fallbackLocale: false, ...options });
  const seedFooter = (footer.columns?.length ?? 0) === 0;
  if (seedFooter) {
    const { columns, contactBlock, copyright } = vi;
    const saved = await payload.updateGlobal({ slug: "footer", locale: "vi", data: { columns, contactBlock, copyright }, ...options });
    const enColumns = withIds(en.columns, saved.columns).map((column, index) => ({
      ...column,
      links: withIds(column.links, saved.columns?.[index]?.links),
    }));
    await payload.updateGlobal({
      slug: "footer",
      locale: "en",
      data: { columns: enColumns, contactBlock: en.contactBlock, copyright: en.copyright },
      ...options,
    });
  }
  return { header: seedHeader, footer: seedFooter };
}
