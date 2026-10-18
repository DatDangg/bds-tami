import { describe, expect, it } from "vitest";

import { isOfferEnded, offerEndedWhere, offerJustEndedWhere, offerNotEndedWhere } from "./offer-status";

const endAt = (iso: string | null | undefined) => ({ offer: { endAt: iso } });

describe("isOfferEnded (biên múi giờ VN, BR-06)", () => {
  it("không có ưu đãi hoặc không có endAt → chưa hết hạn", () => {
    const now = new Date("2026-10-18T00:00:00Z");
    expect(isOfferEnded({}, now)).toBe(false);
    expect(isOfferEnded({ offer: null }, now)).toBe(false);
    expect(isOfferEnded(endAt(null), now)).toBe(false);
    expect(isOfferEnded(endAt(undefined), now)).toBe(false);
    expect(isOfferEnded(endAt(""), now)).toBe(false);
  });

  it("giá trị ngày hỏng → coi như không có hạn (không gắn nhầm 'Đã kết thúc')", () => {
    expect(isOfferEnded(endAt("không-phải-ngày"), new Date("2030-01-01T00:00:00Z"))).toBe(false);
  });

  it("hết ngày endAt giờ VN mới kết thúc: 23:59:59 VN còn hiệu lực, 00:00 ngày kế tiếp thì đã kết thúc", () => {
    // Ô chọn ngày của admin ghim 12:00 UTC của ngày được chọn (= 19:00 VN cùng ngày).
    const pickerValue = endAt("2026-10-17T12:00:00.000Z");
    expect(isOfferEnded(pickerValue, new Date("2026-10-17T00:00:00Z"))).toBe(false);
    expect(isOfferEnded(pickerValue, new Date("2026-10-17T16:59:59.999Z"))).toBe(false);
    expect(isOfferEnded(pickerValue, new Date("2026-10-17T17:00:00.000Z"))).toBe(true);
    expect(isOfferEnded(pickerValue, new Date("2026-10-19T00:00:00Z"))).toBe(true);
  });

  it("mốc nửa đêm VN và cuối ngày VN của cùng một ngày cho cùng kết quả (không cắt chuỗi UTC)", () => {
    const afterBoundary = new Date("2026-10-17T17:00:00Z");
    expect(isOfferEnded(endAt("2026-10-16T17:00:00.000Z"), afterBoundary)).toBe(true); // 00:00 VN ngày 17
    expect(isOfferEnded(endAt("2026-10-17T16:59:59.000Z"), afterBoundary)).toBe(true); // 23:59:59 VN ngày 17
    expect(isOfferEnded(endAt("2026-10-17T17:00:00.000Z"), afterBoundary)).toBe(false); // 00:00 VN ngày 18 = còn hiệu lực hết ngày 18
  });
});

describe("điều kiện truy vấn khớp isOfferEnded", () => {
  const nows = ["2026-10-17T16:59:59.999Z", "2026-10-17T17:00:00.000Z", "2026-10-18T00:05:00.000Z", "2026-10-18T16:59:59.999Z"].map((iso) => new Date(iso));
  const endAts = [
    null,
    "2026-10-16T12:00:00.000Z",
    "2026-10-16T17:00:00.000Z",
    "2026-10-17T12:00:00.000Z",
    "2026-10-17T16:59:59.000Z",
    "2026-10-17T17:00:00.000Z",
    "2026-10-18T12:00:00.000Z",
  ];

  /** Đánh giá `offerNotEndedWhere` trên một giá trị endAt (so sánh ISO theo mốc thời gian). */
  function matchesNotEnded(value: string | null, now: Date): boolean {
    const [missing, atLeast] = (offerNotEndedWhere(now) as { or: Array<Record<string, Record<string, unknown>>> }).or;
    if (missing!["offer.endAt"]!.exists === false) {
      if (value === null) return true;
    }
    return value !== null && Date.parse(value) >= Date.parse(atLeast!["offer.endAt"]!.greater_than_equal as string);
  }

  it("offerNotEndedWhere = phủ định chính xác của isOfferEnded với mọi tổ hợp mốc hạn x thời điểm", () => {
    for (const now of nows) {
      for (const value of endAts) expect(matchesNotEnded(value, now)).toBe(!isOfferEnded(endAt(value), now));
    }
  });

  it("offerEndedWhere = có hạn và hạn < 00:00 hôm nay giờ VN, khớp isOfferEnded với mọi tổ hợp", () => {
    for (const now of nows) {
      const [exists, before] = (offerEndedWhere(now) as { and: Array<Record<string, Record<string, unknown>>> }).and;
      expect(exists!["offer.endAt"]).toEqual({ exists: true });
      for (const value of endAts) {
        const matches = value !== null && Date.parse(value) < Date.parse(before!["offer.endAt"]!.less_than as string);
        expect(matches).toBe(isOfferEnded(endAt(value), now));
      }
    }
  });

  it("offerJustEndedWhere = đúng ngày hôm qua giờ VN, nửa mở [00:00 hôm qua, 00:00 hôm nay)", () => {
    expect(offerJustEndedWhere(new Date("2026-10-18T00:05:00Z"))).toEqual({
      and: [
        { "offer.endAt": { greater_than_equal: "2026-10-16T17:00:00.000Z" } },
        { "offer.endAt": { less_than: "2026-10-17T17:00:00.000Z" } },
      ],
    });
    // 00:05 VN ngày 18 = 17:05 UTC ngày 17 (giờ chạy thật của job).
    expect(offerJustEndedWhere(new Date("2026-10-17T17:05:00Z"))).toEqual({
      and: [
        { "offer.endAt": { greater_than_equal: "2026-10-16T17:00:00.000Z" } },
        { "offer.endAt": { less_than: "2026-10-17T17:00:00.000Z" } },
      ],
    });
  });
});
