import { describe, expect, it } from "vitest";

import { extractProducts, planProject, type ProjectSource } from "./projects";
import { parseViNumber, richTextToPlain } from "./text";

const project = (over: Partial<ProjectSource> = {}): ProjectSource => ({
  id: "p1",
  title: "Dự án mẫu",
  status: "published",
  category: null,
  summary: "",
  overviewText: "",
  priceUnitTypes: [],
  amenities: [],
  nearby: [],
  productTypes: [],
  featuredAmenities: [],
  products: [],
  ...over,
});

describe("planProject — productTypes", () => {
  it("trích theo từ khoá; nguồn tên/danh mục/bảng giá = cao, mô tả/tổng quan = trung bình", () => {
    const plan = planProject(
      project({
        title: "Khu biệt thự ven biển",
        category: "Chung cư",
        priceUnitTypes: ["Shophouse khối đế"],
        summary: "Có nhà phố liền kề và đất nền.",
        overviewText: "Tổ hợp condotel, officetel và khu nghỉ dưỡng 5 sao.",
      }),
    );
    expect(plan.patch.productTypes).toEqual(["apartment", "townhouse", "villa", "shophouse", "land", "resort", "condotel", "office"]);
    const byValue = Object.fromEntries(plan.filled.filter((f) => f.field === "productTypes").map((f) => [f.value.match(/\((\w+)\)$/)?.[1], f]));
    expect(byValue.villa).toMatchObject({ source: "tên", confidence: "cao" });
    expect(byValue.apartment).toMatchObject({ source: "danh mục", confidence: "cao" });
    expect(byValue.shophouse).toMatchObject({ source: "bảng giá", confidence: "cao" });
    expect(byValue.land).toMatchObject({ source: "mô tả ngắn", confidence: "trung bình" });
    expect(byValue.office.snippet).toContain("officetel");
    expect(plan.review.some((r) => r.field === "productTypes" && r.note.includes("Đất nền"))).toBe(true);
  });

  it("không nhầm cụm loại trừ: \"căn hộ khách sạn\" chỉ là condotel, \"nhà phố thương mại\" là shophouse, \"văn phòng bán hàng\" bỏ qua", () => {
    const plan = planProject(project({ overviewText: "Căn hộ khách sạn và nhà phố thương mại. Liên hệ văn phòng bán hàng." }));
    expect(plan.patch.productTypes).toEqual(["shophouse", "condotel"]);
  });

  it("\"nghỉ dưỡng\" chỉ tính khi đi sau danh từ loại hình (bỏ lời quảng cáo)", () => {
    expect(planProject(project({ summary: "Thiên đường nghỉ dưỡng giữa lòng phố." })).patch).not.toHaveProperty("productTypes");
    expect(planProject(project({ summary: "Khu đô thị nghỉ dưỡng ven đô." })).patch.productTypes).toEqual(["resort"]);
  });

  it("không ghi đè ô đã có giá trị", () => {
    const plan = planProject(project({ title: "Biệt thự", productTypes: ["apartment"] }));
    expect(plan.patch).not.toHaveProperty("productTypes");
    expect(plan.fieldStates.productTypes).toBe("has-value");
  });

  it("không trích được → không điền, trạng thái not-found", () => {
    const plan = planProject(project({ title: "Khu đô thị Xanh" }));
    expect(plan.patch).toEqual({});
    expect(plan.fieldStates).toEqual({ productTypes: "not-found", featuredAmenities: "not-found", products: "not-found" });
  });
});

