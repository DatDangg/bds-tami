import { describe, expect, it } from "vitest";
import type { Category, Media, Project, Province } from "../../payload-types";
import { toProjectCardData, toProjectCards } from "./project-view";

const now = "2026-01-01T00:00:00.000Z";
const category = (overrides: Partial<Category> = {}): Category => ({
  id: "c1",
  name: "Căn hộ",
  slug: "can-ho",
  scope: "project",
  hasEnglish: false,
  updatedAt: now,
  createdAt: now,
  ...overrides,
});
const media = (id: string): Media => ({ id, alt: id, url: `/api/media/file/${id}.webp`, width: 1600, updatedAt: now, createdAt: now });
const province: Province = { id: "p1", code: "01", name: "Thành phố Hà Nội", shortName: "Hà Nội", slug: "ha-noi", updatedAt: now, createdAt: now };
const project = (overrides: Partial<Project> = {}): Project =>
  ({
    id: "d1",
    title: "Dự án A",
    slug: "du-an-a",
    summary: "Tóm tắt",
    status: "published",
    salesStatus: "selling",
    province,
    category: category(),
    gallery: [media("m1"), media("m2")],
    priceFromVnd: 3_500_000_000,
    author: "a1",
    updatedAt: now,
    createdAt: now,
    ...overrides,
  }) as Project;

describe("toProjectCardData", () => {
  it("ảnh đầu thư viện làm ảnh đại diện, tỉnh dạng ngắn, giá rút gọn, link chi tiết theo ngôn ngữ", () => {
    expect(toProjectCardData(project(), "vi")).toMatchObject({
      id: "d1",
      title: "Dự án A",
      href: "/du-an/du-an-a",
      salesStatus: "selling",
      provinceName: "Hà Nội",
      categoryName: "Căn hộ",
      priceFrom: "3,5 tỷ",
      cover: { id: "m1" },
    });
    expect(toProjectCardData(project({ title: "Project A", slug: "project-a", category: category({ hasEnglish: true, name: "Apartments" }) }), "en")).toMatchObject({
      href: "/en/projects/project-a",
      categoryName: "Apartments",
      priceFrom: "3.5 billion VND",
    });
  });

  it("/en: danh mục chưa có bản EN không hiện nhãn (tránh nhãn tiếng Việt / link 404)", () => {
    expect(toProjectCardData(project(), "en")?.categoryName).toBeNull();
  });

  it("thiếu ảnh đã populate / tỉnh chưa populate / chưa có giá → null, không vỡ", () => {
    const card = toProjectCardData(project({ gallery: ["m1"], province: "p1", priceFromVnd: null }), "vi");
    expect(card).toMatchObject({ cover: null, provinceName: null, priceFrom: null });
    expect(toProjectCardData(project({ gallery: null }), "vi")?.cover).toBeNull();
  });

  it("dự án thiếu tiêu đề hoặc slug bị bỏ qua", () => {
    expect(toProjectCards([project(), project({ id: "d2", slug: null }), project({ id: "d3", title: "" })], "vi").map((card) => card.id)).toEqual(["d1"]);
  });
});
