import { describe, expect, it } from "vitest";

import type { Category, Media, Project, Province, Rental, Ward } from "../../payload-types";
import type { RentalCard as RentalSearchCard } from "../../shared/types/api";
import { searchCardToRentalCardData, toRentalCardData, toRentalCards, toRentalDetailView, toSaleContactView } from "./rental-view";

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string, extra: Partial<Media> = {}): Media => ({
  id,
  alt: `Ảnh ${id}`,
  mimeType: "image/webp",
  url: `/api/media/file/${id}.webp`,
  width: 1600,
  updatedAt: now,
  createdAt: now,
  ...extra,
});
const province: Province = { id: "p1", code: "79", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM", slug: "ho-chi-minh", updatedAt: now, createdAt: now };
const ward = { id: "w1", name: "Phường Sài Gòn", province: "p1", code: "1", type: "phuong", slug: "sai-gon", updatedAt: now, createdAt: now } as unknown as Ward;
const category = { id: "c1", name: "Căn hộ", slug: "can-ho", scope: "rental", hasEnglish: true, updatedAt: now, createdAt: now } as unknown as Category;

const rental = (overrides: Partial<Rental> = {}): Rental =>
  ({
    id: "r1",
    code: "CT-000001",
    title: "Căn hộ 2PN Quận 1",
    slug: "can-ho-2pn-quan-1",
    status: "published",
    province,
    ward,
    category,
    areaM2: 55,
    priceMonthlyVnd: 12_000_000,
    author: "s1",
    showExactAddress: false,
    gallery: [image("g1"), image("g2")],
    updatedAt: now,
    createdAt: now,
    ...overrides,
  }) as Rental;

describe("toRentalDetailView — tầng (BL-065)", () => {
  it("số tầng / mức tầng / giá trị cũ (chỉ /vi)", () => {
    expect(toRentalDetailView(rental({ floorNumber: 7 }), "en").floor).toEqual({ kind: "number", number: 7 });
    expect(toRentalDetailView(rental({ floorLevel: "high" }), "vi").floor).toEqual({ kind: "level", level: "high" });
    expect(toRentalDetailView(rental({ floor: "3.4.5.6" }), "vi").floor).toEqual({ kind: "legacy", text: "3.4.5.6" });
    expect(toRentalDetailView(rental({ floor: "3.4.5.6" }), "en").floor).toBeNull();
    expect(toRentalDetailView(rental(), "vi").floor).toBeNull();
  });
});

describe("toRentalDetailView", () => {
  it("giá: có giá → số; tick thoả thuận hoặc chưa nhập giá → null", () => {
    expect(toRentalDetailView(rental(), "vi").priceMonthlyVnd).toBe(12_000_000);
    expect(toRentalDetailView(rental({ priceNegotiable: true }), "vi").priceMonthlyVnd).toBeNull();
    expect(toRentalDetailView(rental({ priceMonthlyVnd: null }), "vi").priceMonthlyVnd).toBeNull();
    expect(toRentalDetailView(rental({ priceMonthlyVnd: 0 }), "vi").priceMonthlyVnd).toBeNull();
  });

  it("amenities (BL-044): giữ nguyên danh sách của doc; thiếu/null → mảng rỗng (hàng Tiện ích ẩn)", () => {
    expect(toRentalDetailView(rental({ amenities: ["pool", "gym"] }), "vi").amenities).toEqual(["pool", "gym"]);
    expect(toRentalDetailView(rental(), "vi").amenities).toEqual([]);
    expect(toRentalDetailView(rental({ amenities: null }), "vi").amenities).toEqual([]);
  });

  it("rented chỉ khi status = rented", () => {
    expect(toRentalDetailView(rental({ status: "rented" }), "vi").rented).toBe(true);
    expect(toRentalDetailView(rental(), "vi").rented).toBe(false);
  });

  describe("địa chỉ + bản đồ khi showExactAddress = false (field read access trả undefined cho khách)", () => {
    it("không in số nhà/đường (kể cả khi lỡ có address), chỉ phường + tỉnh", () => {
      const view = toRentalDetailView(rental({ address: "12 Lê Lợi" }), "vi");
      expect(view.addressLine).toBe("Phường Sài Gòn, TP.HCM");
      expect(view.addressLine).not.toContain("Lê Lợi");
    });

    it("address/location undefined → không vỡ, không in 'undefined', không có bản đồ", () => {
      const view = toRentalDetailView(rental(), "vi");
      expect(view.addressLine).not.toContain("undefined");
      expect(view.map).toBeNull();
    });

    it("toạ độ đọc server-side được làm tròn 0,001 độ và đánh dấu approximate; toạ độ thật không còn trong view", () => {
      const view = toRentalDetailView(rental(), "vi", [106.700981, 10.776889]);
      expect(view.map).toEqual({ location: { lat: 10.777, lng: 106.701 }, approximate: true });
      expect(JSON.stringify(view)).not.toMatch(/106\.700981|10\.776889/);
    });

    it("toạ độ ngoài miền hợp lệ → không dựng bản đồ", () => {
      expect(toRentalDetailView(rental(), "vi", [999, 10]).map).toBeNull();
    });
  });

  it("showExactAddress = true và address đã gồm phường/tỉnh: không ghép lặp (BL-081)", () => {
    const view = toRentalDetailView(rental({ showExactAddress: true, address: "12 Lê Lợi, phường Sài Gòn, TP.HCM" }), "vi");
    expect(view.addressLine).toBe("12 Lê Lợi, phường Sài Gòn, TP.HCM");
  });

  it("showExactAddress = true: in địa chỉ đầy đủ và ghim chính xác theo toạ độ của doc", () => {
    const view = toRentalDetailView(rental({ showExactAddress: true, address: "12 Lê Lợi", location: [106.700981, 10.776889] }), "vi");
    expect(view.addressLine).toBe("12 Lê Lợi, Phường Sài Gòn, TP.HCM");
    expect(view.map).toEqual({ location: { lat: 10.776889, lng: 106.700981 }, approximate: false });
  });

  it("điều khoản thuê: rỗng → hasTerms false; có trường → true và ngày theo múi giờ VN", () => {
    expect(toRentalDetailView(rental(), "vi").hasTerms).toBe(false);
    const view = toRentalDetailView(
      rental({ rentalTerms: { minLeaseMonths: 6, depositMonths: 0, paymentCycle: "quarterly", includedServices: ["water"], availableFrom: "2026-12-01T00:00:00.000Z" } }),
      "vi",
    );
    expect(view.hasTerms).toBe(true);
    expect(view.terms).toMatchObject({ minLeaseMonths: 6, depositMonths: 0, paymentCycle: "quarterly", services: ["water"], availableFromLabel: "01/12/2026" });
  });

  it("video: chỉ nhận URL YouTube/TikTok hợp lệ", () => {
    expect(toRentalDetailView(rental({ videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }), "vi").videoUrl).toContain("youtube.com");
    expect(toRentalDetailView(rental({ videoUrl: "https://evil.example/x.mp4" }), "vi").videoUrl).toBeNull();
  });

  it("ảnh bị xoá (chỉ còn id) thì bỏ; ảnh mất alt dùng 'Tiêu đề - n'", () => {
    const view = toRentalDetailView(rental({ gallery: ["id-con", image("g2", { alt: "" })] }), "vi");
    expect(view.gallery).toHaveLength(1);
    expect(view.gallery[0]?.alt).toBe("Căn hộ 2PN Quận 1 - 2");
  });

  it("danh mục: link theo ngôn ngữ; /en bỏ danh mục chưa có bản EN", () => {
    expect(toRentalDetailView(rental(), "vi").category).toEqual({ label: "Căn hộ", href: "/cho-thue/danh-muc/can-ho" });
    expect(toRentalDetailView(rental(), "en").category?.href).toBe("/en/for-rent/category/can-ho");
    expect(toRentalDetailView(rental({ category: { ...category, hasEnglish: false } as Category }), "en").category).toBeNull();
  });

  it("dự án: link khi đã populate; /en bỏ dự án chưa có EN; id thô → null", () => {
    const project = { id: "d1", title: "Dự án A", slug: "du-an-a", hasEnglish: false } as Project;
    expect(toRentalDetailView(rental({ project }), "vi").project).toEqual({ label: "Dự án A", href: "/du-an/du-an-a" });
    expect(toRentalDetailView(rental({ project }), "en").project).toBeNull();
    expect(toRentalDetailView(rental({ project: "d1" }), "vi").project).toBeNull();
  });
});

describe("toRentalCardData", () => {
  it("thẻ có link theo ngôn ngữ, giá, ảnh đầu dùng được và khu vực", () => {
    const card = toRentalCardData(rental({ gallery: ["id-con", image("g2")] }), "en");
    expect(card).toMatchObject({ href: "/en/for-rent/can-ho-2pn-quan-1", code: "CT-000001", priceMonthlyVnd: 12_000_000, areaLabel: "Phường Sài Gòn, TP.HCM" });
    expect(card?.cover?.url).toBe("/api/media/file/g2.webp");
  });

  it("BL-052: tag danh mục (ẩn ở /en khi danh mục chưa có bản EN), nội thất, phòng tắm, cờ đã thuê", () => {
    const doc = rental({ category, furnishing: "basic", bathrooms: 2, status: "rented" });
    expect(toRentalCardData(doc, "vi")).toMatchObject({ categoryLabel: "Căn hộ", furnishing: "basic", bathrooms: 2, rented: true });
    expect(toRentalCardData({ ...doc, category: { ...category, hasEnglish: false } as Category }, "en")?.categoryLabel).toBeNull();
    expect(toRentalCardData(rental({ category: "c1", furnishing: null, bathrooms: null }), "vi")).toMatchObject({ categoryLabel: null, furnishing: null, bathrooms: null, rented: false });
  });

  it("thiếu tiêu đề hoặc slug → bỏ khỏi danh sách", () => {
    expect(toRentalCards([rental({ title: null }), rental({ slug: null }), rental()], "vi")).toHaveLength(1);
  });
});

describe("toSaleContactView", () => {
  it("sale có tên + SĐT → tên, nhãn, tel: (bỏ dấu cách)", () => {
    expect(toSaleContactView({ fullName: " Nguyễn A ", phone: "0901 111 222", avatar: null })).toEqual({ name: "Nguyễn A", phoneLabel: "0901 111 222", telHref: "tel:0901111222", avatar: null });
  });

  it("không có sale, thiếu/ rỗng/ không có chữ số trong SĐT → null (trang dùng hotline chung)", () => {
    expect(toSaleContactView(null)).toBeNull();
    expect(toSaleContactView({ fullName: "A", phone: null, avatar: null })).toBeNull();
    expect(toSaleContactView({ fullName: "A", phone: "   ", avatar: null })).toBeNull();
    expect(toSaleContactView({ fullName: "A", phone: "abc", avatar: null })).toBeNull();
  });

  it("avatar: chỉ nhận ảnh dựng được (có URL/cỡ); ảnh không dựng được → null", () => {
    expect(toSaleContactView({ fullName: "A", phone: "0901111222", avatar: image("av", { url: null, sizes: undefined }) })?.avatar).toBeNull();
    expect(toSaleContactView({ fullName: "A", phone: "0901111222", avatar: image("av") })?.avatar?.url).toBe("/api/media/file/av.webp");
  });

  it("avatar: whitelist trường công khai, không để lọt trường nội bộ (uploadedBy) vào props client", () => {
    const withInternal = image("av", { uploadedBy: "staff-uuid-bi-mat" });
    const avatar = toSaleContactView({ fullName: "A", phone: "0901111222", avatar: withInternal })?.avatar;
    expect(avatar).toEqual({ url: "/api/media/file/av.webp", alt: "Ảnh av", width: 1600 });
    expect(JSON.stringify(avatar)).not.toContain("staff-uuid-bi-mat");
  });
});

describe("searchCardToRentalCardData (DTO của SearchService -> cùng view model với thẻ tin tương tự)", () => {
  const dto: RentalSearchCard = {
    id: "9",
    code: "CT-000009",
    title: "Studio Ba Đình",
    slug: "studio-ba-dinh",
    status: "published",
    thumbnail: { url: "/api/media/file/studio-800.webp", alt: "Phòng khách" },
    priceMonthlyVnd: 8_500_000,
    priceNegotiable: false,
    areaM2: 32,
    bedrooms: 0,
    bathrooms: 1,
    furnishing: "full",
    province: { name: "Hà Nội", slug: "ha-noi" },
    ward: { name: "Phường Ba Đình", slug: "ba-dinh" },
    category: null,
    publishedAt: now,
  };

  it("link theo ngôn ngữ, khu vực 'Phường, Tỉnh', ảnh bìa có bề rộng để ResponsiveImage dựng được", () => {
    expect(searchCardToRentalCardData(dto, "vi")).toEqual({
      id: "9",
      title: "Studio Ba Đình",
      href: "/cho-thue/studio-ba-dinh",
      code: "CT-000009",
      priceMonthlyVnd: 8_500_000,
      priceNegotiable: false,
      areaM2: 32,
      bedrooms: 0,
      areaLabel: "Phường Ba Đình, Hà Nội",
      cover: { url: "/api/media/file/studio-800.webp", alt: "Phòng khách", width: 800 },
      rented: false,
      categoryLabel: null,
      furnishing: "full",
      bathrooms: 1,
    });
    expect(searchCardToRentalCardData(dto, "en").href).toBe("/en/for-rent/studio-ba-dinh");
  });

  it("thương lượng hoặc không giá -> giá null; không ảnh -> cover null; phòng ngủ null giữ null", () => {
    expect(searchCardToRentalCardData({ ...dto, priceNegotiable: true }, "vi")).toMatchObject({ priceMonthlyVnd: null, priceNegotiable: true });
    expect(searchCardToRentalCardData({ ...dto, priceMonthlyVnd: null }, "vi")).toMatchObject({ priceMonthlyVnd: null, priceNegotiable: false });
    expect(searchCardToRentalCardData({ ...dto, thumbnail: null, bedrooms: null }, "vi")).toMatchObject({ cover: null, bedrooms: null });
  });

  it("BL-052: danh mục của DTO → tag; tin đã thuê → rented", () => {
    expect(searchCardToRentalCardData({ ...dto, category: { name: "Căn hộ dịch vụ", slug: "can-ho-dich-vu" }, status: "rented" }, "vi")).toMatchObject({
      categoryLabel: "Căn hộ dịch vụ",
      rented: true,
    });
  });

  it("cùng kết quả với thẻ dựng từ doc Payload cho cùng dữ liệu (một component dùng chung)", () => {
    const fromDoc = toRentalCardData(rental({ gallery: [image("studio-800")], priceMonthlyVnd: 8_500_000, areaM2: 32, bedrooms: 0 }), "vi")!;
    const fromDto = searchCardToRentalCardData({ ...dto, province: { name: "TP.HCM", slug: "ho-chi-minh" }, ward: { name: "Phường Sài Gòn", slug: "sai-gon" }, title: "Căn hộ 2PN Quận 1", slug: "can-ho-2pn-quan-1", code: "CT-000001", id: "r1" }, "vi");
    expect(Object.keys(fromDto).sort()).toEqual(Object.keys(fromDoc).sort());
    expect(fromDto.areaLabel).toBe(fromDoc.areaLabel);
  });
});
