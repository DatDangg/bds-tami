import { describe, expect, it } from "vitest";
import type { Developer, Media, Project, Province, Ward } from "../../payload-types";
import { safeFileHref, toProjectDetailView, visibleSections } from "./project-detail-view";

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

  it("mọi ảnh thư viện bị xoá (FK set null: mảng rỗng, null hoặc chỉ còn id) → hero null, không có khối thư viện, không lỗi", () => {
    const emptied: Project["gallery"][] = [[], null, undefined, [null as never, "id-con"]];
    for (const gallery of emptied) {
      const view = toProjectDetailView(project({ gallery }), "vi");
      expect(view.hero).toBeNull();
      expect(view.gallery).toEqual([]);
      expect(visibleSections(view)).not.toContain("gallery");
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

  it("dự án thiếu mặt bằng/tiện ích/pháp lý/chính sách/tài liệu → các mục ẩn, tổng quan luôn có", () => {
    const view = toProjectDetailView(project(), "vi");
    expect(view.floorPlans).toEqual([]);
    expect(visibleSections(view)).toEqual(["overview", "gallery"]);
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
    expect(view.hasOverview).toBe(true);
    expect(visibleSections(view)).toEqual(["overview", "location", "amenities", "floorPlans", "legal", "policy", "gallery"]);
  });

  it("richText chỉ có đoạn rỗng không tính là có nội dung", () => {
    expect(toProjectDetailView(project({ overview: lexical("  ") as never, legalInfo: lexical("") as never }), "vi")).toMatchObject({ hasOverview: false, hasLegal: false });
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

describe("safeFileHref", () => {
  it("nhận đường dẫn nội bộ và http(s); chặn javascript:, data:, //host, khoảng trắng và ký tự điều khiển", () => {
    expect(safeFileHref("/api/media/file/a.pdf")).toBe("/api/media/file/a.pdf");
    expect(safeFileHref("https://cdn.example.com/a.pdf")).toBe("https://cdn.example.com/a.pdf");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.com/a.pdf", "/\\evil.com", "/a b.pdf", "ftp://x/a.pdf", "", null, undefined]) {
      expect(safeFileHref(bad), String(bad)).toBeNull();
    }
  });
});