describe("planProject — featuredAmenities", () => {
  it("từ nhóm tiện ích xung quanh (giao thông chỉ khi có metro) + danh sách tiện ích + tổng quan", () => {
    const plan = planProject(
      project({
        nearby: [
          { category: "education", name: "Trường Vinschool" },
          { category: "healthcare", name: "BV Vinmec" },
          { category: "transport", name: "Bến xe Mỹ Đình" },
          { category: "transport", name: "Ga Metro số 1" },
        ],
        amenities: ["Hồ bơi vô cực", "Công viên trung tâm"],
        overviewText: "Căn hộ view sông Hồng, gần Aeon Mall.",
      }),
    );
    expect(plan.patch.featuredAmenities).toEqual(["near_school", "near_hospital", "near_mall", "near_metro", "water_view", "pool_gym_spa", "green_park"]);
    const sources = Object.fromEntries(plan.filled.filter((f) => f.field === "featuredAmenities").map((f) => [f.value.match(/\((\w+)\)$/)?.[1], f.source]));
    expect(sources).toMatchObject({ near_school: "tiện ích xung quanh", near_metro: "tiện ích xung quanh", pool_gym_spa: "danh sách tiện ích", water_view: "tổng quan" });
  });

  it("\"hồ bơi\" không bị hiểu là view hồ; \"spa\" phải đứng riêng (không khớp \"space\")", () => {
    const plan = planProject(project({ overviewText: "Không gian sát hồ bơi, open space." }));
    expect(plan.patch.featuredAmenities).toEqual(["pool_gym_spa"]);
    expect(planProject(project({ overviewText: "Open space rộng." })).patch).not.toHaveProperty("featuredAmenities");
  });
});

describe("extractProducts / planProject — products", () => {
  it("điền khi có \"<số> <loại> … <diện tích> m²\" trong cùng câu; số kiểu VN", () => {
    const text = "Quy mô 350 sản phẩm thấp tầng. Gồm 22 căn biệt thự song lập, diện tích đất 150 – 230m² và 06 căn biệt thự đơn lập, diện tích đất 350 – 500m². Dự án có 96 biệt thự đơn lập (200–360 m²).";
    const { products } = extractProducts(text);
    expect(products.map(({ type, count, areaFrom, areaTo }) => ({ type, count, areaFrom, areaTo }))).toEqual([
      { type: "Biệt thự song lập", count: 22, areaFrom: 150, areaTo: 230 },
      { type: "Biệt thự đơn lập", count: 6, areaFrom: 350, areaTo: 500 },
    ]);
  });

  it("thiếu diện tích hoặc thiếu số lượng → chỉ gợi ý, không điền", () => {
    const { products, suggestions } = extractProducts("Cao 25 tầng với khoảng 156 căn hộ. Nhà liền kề: 100 – 140m².");
    expect(products).toEqual([]);
    expect(suggestions.map((s) => s.note)).toEqual([
      "Gợi ý: Căn hộ — 156 (không thấy diện tích trong cùng câu, chưa điền)",
      "Gợi ý: Nhà liền kề 100–140 m² (không có số lượng, chưa điền)",
    ]);
  });

  it("bỏ số giống năm và diện tích ngược", () => {
    expect(extractProducts("Năm 2026 biệt thự 200 m².").products).toEqual([]);
    expect(extractProducts("10 căn hộ 90 – 60 m².").products).toEqual([]);
  });

  it("planProject: products điền ở locale vi, nhắc bản EN để trống; không ghi đè products đã có", () => {
    const overviewText = "Gồm 12 căn shophouse 100 m².";
    const plan = planProject(project({ overviewText }));
    expect(plan.patch.products).toEqual([{ type: "Shophouse", count: 12, areaFrom: 100, areaTo: null }]);
    expect(plan.review.some((r) => r.note.includes("tiếng Anh"))).toBe(true);
    expect(planProject(project({ overviewText, products: [{ type: "x" }] })).patch).not.toHaveProperty("products");
  });
});

describe("tiện ích chữ", () => {
  it("parseViNumber đọc số kiểu VN", () => {
    expect(parseViNumber("1.200")).toBe(1200);
    expect(parseViNumber("493,9")).toBe(493.9);
    expect(parseViNumber("6.140,6")).toBe(6140.6);
    expect(parseViNumber("06")).toBe(6);
  });

  it("richTextToPlain tách khối thành dòng", () => {
    const content = { root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "Đoạn 1" }] }, { type: "heading", children: [{ type: "text", text: "Tiêu đề" }] }] } };
    expect(richTextToPlain(content)).toBe("Đoạn 1\nTiêu đề");
    expect(richTextToPlain(null)).toBe("");
  });
});
