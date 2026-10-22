import type { SanitizedConfig } from "payload";
import { describe, expect, it } from "vitest";

import { ADMIN_NAV_GROUPS, adminNavGroupsPlugin } from "./admin-groups";

/** Mô phỏng `groupNavItems` của Payload: nhóm theo thứ tự xuất hiện đầu tiên của [...collections, ...globals]. */
function navOrder(config: SanitizedConfig): { label: string; slugs: string[] }[] {
  const groups: { label: string; slugs: string[] }[] = [];
  for (const entity of visibleEntities(config)) {
    const label = entity.admin.group as string;
    const existing = groups.find((group) => group.label === label);
    if (existing) existing.slugs.push(entity.slug);
    else groups.push({ label, slugs: [entity.slug] });
  }
  return groups;
}

/** Collection nội bộ do Payload tự thêm lúc sanitize (payload-*, sau plugin) không thuộc nav của app. */
const visibleEntities = (config: SanitizedConfig) => [...config.collections, ...config.globals].filter((entity) => !entity.slug.startsWith("payload-"));

describe("nhóm menu admin (BL-015 T03)", async () => {
  const { default: loaded } = await import("../../payload.config");
  const config = (await loaded) as SanitizedConfig;

  it("mọi collection và global thuộc đúng một trong 8 nhóm tiếng Việt", () => {
    const labels = new Set<string>(ADMIN_NAV_GROUPS.map((group) => group.label));
    expect(labels.size).toBe(8);
    for (const entity of visibleEntities(config)) {
      expect(labels.has(entity.admin.group as string), `${entity.slug} nhóm=${String(entity.admin.group)}`).toBe(true);
    }
  });

  it("thứ tự nhóm và mục khớp design §2 (trong nhóm collection đứng trước global)", () => {
    const expected = ADMIN_NAV_GROUPS.map((group) => ({ label: group.label, slugs: [...group.collections, ...group.globals] }));
    expect(navOrder(config)).toEqual(expected);
  });

  it("không mục nào bị mất hoặc thêm so với danh sách khai báo", () => {
    const declared = ADMIN_NAV_GROUPS.flatMap((group) => [...group.collections, ...group.globals]).sort();
    const actual = visibleEntities(config).map((entity) => entity.slug).sort();
    expect(actual).toEqual(declared);
  });

  it("nhóm danh mục nền tên \"Dữ liệu nền\" (không trùng collection \"Danh mục\")", () => {
    const labels = ADMIN_NAV_GROUPS.map((group) => group.label) as string[];
    expect(labels).toContain("Dữ liệu nền");
    expect(labels).not.toContain("Danh mục");
  });

  it("nhóm \"Nâng cao\" đứng cuối với 7 mục kỹ thuật (BL-041)", () => {
    const last = ADMIN_NAV_GROUPS[ADMIN_NAV_GROUPS.length - 1];
    expect(last?.label).toBe("Nâng cao");
    expect([...(last?.collections ?? [])]).toEqual(["provinces", "wards", "audit-logs", "click-events", "click-stats-daily", "news-views-daily", "translation-usage"]);
  });

  it("slug chưa khai báo -> throw (không rơi vào nhóm mặc định)", () => {
    expect(() => adminNavGroupsPlugin({ collections: [{ slug: "la-hoac", fields: [] }] } as never)).toThrow(/ADMIN_NAV_GROUPS/);
  });
});
