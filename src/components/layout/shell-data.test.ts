import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import vi from "@/i18n/messages/vi.json";
import {
  buildContact,
  buildFooterColumns,
  buildNavItems,
  buildSocialLinks,
  fixedMenuItems,
  MAIN_MENU_KEYS,
  toTelHref,
} from "./shell-data";

const viLabels = vi.layout.nav.items;
const enLabels = en.layout.nav.items;

const fullCmsMenu = MAIN_MENU_KEYS.map((key) => ({ label: `CMS ${key}`, link: key, children: [] }));

describe("menu chính", () => {
  it("menu cố định có đúng 7 mục theo thứ tự, không có Mua bán", () => {
    const items = fixedMenuItems("vi", viLabels);
    expect(items.map((item) => item.label)).toEqual([
      "Trang chủ",
      "Dự án",
      "Cho thuê",
      "Đăng tin BĐS",
      "Tin tức",
      "Tuyển dụng",
      "Liên hệ",
    ]);
    expect(items.map((item) => item.href)).toEqual(["/", "/du-an", "/cho-thue", "/tin-bds", "/tin-tuc", "/tuyen-dung", "/lien-he"]);
    expect(JSON.stringify(items)).not.toMatch(/mua bán/i);
  });

  it("EN thiếu bản EN trong global (nhãn rỗng/undefined) thì dùng menu cố định từ en.json, không có chữ tiếng Việt", () => {
    const cmsWithoutEnglish = MAIN_MENU_KEYS.map((key) => ({ label: undefined, link: key }));
    const items = buildNavItems(cmsWithoutEnglish, "en", enLabels);
    expect(items.map((item) => item.label)).toEqual([
      "Home",
      "Projects",
      "For rent",
      "Post your property",
      "News",
      "Careers",
      "Contact",
    ]);
    expect(items.map((item) => item.href)).toEqual([
      "/en",
      "/en/projects",
      "/en/for-rent",
      "/en/property-news",
      "/en/news",
      "/en/careers",
      "/en/contact",
    ]);
    expect(buildNavItems(null, "en", enLabels)).toEqual(items);
    expect(buildNavItems([], "en", enLabels)).toEqual(items);
  });

  it("menu CMS đầy đủ thì dùng nhãn CMS, link giải theo ngôn ngữ", () => {
    const items = buildNavItems(fullCmsMenu, "en", enLabels);
    expect(items[2]).toMatchObject({ label: "CMS rentals", href: "/en/for-rent", external: false });
  });

  it("chỉ thiếu nhãn một mục thì dùng cả menu cố định (menu không bị cụt)", () => {
    const partial = fullCmsMenu.map((item, index) => (index === 3 ? { ...item, label: "  " } : item));
    expect(buildNavItems(partial, "en", enLabels)).toEqual(fixedMenuItems("en", enLabels));
  });

  it("link không hợp lệ (javascript:) làm menu CMS bị loại, không render link nguy hiểm", () => {
    const bad = fullCmsMenu.map((item, index) => (index === 0 ? { ...item, link: "javascript:alert(1)" } : item));
    const items = buildNavItems(bad, "vi", viLabels);
    expect(JSON.stringify(items)).not.toContain("javascript:");
    expect(items).toEqual(fixedMenuItems("vi", viLabels));
  });

  it("mục con thiếu nhãn bị bỏ riêng, URL ngoài được đánh dấu external", () => {
    const withChildren = fullCmsMenu.map((item, index) =>
      index === 1
        ? {
            ...item,
            children: [
              { label: "Ngoài", link: "https://example.com/a" },
              { label: "", link: "projects" },
            ],
          }
        : item,
    );
    const items = buildNavItems(withChildren, "vi", viLabels);
    expect(items[1]?.children).toEqual([{ label: "Ngoài", href: "https://example.com/a", external: true }]);
  });
});

describe("footer", () => {
  const fixed = [{ title: "Cố định", links: [{ label: "X", href: "/x", external: false }] }];

  it("không có cột (EN chưa dịch) thì dùng cột cố định", () => {
    expect(buildFooterColumns(null, "en", fixed)).toBe(fixed);
    expect(buildFooterColumns([{ title: undefined, links: [{ label: "A", link: "news" }] }], "en", fixed)).toBe(fixed);
    expect(buildFooterColumns([{ title: "T", links: [{ label: undefined, link: "news" }] }], "en", fixed)).toBe(fixed);
  });

  it("cột đầy đủ thì dùng CMS", () => {
    const columns = buildFooterColumns([{ title: "Khám phá", links: [{ label: "Tin tức", link: "news" }] }], "vi", fixed);
    expect(columns).toEqual([{ title: "Khám phá", links: [{ label: "Tin tức", href: "/tin-tuc", external: false }] }]);
  });

  it("liên hệ: chỉ giữ trường có giá trị, hotline thành tel:", () => {
    expect(buildContact({ hotline: " 0901 234 567 ", email: "", address: null })).toEqual({
      hotline: { label: "0901 234 567", telHref: "tel:0901234567" },
    });
    expect(buildContact(null)).toEqual({});
    expect(toTelHref("+84 (28) 3823-4567")).toBe("tel:+842838234567");
    expect(toTelHref("không có số")).toBe("");
  });

  it("mạng xã hội: chỉ http(s)", () => {
    expect(
      buildSocialLinks([
        { platform: "facebook", url: "https://facebook.com/tami" },
        { platform: "other", url: "javascript:alert(1)" },
      ]),
    ).toEqual([{ platform: "facebook", url: "https://facebook.com/tami" }]);
  });
});
