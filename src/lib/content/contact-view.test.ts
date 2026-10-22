import { describe, expect, it } from "vitest";
import { buildContactCards, buildContactPageView, buildOffices, directionsUrl } from "./contact-view";

const FALLBACK = "Văn phòng TAMI";

describe("buildContactPageView", () => {
  it("settings lỗi/null → view rỗng, trang vẫn dựng", () => {
    expect(buildContactPageView(null, FALLBACK)).toEqual({ contact: {}, socials: [], cards: {}, offices: [] });
  });

  it("hotline thành tel:, link mạng xã hội chỉ nhận http(s) (JSON-LD giữ như cũ)", () => {
    const view = buildContactPageView(
      {
        hotline: "0900 123 456",
        email: " a@b.vn ",
        address: "1 Lê Lợi",
        socialLinks: [
          { platform: "facebook", url: "https://facebook.com/tami" },
          { platform: "other", url: "javascript:alert(1)" },
        ],
      },
      FALLBACK,
    );
    expect(view.contact).toEqual({ hotline: { label: "0900 123 456", telHref: "tel:0900123456" }, email: "a@b.vn", address: "1 Lê Lợi" });
    expect(view.socials).toEqual([{ platform: "facebook", url: "https://facebook.com/tami" }]);
  });
});

describe("buildContactCards", () => {
  it("đủ dữ liệu → 4 thẻ; Zalo hiện siteName, chỉ nhận zaloUrl http(s)", () => {
    expect(
      buildContactCards({ hotline: "1900 0000", email: "info@tami.vn", siteName: "TAMI HOMES", zaloUrl: "https://zalo.me/123", workingHours: { hours: "8:00 – 18:00", days: "Thứ 2 – Chủ nhật" } }),
    ).toEqual({
      hotline: { label: "1900 0000", telHref: "tel:19000000" },
      email: "info@tami.vn",
      zalo: { name: "TAMI HOMES", url: "https://zalo.me/123" },
      workingHours: { hours: "8:00 – 18:00", days: "Thứ 2 – Chủ nhật" },
    });
    expect(buildContactCards({ siteName: "TAMI", zaloUrl: "javascript:alert(1)" }).zalo).toBeUndefined();
  });

  it("workingHours rỗng → không có thẻ Giờ làm việc; chỉ có days → days lên dòng chính", () => {
    expect(buildContactCards({ workingHours: { hours: " ", days: null } }).workingHours).toBeUndefined();
    expect(buildContactCards({ workingHours: null }).workingHours).toBeUndefined();
    expect(buildContactCards({ workingHours: { hours: "", days: "Thứ 2 – Thứ 7" } }).workingHours).toEqual({ hours: "Thứ 2 – Thứ 7" });
  });
});

describe("buildOffices", () => {
  const image = { url: "/media/office.jpg", alt: "", width: 800, filename: "office.jpg", mimeType: "image/jpeg" };

  it("hàng offices → view (toạ độ [kinh độ, vĩ độ] → {lat, lng}, tel:, chỉ đường theo toạ độ, ảnh chỉ giữ trường cần)", () => {
    const [office] = buildOffices(
      { offices: [{ id: "a", name: "Văn phòng Hà Nội", address: "Lô A, Tây Hồ", location: [105.81, 21.07], phone: "1900 0000", email: "hn@tami.vn", image }] },
      FALLBACK,
    );
    expect(office).toEqual({
      id: "a",
      name: "Văn phòng Hà Nội",
      address: "Lô A, Tây Hồ",
      location: { lat: 21.07, lng: 105.81 },
      phone: { label: "1900 0000", telHref: "tel:19000000" },
      email: "hn@tami.vn",
      image: { url: "/media/office.jpg", alt: "", width: 800 },
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=21.07%2C105.81",
    });
  });

  it("/en: bỏ hàng thiếu name/address EN (null vì fallbackLocale false); toạ độ sai → không bản đồ, chỉ đường theo địa chỉ", () => {
    const offices = buildOffices(
      {
        offices: [
          { id: "a", name: null, address: "x" },
          { id: "b", name: "HCMC office", address: "1 Le Loi", location: [200, 95] },
        ],
      },
      FALLBACK,
    );
    expect(offices.map((o) => o.id)).toEqual(["b"]);
    expect(offices[0]?.location).toBeNull();
    expect(offices[0]?.directionsUrl).toBe("https://www.google.com/maps/dir/?api=1&destination=1%20Le%20Loi");
  });

  it("offices trống (hoặc mọi hàng bị lọc) → 1 văn phòng từ address / mapLocation / hotline / email cũ", () => {
    const legacy = { address: "1 Lê Lợi, Quận 1", mapLocation: [106.7, 10.78] as [number, number], hotline: "0900 123 456", email: "lienhe@tami.vn" };
    const expected = [
      {
        id: "office-main",
        name: FALLBACK,
        address: "1 Lê Lợi, Quận 1",
        location: { lat: 10.78, lng: 106.7 },
        phone: { label: "0900 123 456", telHref: "tel:0900123456" },
        email: "lienhe@tami.vn",
        directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=10.78%2C106.7",
      },
    ];
    expect(buildOffices({ ...legacy, offices: [] }, FALLBACK)).toEqual(expected);
    expect(buildOffices({ ...legacy, offices: [{ name: "", address: "" }] }, FALLBACK)).toEqual(expected);
  });

  it("không có cả văn phòng lẫn trường cũ → rỗng (trang ẩn khối văn phòng)", () => {
    expect(buildOffices({ offices: null }, FALLBACK)).toEqual([]);
    expect(buildOffices({ hotline: "  " }, FALLBACK)).toEqual([]);
  });

  it("chỉ đường: không toạ độ lẫn địa chỉ → không có link", () => {
    expect(directionsUrl(null, undefined)).toBeUndefined();
  });
});
