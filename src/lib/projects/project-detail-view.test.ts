import { describe, expect, it } from "vitest";
import type { Developer, Media, Project, Province, Ward } from "../../payload-types";
import { formatAreaRange, formatHectares, safeFileHref, toProjectDetailView, visibleSections } from "./project-detail-view";

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string, alt: string | null = `Ảnh ${id}`): Media => ({
  id,
  alt,
  url: `/api/media/file/${id}.webp`,
  width: 1600,
  mimeType: "image/webp",
  updatedAt: now,
  createdAt: now,
});
const pdf = (id: string, overrides: Partial<Media> = {}): Media => ({
  id,
  alt: "Bảng giá",
  url: `/api/media/file/${id}.pdf`,
  mimeType: "application/pdf",
  filesize: 2.4 * 1024 * 1024,
  updatedAt: now,
  createdAt: now,
  ...overrides,
});
const province: Province = { id: "p1", code: "01", name: "Thành phố Hà Nội", shortName: "Hà Nội", slug: "ha-noi", updatedAt: now, createdAt: now };
const ward = { id: "w1", name: "Phường Cầu Giấy", province: "p1" } as Ward;
const lexical = (text: string) => ({
  root: { type: "root", version: 1, direction: null, format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text }] }] },
});

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    id: "d1",
    title: "Dự án A",
    slug: "du-an-a",
    summary: "Tóm tắt",
    status: "published",
    salesStatus: "selling",
    province,
    gallery: [image("m1"), image("m2")],
    author: "a1",
    updatedAt: now,
    createdAt: now,
    ...overrides,
  }) as Project;

