import { describe, expect, it } from "vitest";
import { buildContactPageView } from "./contact-view";

describe("buildContactPageView", () => {
  it("không có mapLocation (hoặc settings lỗi) → mapLocation null để trang ẩn bản đồ", () => {
    expect(buildContactPageView({ hotline: "0900 000 000" }).mapLocation).toBeNull();
    expect(buildContactPageView({ mapLocation: null }).mapLocation).toBeNull();
    expect(buildContactPageView(null)).toEqual({ contact: {}, socials: [], mapLocation: null });
  });

  it("đổi [kinh độ, vĩ độ] của Payload thành {lat, lng}; toạ độ ngoài phạm vi → null", () => {
    expect(buildContactPageView({ mapLocation: [106.7, 10.78] }).mapLocation).toEqual({ lat: 10.78, lng: 106.7 });
    expect(buildContactPageView({ mapLocation: [200, 95] }).mapLocation).toBeNull();
  });

  it("hotline thành tel:, link mạng xã hội chỉ nhận http(s)", () => {
    const view = buildContactPageView({
      hotline: "0900 123 456",
      email: " a@b.vn ",
      address: "1 Lê Lợi",
      socialLinks: [
        { platform: "facebook", url: "https://facebook.com/tami" },
        { platform: "other", url: "javascript:alert(1)" },
      ],
    });
    expect(view.contact).toEqual({ hotline: { label: "0900 123 456", telHref: "tel:0900123456" }, email: "a@b.vn", address: "1 Lê Lợi" });
    expect(view.socials).toEqual([{ platform: "facebook", url: "https://facebook.com/tami" }]);
  });
});
