import { describe, expect, it } from "vitest";

import { describeLeadLink, mailtoHref, summarizeLeadActivity, telHref, zaloNumber } from "./lead-contact";

describe("describeLeadLink", () => {
  it("rút gọn host + path, có href cho https", () => {
    const link = describeLeadLink("https://tami.vn/du-an/abc?utm_source=x");
    expect(link).toEqual({ href: "https://tami.vn/du-an/abc?utm_source=x", label: "tami.vn/du-an/abc" });
  });
  it("cắt dài bằng …", () => {
    expect(describeLeadLink(`https://tami.vn/${"a".repeat(100)}`)?.label.endsWith("…")).toBe(true);
  });
  it("chặn javascript:/data: (chỉ chữ, không href)", () => {
    expect(describeLeadLink("javascript:alert(1)")?.href).toBeUndefined();
    expect(describeLeadLink("data:text/html,x")?.href).toBeUndefined();
    expect(describeLeadLink("not a url")?.href).toBeUndefined();
  });
  it("rỗng → null", () => {
    expect(describeLeadLink("  ")).toBeNull();
    expect(describeLeadLink(undefined)).toBeNull();
  });
});

describe("liên hệ", () => {
  it("zalo chuẩn hoá về 0xxxxxxxxx", () => {
    expect(zaloNumber("+84 956 789 012")).toBe("0956789012");
    expect(zaloNumber("84956789012")).toBe("0956789012");
    expect(zaloNumber("0956.789.012")).toBe("0956789012");
    expect(zaloNumber("123")).toBeNull();
  });
  it("tel/mailto", () => {
    expect(telHref("+84 956 789 012")).toBe("tel:+84956789012");
    expect(telHref("abc")).toBeNull();
    expect(mailtoHref("a@b.vn")).toBe("mailto:a@b.vn");
    expect(mailtoHref("a b@c")).toBeNull();
  });
});

describe("summarizeLeadActivity", () => {
  const now = new Date("2026-10-21T10:00:00Z");
  it("đủ phần", () => {
    expect(summarizeLeadActivity({ lastActivityAt: "2026-10-21T08:00:00Z", firstContactedAt: "2026-10-20T02:30:00Z", mergedCount: 2 }, now)).toBe(
      "Hoạt động gần nhất: 2 giờ trước · Liên hệ lần đầu: 20/10/2026 09:30 · Khách gửi lại 2 lần",
    );
  });
  it("bỏ phần trống", () => {
    expect(summarizeLeadActivity({ mergedCount: 0 }, now)).toBe("");
    expect(summarizeLeadActivity({ lastActivityAt: "2026-10-21T08:00:00Z" }, now)).toBe("Hoạt động gần nhất: 2 giờ trước");
  });
});
