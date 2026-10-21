import type { CollapsibleField, Field, TabsField } from "payload";
import { describe, expect, it } from "vitest";

import { createHomepage } from "./Homepage";
import { enabledField } from "./homepage/blocks";

/** Đường dẫn dữ liệu của cây field (tab/row/collapsible không tên không thêm cấp; group/array thêm cấp theo `name`). */
function dataPaths(fields: readonly Field[], prefix = ""): string[] {
  return fields.flatMap((field): string[] => {
    if (field.type === "row" || field.type === "collapsible") return dataPaths(field.fields, prefix);
    if (field.type === "tabs") return field.tabs.flatMap((tab) => ("name" in tab && tab.name ? dataPaths(tab.fields, `${prefix}${tab.name}.`) : dataPaths(tab.fields, prefix)));
    if (!("name" in field) || !field.name) return [];
    const path = `${prefix}${field.name}`;
    return field.type === "group" || field.type === "array" ? [path, ...dataPaths(field.fields, `${path}.`)] : [path];
  });
}

/** Danh sách đường dẫn global Trang chủ TRƯỚC BL-051 A14 (14 tab). Phải giữ y hệt: đổi = đổi schema/migration. */
const PATHS_BEFORE_A14 = [
  "announcementBar",
  "announcementBar.enabled",
  "announcementBar.text",
  "announcementBar.link",
  "hero",
  "hero.eyebrow",
  "hero.slides",
  "hero.slides.image",
  "hero.slides.video",
  "hero.slides.title",
  "hero.slides.titleAccent",
  "hero.slides.subtitle",
  "hero.slides.ctaLabel",
  "hero.slides.ctaLink",
  "hero.caption",
  "heroSearch",
  "heroSearch.enabled",
  "heroSearch.placeholder",
  "heroSearch.chipProjects",
  "strengths",
  "strengths.enabled",
  "strengths.items",
  "strengths.items.icon",
  "strengths.items.title",
  "strengths.items.description",
  "about",
  "about.enabled",
  "about.eyebrow",
  "about.title",
  "about.titleAccent",
  "about.content",
  "about.image",
  "about.secondaryImage",
  "about.imageCaption",
  "about.videoUrl",
  "about.videoLabel",
  "about.stats",
  "about.stats.icon",
  "about.stats.value",
  "about.stats.label",
  "about.ctaLabel",
  "about.ctaLink",
  "about.decorImage",
  "featuredProjects",
  "featuredProjects.enabled",
  "featuredProjects.eyebrow",
  "featuredProjects.title",
  "featuredProjects.description",
  "featuredProjects.projects",
  "services",
  "services.enabled",
  "services.title",
  "services.items",
  "featuredOffers",
  "featuredOffers.enabled",
  "featuredOffers.title",
  "featuredOffers.posts",
  "rentals",
  "rentals.enabled",
  "rentals.title",
  "rentals.categories",
  "news",
  "news.enabled",
  "news.title",
  "news.intro",
  "news.posts",
  "partners",
  "partners.enabled",
  "partners.title",
  "ctaBanner",
  "ctaBanner.enabled",
  "ctaBanner.title",
  "ctaBanner.description",
  "ctaBanner.ctaLabel",
  "ctaBanner.ctaLink",
  "ctaBanner.backgroundImage",
  "ctaBanner.image",
  "ctaBanner.secondaryLabel",
  "ctaBanner.secondaryLink",
  "blockOrder",
  "blockOrder.block",
  "seo",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImage",
  "seo.noindex",
  "seo.canonical",
  "translation",
  "translation.status",
  "translation.enSource",
  "translation.viChangedAfterManual",
  "translation.sourceHash",
  "translation.translatedAt",
  "translation.model",
  "translation.lastError",
  "translation.translationSummary",
  "translation.retranslateAction",
];

const homepageFields = createHomepage().fields;
const tabs = (homepageFields[0] as TabsField).tabs;

describe("Global Trang chủ: 5 tab không tên (BL-051 A14)", () => {
  it("chỉ một bộ tab ở gốc, đúng 5 tab theo luồng trang, không tab nào có name", () => {
    expect(homepageFields).toHaveLength(1);
    expect(homepageFields[0]?.type).toBe("tabs");
    expect(tabs.map((tab) => tab.label)).toEqual(["Đầu trang & Banner", "Giới thiệu & Uy tín", "Sản phẩm & Tin nổi bật", "Chuyển đổi & Bố cục", "SEO & Đa ngôn ngữ"]);
    expect(tabs.some((tab) => "name" in tab && tab.name)).toBe(false);
  });

  it("danh sách đường dẫn dữ liệu y hệt trước khi gom tab (không đổi schema)", () => {
    const after = dataPaths(homepageFields);
    expect(after).toHaveLength(PATHS_BEFORE_A14.length);
    expect([...after].sort()).toEqual([...PATHS_BEFORE_A14].sort());
  });

  it("mỗi tab gồm đúng các khối theo spec, mỗi khối là collapsible có tiêu đề (khối đầu mở, khối sau thu gọn), nhãn group/array bỏ để không lặp tiêu đề", () => {
    const blockTitles = tabs.map((tab) => tab.fields.filter((field) => field.type === "collapsible").map((field) => (field as CollapsibleField).label));
    expect(blockTitles).toEqual([
      ["Thanh thông báo (đầu trang chủ)", "Banner đầu trang", "Ô tìm kiếm trên banner"],
      ["Giới thiệu", "Điểm mạnh", "Đối tác"],
      ["Dự án nổi bật", "Cho thuê", "Dịch vụ", "Ưu đãi nổi bật", "Tin tức"],
      ["Khối mời tư vấn"],
      ["SEO", "Bản dịch tiếng Anh"],
    ]);
    for (const tab of tabs) {
      tab.fields.filter((field) => field.type === "collapsible").forEach((field, index) => {
        const block = field as CollapsibleField;
        expect(block.type).toBe("collapsible");
        expect(block.fields).toHaveLength(1);
        expect((block.fields[0] as { label?: unknown }).label).toBe(false);
        expect(block.admin?.initCollapsed).toBe(index > 0);
      });
    }
  });

  it("công tắc bật/tắt khối đổi nhãn thành \"Hiện khối này trên web\", giữ name/kiểu/mặc định; mọi khối có công tắc vẫn dùng nhãn đó", () => {
    expect(enabledField).toMatchObject({ name: "enabled", type: "checkbox", label: "Hiện khối này trên web", defaultValue: true });
    const toggleLabels: unknown[] = [];
    const walk = (fields: readonly Field[]): void => {
      for (const field of fields) {
        if ("name" in field && field.name === "enabled" && field.type === "checkbox") toggleLabels.push(field.label);
        if ("fields" in field) walk(field.fields);
        if (field.type === "tabs") field.tabs.forEach((tab) => walk(tab.fields));
      }
    };
    walk(homepageFields);
    expect(toggleLabels).toHaveLength(11);
    expect(new Set(toggleLabels)).toEqual(new Set(["Hiện khối này trên web"]));
  });

  it("ô \"Thứ tự các khối\" (tab Chuyển đổi & Bố cục, không thu gọn) vẫn mang hướng dẫn tắt khối ngoài mockup", () => {
    const order = tabs[3]?.fields[1] as { name: string; type: string; label?: unknown; admin?: { description?: string } };
    expect(order).toMatchObject({ name: "blockOrder", type: "array", label: "Thứ tự các khối" });
    expect(order.admin?.description).toContain("Dịch vụ, Ưu đãi, Cho thuê, Tin tức, Đối tác");
    expect(order.admin?.description).toContain("Hiện khối này trên web");
  });
});
