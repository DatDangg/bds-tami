import { describe, expect, it } from "vitest";
import type { Category, Media, Project, Province } from "../../payload-types";
import { areaRangeLabel, toProjectCardData, toProjectCards } from "./project-view";

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
      cover: { id: "m1" },
    });
    expect(toProjectCardData(project({ title: "Project A", slug: "project-a", category: category({ hasEnglish: true, name: "Apartments" }) }), "en")).toMatchObject({
      href: "/en/projects/project-a",
      categoryName: "Apartments",
    });
  });

  it("/en: danh mục chưa có bản EN không hiện nhãn (tránh nhãn tiếng Việt / link 404)", () => {
    expect(toProjectCardData(project(), "en")?.categoryName).toBeNull();
  });

  it("thiếu ảnh đã populate / tỉnh chưa populate / chưa có giá → null, không vỡ", () => {
    const card = toProjectCardData(project({ gallery: ["m1"], province: "p1", priceFromVnd: null }), "vi");
    expect(card).toMatchObject({ cover: null, provinceName: null });
    expect(toProjectCardData(project({ gallery: null }), "vi")?.cover).toBeNull();
  });

  it("BL-052: loại sản phẩm hợp lệ theo thứ tự danh sách, giá hiệu lực rút gọn, diện tích, bàn giao, tóm tắt, địa chỉ", () => {
    const card = toProjectCardData(
      project({
        productTypes: ["villa", "apartment", "unknown" as never],
        priceTable: [
          { unitType: "A", priceFrom: 5_400_000_000 },
          { unitType: "B", priceFrom: 7_000_000_000 },
        ],
        areaFromM2: 50,
        areaToM2: 120,
        scale: { handoverTime: " Quý IV/2027 " },
        address: "12 Lê Lợi",
      }),
      "vi",
    );
    expect(card).toMatchObject({
      productTypes: ["apartment", "villa"],
      priceFromLabel: "5,4 tỷ",
      areaRangeLabel: "50–120 m²",
      handoverTime: "Quý IV/2027",
      summary: "Tóm tắt",
      address: "12 Lê Lợi",
    });
    expect(toProjectCardData(project(), "en")?.priceFromLabel).toBe("3.5 billion VND");
  });

  it("BL-052: không có giá → priceFromLabel null (thẻ hiện 'Liên hệ'); trường trống → null / rỗng", () => {
    expect(toProjectCardData(project({ priceFromVnd: null, priceTable: [] }), "vi")).toMatchObject({
      priceFromLabel: null,
      productTypes: [],
      areaRangeLabel: null,
      handoverTime: null,
      address: null,
    });
  });

  it("areaRangeLabel: một đầu / hai đầu bằng nhau / đến < từ → một số", () => {
    expect(areaRangeLabel(80, null, "vi")).toBe("80 m²");
    expect(areaRangeLabel(null, 90, "vi")).toBe("90 m²");
    expect(areaRangeLabel(80, 80, "vi")).toBe("80 m²");
    expect(areaRangeLabel(80, 60, "vi")).toBe("80 m²");
    expect(areaRangeLabel(45.5, 120, "en")).toBe("45.5–120 m²");
    expect(areaRangeLabel(0, null, "vi")).toBeNull();
  });

  it("dự án thiếu tiêu đề hoặc slug bị bỏ qua", () => {
    expect(toProjectCards([project(), project({ id: "d2", slug: null }), project({ id: "d3", title: "" })], "vi").map((card) => card.id)).toEqual(["d1"]);
  });
});