describe("toProjectDetailView", () => {
  it("ảnh đại diện = ảnh đầu thư viện; alt rỗng thì dùng tên dự án kèm số thứ tự; ảnh chỉ còn id hoặc PDF bị bỏ", () => {
    const view = toProjectDetailView(project({ gallery: ["chi-con-id", image("m1", "  "), pdf("lan-vao-gallery"), image("m3", "Mặt tiền")] }), "vi");
    expect(view.gallery.map((item) => item.alt)).toEqual(["Dự án A - 2", "Mặt tiền"]);
    expect(view.hero?.url).toBe("/api/media/file/m1.webp");
  });

  it("mọi ảnh thư viện bị xoá (FK set null: mảng rỗng, null hoặc chỉ còn id) → hero null, không lỗi (mục Thư viện đã bỏ, BL-045 Q7)", () => {
    const emptied: Project["gallery"][] = [[], null, undefined, [null as never, "id-con"]];
    for (const gallery of emptied) {
      const view = toProjectDetailView(project({ gallery }), "vi");
      expect(view.hero).toBeNull();
      expect(view.gallery).toEqual([]);
      expect(visibleSections(view)).toEqual(["overview"]);
    }
  });

  it("khu vực ngắn Phường, Tỉnh; thiếu phường thì chỉ tỉnh; tỉnh chưa populate thì null", () => {
    expect(toProjectDetailView(project({ ward }), "vi").areaLabel).toBe("Phường Cầu Giấy, Hà Nội");
    expect(toProjectDetailView(project(), "vi").areaLabel).toBe("Hà Nội");
    expect(toProjectDetailView(project({ province: "p1" }), "vi").areaLabel).toBeNull();
  });

  it("tài liệu: chỉ PDF đã populate có URL an toàn; tên ưu tiên caption, alt, tên file; có dung lượng theo ngôn ngữ", () => {
    const view = toProjectDetailView(
      project({
        documents: [
          pdf("a", { caption: "Brochure", alt: "x" }),
          pdf("b", { alt: null, filename: "bang-gia.pdf" }),
          pdf("c", { url: "javascript:alert(1)" }),
          pdf("d", { mimeType: "image/png" }),
          "id-con",
        ],
      }),
      "en",
    );
    expect(view.documents.map((item) => item.name)).toEqual(["Brochure", "bang-gia"]);
    expect(view.documents[0]).toMatchObject({ href: "/api/media/file/a.pdf", sizeLabel: "2.4 MB" });
  });

  it("mặt bằng: bỏ mục thiếu ảnh, ảnh chưa populate hoặc thiếu tên; alt rơi về tên mặt bằng kèm tên dự án", () => {
    const view = toProjectDetailView(
      project({ floorPlans: [{ title: "Căn 2PN", image: image("f1", null) }, { title: "Căn 3PN", image: "chi-con-id" }, { title: " ", image: image("f2") }] }),
      "vi",
    );
    expect(view.floorPlans).toHaveLength(1);
    expect(view.floorPlans[0]?.image.alt).toBe("Căn 2PN - Dự án A");
  });

  it("dự án thiếu mặt bằng/tiện ích/pháp lý/chính sách/tài liệu → các mục ẩn, tổng quan luôn có; Hình ảnh chỉ khi ≥ 2 ảnh (ảnh 1 đã là nền hero)", () => {
    const view = toProjectDetailView(project({ gallery: [image("m1")] }), "vi");
    expect(view.floorPlans).toEqual([]);
    expect(visibleSections(view)).toEqual(["overview"]);
    expect(visibleSections(toProjectDetailView(project(), "vi"))).toEqual(["overview", "gallery"]);
  });

  it("dự án đủ khối → thanh mục con đúng thứ tự design-spec", () => {
    const view = toProjectDetailView(
      project({
        location: [105.8, 21.03],
        amenities: [{ name: "Hồ bơi" }],
        floorPlans: [{ title: "A", image: image("f1") }],
        legalInfo: lexical("Sổ hồng") as never,
        salesPolicy: lexical("Chiết khấu") as never,
        overview: lexical("Giới thiệu") as never,
      }),
      "vi",
    );
    expect(visibleSections(view)).toEqual(["overview", "location", "amenities", "gallery", "floorPlans", "legal", "policy"]);
    expect(visibleSections(view, { hasListings: true })).toEqual(["overview", "location", "amenities", "gallery", "floorPlans", "legal", "policy", "listings"]);
  });

  it("khối market (BL-020 P5): đủ dữ liệu → thứ tự mục con theo spec; chỉ có tiện ích quanh vẫn có mục Vị trí; chỉ có tài liệu vẫn có mục Pháp lý", () => {
    const full = toProjectDetailView(
      project({
        location: [105.8, 21.03],
        highlights: [{ title: "Gần metro" }],
        amenities: [{ name: "Hồ bơi" }],
        floorPlans: [{ title: "A", image: image("f1") }],
        legalInfo: lexical("Sổ hồng") as never,
        salesPolicy: lexical("Chiết khấu") as never,
        priceTable: [{ unitType: "2PN" }],
        faqs: [{ question: "Q?", answer: "A." }],
      }),
      "vi",
    );
    // BL-052: Tổng quan · Vị trí · Tiện ích · Hình ảnh rồi các khối giữ lại (Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách · Tin liên quan · Hỏi đáp).
    expect(visibleSections(full, { hasListings: true })).toEqual(["overview", "location", "amenities", "gallery", "highlights", "floorPlans", "pricing", "legal", "policy", "listings", "faq"]);
    const nearbyOnly = toProjectDetailView(project({ nearbyAmenities: [{ category: "park", name: "Công viên A" }] }), "vi");
    expect(visibleSections(nearbyOnly)).toContain("location");
    const docsOnly = toProjectDetailView(project({ documents: [pdf("d1")] }), "vi");
    expect(visibleSections(docsOnly)).toContain("legal");
    expect(docsOnly.hasLegal).toBe(false);
  });

  it("dòng thiếu chữ bị bỏ (bản EN chưa dịch không rơi về tiếng Việt); tiện ích gom theo nhóm đúng thứ tự, chỉ nhóm có dòng; FAQ cần đủ câu hỏi + trả lời", () => {
    const view = toProjectDetailView(
      project({
        highlights: [{ title: "" , description: "x" }, { title: "Gần metro", description: " " }],
        nearbyAmenities: [
          { category: "transport", name: "Ga A", distanceValue: 500, distanceUnit: "m" },
          { category: "education", name: "Trường B", location: [105.81, 21.04] },
          { category: "education", name: "  " },
          { category: "transport", name: "Ga C", location: [200, 100] },
        ],
        priceTable: [{ unitType: "" }, { unitType: "2PN", areaFrom: 60, priceFrom: 3_000_000_000, availability: "few_left" }],
        priceUpdatedAt: "2026-10-01T00:00:00.000Z",
        faqs: [{ question: "Q1", answer: "" }, { question: "", answer: "A2" }, { question: " Q3 ", answer: " A3 " }],
      } as Partial<Project>),
      "en",
    );
    expect(view.highlights).toEqual([{ id: "1", title: "Gần metro", description: null }]);
    expect(view.nearby.map((group) => group.category)).toEqual(["education", "transport"]);
    expect(view.nearby[0]?.items).toEqual([{ id: "1", name: "Trường B", distance: null, location: { lat: 21.04, lng: 105.81 } }]);
    expect(view.nearby[1]?.items.map((item) => [item.name, item.location])).toEqual([["Ga A", null], ["Ga C", null]]);
    expect(view.nearby[1]?.items[0]?.distance).toEqual({ kind: "measured", value: 500, unit: "m" });
    expect(view.priceRows).toEqual([{ id: "1", unitType: "2PN", areaFrom: 60, areaTo: null, priceFrom: 3_000_000_000, priceTo: null, availability: "few_left", note: null }]);
    expect(view.priceUpdatedAt).toBe("2026-10-01T00:00:00.000Z");
    expect(view.faqs).toEqual([{ id: "2", question: "Q3", answer: "A3" }]);
  });

  it("bảng giá: 0 và số âm coi như thiếu (null)", () => {
    const view = toProjectDetailView(project({ priceTable: [{ unitType: "2PN", areaFrom: 0, areaTo: -5, priceFrom: 0, priceTo: 2_000_000_000 }] } as Partial<Project>), "vi");
    expect(view.priceRows[0]).toMatchObject({ areaFrom: null, areaTo: null, priceFrom: null, priceTo: 2_000_000_000 });
  });

  it("richText chỉ có đoạn rỗng không tính là có nội dung", () => {
    expect(toProjectDetailView(project({ overview: lexical("  ") as never, legalInfo: lexical("") as never }), "vi")).toMatchObject({ hasLegal: false });
  });

  it("toạ độ Payload [kinh độ, vĩ độ] thành {lat, lng}; sai miền → null (không dựng bản đồ); chỉ có địa chỉ vẫn có mục Vị trí", () => {
    expect(toProjectDetailView(project({ location: [105.8, 21.03] }), "vi").location).toEqual({ lat: 21.03, lng: 105.8 });
    expect(toProjectDetailView(project({ location: [21.03, 205.8] }), "vi").location).toBeNull();
    expect(visibleSections(toProjectDetailView(project({ address: "Số 1, Cầu Giấy" }), "vi"))).toContain("location");
  });

  it("chủ đầu tư: website chỉ nhận http(s); danh mục EN chưa dịch bị ẩn; thông số 0 bị bỏ", () => {
    const developer = (website: string): Developer => ({ id: "dv", name: "Vinhomes", website, updatedAt: now, createdAt: now });
    expect(toProjectDetailView(project({ developer: developer("https://vinhomes.vn") }), "vi").developer).toEqual({ name: "Vinhomes", website: "https://vinhomes.vn" });
    expect(toProjectDetailView(project({ developer: developer("javascript:alert(1)") }), "vi").developer).toEqual({ name: "Vinhomes", website: null });
    expect(toProjectDetailView(project({ developer: "chi-con-id" }), "vi").developer).toBeNull();
    const category = { id: "c1", name: "Căn hộ", slug: "can-ho", scope: "project", hasEnglish: false, updatedAt: now, createdAt: now } as const;
    expect(toProjectDetailView(project({ category }), "en").categoryName).toBeNull();
    expect(toProjectDetailView(project({ category }), "vi").categoryName).toBe("Căn hộ");
    expect(toProjectDetailView(project({ scale: { totalUnits: 0, blocks: 3 }, areaFromM2: 0 }), "vi")).toMatchObject({ scale: { blocks: 3 }, areaFromM2: null });
  });
});

