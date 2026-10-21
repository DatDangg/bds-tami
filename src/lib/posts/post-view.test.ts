import { describe, expect, it } from "vitest";
import { fakeMedia } from "@/components/media/test-utils";
import type { Category, Media, Project, PropertyPost, Rental } from "../../payload-types";
import { offerBadge, toPostCardData, toPostDetailView, toPostOfferView } from "./post-view";

const NOW = new Date("2026-10-18T03:00:00.000Z"); // 10:00 18/10/2026 giờ VN
const iso = "2026-01-01T00:00:00.000Z";
const category = { id: "c1", name: "Voucher", slug: "voucher", scope: "property_post", hasEnglish: true, updatedAt: iso, createdAt: iso } as unknown as Category;
const media = (name: string, extra: Record<string, unknown> = {}): Media =>
  ({ ...fakeMedia(name), id: name, mimeType: "image/webp", updatedAt: iso, createdAt: iso, ...extra }) as unknown as Media;

const post = (overrides: Partial<PropertyPost> = {}): PropertyPost => ({
  id: "p1",
  title: "Ưu đãi mùa thu",
  slug: "uu-dai-mua-thu",
  excerpt: "Giảm giá sâu",
  status: "published",
  author: "s1",
  publishedAt: "2026-10-01T03:00:00.000Z",
  category,
  cover: media("cover"),
  updatedAt: iso,
  createdAt: iso,
  ...overrides,
});
const endAt = (value: string) => ({ offer: { endAt: value } });

describe("offerBadge", () => {
  it("không có hạn → không badge; còn nhiều ngày → không badge", () => {
    expect(offerBadge(post(), NOW)).toBeNull();
    expect(offerBadge(post(endAt("2026-10-30T12:00:00.000Z")), NOW)).toBeNull();
  });

  it("còn ≤ 3 ngày → cảnh báo (0 = hết hạn hôm nay); 4 ngày → không", () => {
    expect(offerBadge(post(endAt("2026-10-18T12:00:00.000Z")), NOW)).toEqual({ kind: "endingSoon", daysLeft: 0 });
    expect(offerBadge(post(endAt("2026-10-21T12:00:00.000Z")), NOW)).toEqual({ kind: "endingSoon", daysLeft: 3 });
    expect(offerBadge(post(endAt("2026-10-22T12:00:00.000Z")), NOW)).toBeNull();
  });

  it("đã qua hạn (theo isOfferEnded, biên múi giờ VN) → ended", () => {
    expect(offerBadge(post(endAt("2026-10-17T12:00:00.000Z")), NOW)).toEqual({ kind: "ended" });
    // 23:59 VN ngày hạn vẫn còn hiệu lực, 00:00 ngày kế tiếp thì hết.
    expect(offerBadge(post(endAt("2026-10-18T12:00:00.000Z")), new Date("2026-10-18T16:59:59Z"))).toEqual({ kind: "endingSoon", daysLeft: 0 });
    expect(offerBadge(post(endAt("2026-10-18T12:00:00.000Z")), new Date("2026-10-18T17:00:00Z"))).toEqual({ kind: "ended" });
  });
});

