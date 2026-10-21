import type { Payload, SanitizedPermissions } from "payload";
import { describe, expect, it } from "vitest";

import { buildQuickActions, buildWebsiteShortcuts, type DashboardContext, type StatCard } from "./dashboard-data";

const payload = { config: { routes: { admin: "/admin" } } } as unknown as Payload;
const permissions = (create: string[]) =>
  ({ collections: Object.fromEntries(create.map((slug) => [slug, { create: true }])) }) as unknown as SanitizedPermissions;
const contextOf = (role: "admin" | "sale", create: string[]): DashboardContext => ({
  payload,
  user: { id: "u1", collection: "staff", role },
  permissions: permissions(create),
});
const unassigned = (count: number): StatCard => ({ id: "leads-unassigned", label: "Lead chưa phân công", hint: "h", icon: "alert", count, href: "/admin/collections/leads?unassigned" });

describe("buildQuickActions", () => {
  it("admin đủ quyền: 3 thẻ theo thứ tự, thẻ phân công mang số + link của thẻ đếm chưa giao", () => {
    const actions = buildQuickActions(contextOf("admin", ["rentals", "news"]), [unassigned(3)]);
    expect(actions.map((action) => action.label)).toEqual(["Đăng tin cho thuê mới", "Phân công lead (3 chưa giao)", "Viết tin tức"]);
    expect(actions[1]?.href).toBe("/admin/collections/leads?unassigned");
    expect(actions[0]?.href).toBe("/admin/collections/rentals/create");
  });

  it("N = 0 vẫn hiện thẻ phân công", () => {
    const actions = buildQuickActions(contextOf("admin", ["rentals", "news"]), [unassigned(0)]);
    expect(actions.map((action) => action.label)).toContain("Phân công lead (0 chưa giao)");
  });

  it("sale: không có thẻ phân công dù có thẻ đếm", () => {
    const actions = buildQuickActions(contextOf("sale", ["rentals", "news"]), [unassigned(3)]);
    expect(actions.map((action) => action.id)).toEqual(["new-rental", "new-news"]);
  });

  it("không quyền tạo -> không có thẻ tạo tương ứng", () => {
    expect(buildQuickActions(contextOf("sale", []), [])).toEqual([]);
    expect(buildQuickActions(contextOf("admin", ["news"]), []).map((action) => action.id)).toEqual(["new-news"]);
  });
});

describe("buildWebsiteShortcuts", () => {
  it("admin: Trang chủ, Menu đầu trang, Chân trang, Cấu hình chung", () => {
    const shortcuts = buildWebsiteShortcuts(contextOf("admin", []));
    expect(shortcuts.map((shortcut) => shortcut.label)).toEqual(["Trang chủ", "Menu đầu trang", "Chân trang", "Cấu hình chung"]);
    expect(shortcuts.map((shortcut) => shortcut.href)).toEqual(["/admin/globals/homepage", "/admin/globals/header", "/admin/globals/footer", "/admin/globals/site-settings"]);
  });

  it("sale: không có gì", () => {
    expect(buildWebsiteShortcuts(contextOf("sale", []))).toEqual([]);
  });
});