describe("BL-052: trường chi tiết mới", () => {
  it("Giá từ hiển thị = effectivePriceFromVnd: min bảng giá > 0, không có → priceFromVnd, không có nữa → null", () => {
    const price = (overrides: Partial<Project>) => toProjectDetailView(project(overrides), "vi").displayPriceFromVnd;
    expect(price({ priceTable: [{ unitType: "A", priceFrom: 5e9 }, { unitType: "B", priceFrom: 3.2e9 }, { unitType: "C", priceFrom: 0 }, { unitType: "D" }], priceFromVnd: 2e9 })).toBe(3.2e9);
    expect(price({ priceTable: [{ unitType: "A", priceFrom: -1 }], priceFromVnd: 2e9 })).toBe(2e9);
    expect(price({ priceTable: null, priceFromVnd: 0 })).toBeNull();
    // Bản EN thiếu tên loại căn vẫn cùng giá (đọc số, không đọc dòng đã lọc theo chữ).
    expect(toProjectDetailView(project({ priceTable: [{ unitType: "", priceFrom: 4e9 }] }), "en").displayPriceFromVnd).toBe(4e9);
  });

  it("loại sản phẩm theo thứ tự PROPERTY_TYPES; sản phẩm thiếu tên bị bỏ, số 0 thành null; mô tả tiện ích; ảnh tiện ích thiếu alt dùng tên dự án", () => {
    const view = toProjectDetailView(
      project({
        productTypes: ["villa", "apartment"],
        products: [{ type: "Biệt thự", count: 0, areaFrom: 200, areaTo: 360 }, { type: " ", count: 5 }],
        amenities: [{ name: "Hồ bơi", description: "  Tràn bờ " }, { name: "Gym" }],
        amenitiesImage: image("am", " "),
      }),
      "vi",
    );
    expect(view.productTypes).toEqual(["apartment", "villa"]);
    expect(view.products).toEqual([{ id: "0", type: "Biệt thự", count: null, areaFrom: 200, areaTo: 360 }]);
    expect(view.amenities.map((item) => item.description)).toEqual(["Tràn bờ", null]);
    expect(view.amenitiesImage?.alt).toBe("Dự án A");
    expect(toProjectDetailView(project({ amenitiesImage: pdf("x") }), "vi").amenitiesImage).toBeNull();
  });

  it("ảnh từng tiện ích (BL-060): alt thiếu dùng tên tiện ích, PDF/ảnh đã xoá → null", () => {
    const view = toProjectDetailView(
      project({ amenities: [{ name: "Hồ bơi", image: image("a1", " ") }, { name: "Gym", image: pdf("a2") }, { name: "Vườn", image: "chi-con-id" as unknown as string }, { name: "Sân", image: image("a3", "Sân tennis") }] }),
      "vi",
    );
    expect(view.amenities.map((item) => item.image?.alt ?? null)).toEqual(["Hồ bơi", null, null, "Sân tennis"]);
  });

  it("locationMedia (BL-060): rỗng / video ngoài whitelist không ảnh → null; video hợp lệ + ảnh; chỉ ảnh; alt dự phòng; visibleSections tính cả thẻ", () => {
    const media = (locationMedia: Project["locationMedia"]) => toProjectDetailView(project({ locationMedia }), "vi").locationMedia;
    expect(media(undefined)).toBeNull();
    expect(media({ title: "Kết nối", videoUrl: "https://example.com/v.mp4" })).toBeNull();
    expect(media({ image: pdf("x") })).toBeNull();
    expect(media({ title: " Hạ tầng ", image: image("l1", " "), videoUrl: " https://www.youtube.com/watch?v=dQw4w9WgXcQ " })).toMatchObject({
      title: "Hạ tầng",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      image: { alt: "Hạ tầng" },
    });
    expect(media({ image: image("l2", " ") })).toMatchObject({ title: null, videoUrl: null, image: { alt: "Dự án A" } });
    const onlyMedia = toProjectDetailView(project({ locationMedia: { image: image("l3") } }), "vi");
    expect(visibleSections(onlyMedia)).toContain("location");
  });

  it("video chỉ nhận link qua whitelist YouTube/TikTok", () => {
    expect(toProjectDetailView(project({ videoUrl: " https://www.youtube.com/watch?v=dQw4w9WgXcQ " }), "vi").videoUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(toProjectDetailView(project({ videoUrl: "https://evil.example/v.mp4" }), "vi").videoUrl).toBeNull();
    expect(toProjectDetailView(project(), "vi").videoUrl).toBeNull();
  });

  it("định dạng ha và khoảng diện tích theo ngôn ngữ", () => {
    expect(formatHectares(362_100, "vi")).toBe("36,21");
    expect(formatHectares(362_100, "en")).toBe("36.21");
    // NBSP trước "m²" (BL-071): đơn vị không rơi xuống dòng riêng trong thẻ hẹp.
    expect(formatAreaRange(136, 55, "vi")).toBe("55 – 136 m²");
    expect(formatAreaRange(null, 90, "vi")).toBe("90 m²");
    expect(formatAreaRange(null, null, "vi")).toBeNull();
  });
});

describe("safeFileHref", () => {
  it("nhận đường dẫn nội bộ và http(s); chặn javascript:, data:, //host, khoảng trắng và ký tự điều khiển", () => {
    expect(safeFileHref("/api/media/file/a.pdf")).toBe("/api/media/file/a.pdf");
    expect(safeFileHref("https://cdn.example.com/a.pdf")).toBe("https://cdn.example.com/a.pdf");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.com/a.pdf", "/\\evil.com", "/a b.pdf", "ftp://x/a.pdf", "", null, undefined]) {
      expect(safeFileHref(bad), String(bad)).toBeNull();
    }
  });
});