describe("toPostCardData", () => {
  it("dựng thẻ: link theo locale, giá rút gọn, ngày, danh mục; ảnh chỉ còn trường công khai", () => {
    const card = toPostCardData(post({ priceVnd: 3_500_000_000, cover: media("cover", { uploadedBy: "secret-user" }) }), "vi", NOW);
    expect(card).toMatchObject({ href: "/tin-bds/uu-dai-mua-thu", categoryName: "Voucher", priceLabel: "3,5 tỷ", badge: null, endLabel: null });
    expect(JSON.stringify(card)).not.toContain("secret-user");
    expect(toPostCardData(post(), "en", NOW)?.href).toBe("/en/property-news/uu-dai-mua-thu");
  });

  it("giá: số tiền ưu tiên, không có thì ghi chú giá, không có cả hai thì rỗng", () => {
    expect(toPostCardData(post({ priceNote: "Liên hệ" }), "vi", NOW)?.priceLabel).toBe("Liên hệ");
    expect(toPostCardData(post({ priceVnd: 0 }), "vi", NOW)?.priceLabel).toBeNull();
  });

  it("có hạn: nhãn ngày + badge; bài thiếu tiêu đề/slug bị bỏ; danh mục chưa có bản EN không hiện ở /en", () => {
    expect(toPostCardData(post(endAt("2026-10-17T12:00:00.000Z")), "vi", NOW)).toMatchObject({ endLabel: "17/10/2026", badge: { kind: "ended" } });
    expect(toPostCardData(post({ slug: null }), "vi", NOW)).toBeNull();
    const noEnglish = { ...category, hasEnglish: false } as Category;
    expect(toPostCardData(post({ category: noEnglish }), "en", NOW)?.categoryName).toBeNull();
  });

  it("BL-052 thẻ voucher: có ưu đãi (hạn hoặc mã) VÀ không có giá lẫn diện tích; còn lại thẻ BĐS", () => {
    expect(toPostCardData(post(endAt("2026-10-30T12:00:00.000Z")), "vi", NOW)).toMatchObject({ kind: "voucher", hasOffer: true });
    expect(toPostCardData(post({ offer: { voucherCode: "THU2026" } }), "vi", NOW)).toMatchObject({ kind: "voucher", hasOffer: true, endLabel: null });
    // Tin bán kèm ưu đãi → thẻ BĐS (+ badge ưu đãi).
    expect(toPostCardData(post({ ...endAt("2026-10-30T12:00:00.000Z"), priceVnd: 2_000_000_000 }), "vi", NOW)).toMatchObject({ kind: "property", hasOffer: true });
    expect(toPostCardData(post({ offer: { voucherCode: "X" }, areaM2: 80 }), "vi", NOW)?.kind).toBe("property");
    // Không ưu đãi (mã rỗng, hạn hỏng) → thẻ BĐS dù không có giá / diện tích.
    expect(toPostCardData(post({ offer: { voucherCode: "  ", endAt: "khong-phai-ngay" } }), "vi", NOW)).toMatchObject({ kind: "property", hasOffer: false, endLabel: null });
  });

  it("BL-052 thẻ BĐS: loại hình, vị trí (phường, tỉnh), diện tích > 0, phòng ngủ; trống → null", () => {
    const ward = { id: "w1", name: "Phường Bến Nghé" } as PropertyPost["ward"];
    const province = { id: "p1", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM" } as PropertyPost["province"];
    expect(toPostCardData(post({ propertyType: "villa", ward, province, areaM2: 120.5, bedrooms: 0 }), "vi", NOW)).toMatchObject({
      propertyType: "villa",
      placeLabel: "Phường Bến Nghé, TP.HCM",
      areaM2: 120.5,
      bedrooms: 0,
    });
    expect(toPostCardData(post({ areaM2: 0, province: "p1" }), "vi", NOW)).toMatchObject({ propertyType: null, placeLabel: null, areaM2: null, bedrooms: null });
  });
});

describe("toPostOfferView", () => {
  const none = { project: null, rental: null };

  it("bài không có gì để hiện (không giá/khu vực/ưu đãi/liên quan) → null", () => {
    expect(toPostOfferView(post(), "vi", NOW, none)).toBeNull();
  });

  it("ưu đãi còn hạn: mã voucher + điều khoản + thời hạn", () => {
    const view = toPostOfferView(post({ offer: { startAt: "2026-10-01T12:00:00.000Z", endAt: "2026-10-30T12:00:00.000Z", voucherCode: " TAMI500 ", terms: "Áp dụng 1 lần" } }), "vi", NOW, none);
    expect(view).toMatchObject({ ended: false, voucherCode: "TAMI500", terms: "Áp dụng 1 lần", period: { startLabel: "01/10/2026", endLabel: "30/10/2026" }, badge: null });
  });

  it("ưu đãi đã kết thúc: mã voucher bị ẩn (BR-06) nhưng khối vẫn có, kèm badge ended", () => {
    const view = toPostOfferView(post({ offer: { endAt: "2026-10-17T12:00:00.000Z", voucherCode: "TAMI500" } }), "vi", NOW, none);
    expect(view).toMatchObject({ ended: true, voucherCode: null, badge: { kind: "ended" } });
    expect(JSON.stringify(view)).not.toContain("TAMI500");
  });

  it("giá đầy đủ, khu vực phường/tỉnh; dự án/tin cho thuê liên quan lấy ảnh thư viện đầu tiên và bỏ trường nội bộ", () => {
    const project = { id: "pr1", title: "Dự án A", slug: "du-an-a", gallery: [media("pg", { uploadedBy: "secret-user" })] } as unknown as Project;
    const rental = { id: "r1", title: "Căn hộ B", slug: "can-ho-b", gallery: [] } as unknown as Rental;
    const view = toPostOfferView(
      post({
        priceVnd: 5_500_000,
        ward: { id: "w", name: "Phường Sài Gòn" } as never,
        province: { id: "p", name: "Thành phố Hồ Chí Minh", shortName: "TP.HCM" } as never,
      }),
      "vi",
      NOW,
      { project, rental },
    );
    expect(view).toMatchObject({ price: "5.500.000 ₫", areaLabel: "Phường Sài Gòn, TP.HCM" });
    expect(view?.related.map((item) => [item.kind, item.href, item.image !== null])).toEqual([
      ["project", "/du-an/du-an-a", true],
      ["rental", "/cho-thue/can-ho-b", false],
    ]);
    expect(JSON.stringify(view)).not.toContain("secret-user");
  });

  it("chỉ có tên và slug mới dựng được thẻ liên quan", () => {
    const view = toPostOfferView(post({ priceNote: "Thương lượng" }), "vi", NOW, { project: { id: "x" } as Project, rental: null });
    expect(view?.related).toEqual([]);
  });
});

describe("toPostDetailView", () => {
  it("thư viện chỉ giữ ảnh dùng được, alt dự phòng theo tiêu đề; cover có alt dự phòng", () => {
    const view = toPostDetailView(post({ gallery: [media("g1"), "id-bi-xoa", media("g2", { alt: "  " })] }), "vi");
    expect(view.gallery.map((image) => image.alt)).toEqual(["Ảnh g1", "Ưu đãi mùa thu - 3"]);
    expect(view.cover?.alt).toBe("Ảnh cover");
    expect(view.category).toEqual({ label: "Voucher", href: "/tin-bds/danh-muc/voucher" });
  });
});
