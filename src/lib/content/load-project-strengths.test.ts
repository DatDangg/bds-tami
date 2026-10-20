import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./get-globals", () => ({ getHomepage: vi.fn(), getSiteSettings: vi.fn() }));

import { resolveProjectStrengths } from "./load-project-strengths";

const items = [
  { id: "1", icon: "map-pin", title: "Vị trí", description: "Trung tâm" },
  { id: "2", icon: "star", title: "Uy tín", description: null },
] as const;
const homepage = (strengths: { enabled?: boolean; items: readonly { id: string; icon: string; title: string; description: string | null }[] }) =>
  ({ strengths }) as unknown as Parameters<typeof resolveProjectStrengths>[0];

describe("resolveProjectStrengths", () => {
  it("đủ ≥ 2 mục, cờ bật (mặc định) → có dải", () => {
    const view = resolveProjectStrengths(homepage({ enabled: true, items: [...items] }), {});
    expect(view?.items.map((item) => item.title)).toEqual(["Vị trí", "Uy tín"]);
  });

  it("cờ site-settings showProjectStrengths = false → ẩn dải", () => {
    expect(resolveProjectStrengths(homepage({ enabled: true, items: [...items] }), { showProjectStrengths: false })).toBeNull();
  });

  it("khối trang chủ strengths tắt (enabled = false) → ẩn dải", () => {
    expect(resolveProjectStrengths(homepage({ enabled: false, items: [...items] }), { showProjectStrengths: true })).toBeNull();
  });

  it("dưới 2 mục có chữ ở ngôn ngữ đang xem → ẩn dải", () => {
    expect(resolveProjectStrengths(homepage({ enabled: true, items: [items[0], { ...items[1], title: "" }] }), null)).toBeNull();
  });
});
