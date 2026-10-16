import { describe, expect, it } from "vitest";
import { approximateLocation, circlePolygon, isValidLocation } from "./map-geometry";
import { listCandidates, pickGeneratedSize } from "./ResponsiveImage";

function haversineMeters(a: [number, number], b: [number, number]) {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

describe("circlePolygon", () => {
  const center = { lat: 10.7769, lng: 106.7009 };
  const ring = circlePolygon(center, 300);

  it("khép kín và mọi điểm cách tâm 300 m", () => {
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const point of ring) expect(haversineMeters([center.lng, center.lat], point)).toBeCloseTo(300, 0);
  });
});

describe("isValidLocation", () => {
  it("chỉ nhận toạ độ hữu hạn trong biên", () => {
    expect(isValidLocation({ lat: 10.7, lng: 106.7 })).toBe(true);
    expect(isValidLocation({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidLocation({ lat: 0, lng: -181 })).toBe(false);
    expect(isValidLocation({ lat: Number.NaN, lng: 0 })).toBe(false);
    expect(isValidLocation({ lat: 1 })).toBe(false);
    expect(isValidLocation(null)).toBe(false);
  });
});

describe("pickGeneratedSize", () => {
  const candidates = [
    { url: "thumb", width: 400 },
    { url: "card", width: 800 },
    { url: "large", width: 1600 },
    { url: "original", width: 3000 },
  ];

  it("chọn cỡ nhỏ nhất còn đủ rộng", () => {
    expect(pickGeneratedSize(candidates, 320)).toBe("thumb");
    expect(pickGeneratedSize(candidates, 640)).toBe("card");
    expect(pickGeneratedSize(candidates, 1200)).toBe("large");
  });

  it("yêu cầu lớn hơn mọi cỡ thì lấy cỡ lớn nhất", () => {
    expect(pickGeneratedSize(candidates, 3840)).toBe("original");
  });

  it("ảnh nhỏ thiếu cỡ đích thì rơi về ảnh gốc", () => {
    expect(pickGeneratedSize([{ url: "thumb", width: 400 }, { url: "original", width: 600 }], 1600)).toBe("original");
  });
});

describe("listCandidates", () => {
  const media = {
    url: "original",
    width: 3000,
    sizes: { thumb: { url: "thumb", width: 400 }, card: { url: "card", width: 800 }, large: { url: "large", width: 1600 } },
  };

  it("có cỡ đã sinh thì KHÔNG đưa ảnh gốc vào danh sách, yêu cầu 1920 trả về large", () => {
    const candidates = listCandidates(media);
    expect(candidates.map((candidate) => candidate.url)).toEqual(["thumb", "card", "large"]);
    expect(pickGeneratedSize(candidates, 1920)).toBe("large");
    expect(pickGeneratedSize(candidates, 3840)).toBe("large");
  });

  it("chỉ dùng ảnh gốc khi không có cỡ nào được sinh", () => {
    expect(listCandidates({ url: "original", width: 3000 }).map((candidate) => candidate.url)).toEqual(["original"]);
    expect(listCandidates({ url: "original", width: 3000, sizes: { thumb: { url: null, width: null } } }).map((candidate) => candidate.url)).toEqual(["original"]);
    expect(listCandidates({})).toEqual([]);
  });
});

describe("approximateLocation", () => {
  it("làm tròn về lưới 0,001 độ và vòng 300 m quanh điểm đó vẫn chứa vị trí thật", () => {
    const real = { lat: 10.77694, lng: 106.70096 };
    const rounded = approximateLocation(real);
    expect(rounded).toEqual({ lat: 10.777, lng: 106.701 });
    const ring = circlePolygon(rounded, 300);
    const toCenter = haversineMeters([real.lng, real.lat], [rounded.lng, rounded.lat]);
    expect(toCenter).toBeLessThan(300);
    expect(ring).toHaveLength(65);
  });

  it("độ lệch tối đa của mọi toạ độ dưới 300 m (kể cả vĩ độ cao)", () => {
    for (const real of [{ lat: 10.7774999, lng: 106.7005001 }, { lat: 21.0285, lng: 105.8542 }, { lat: 8.5555, lng: 104.9995 }]) {
      const rounded = approximateLocation(real);
      expect(haversineMeters([real.lng, real.lat], [rounded.lng, rounded.lat])).toBeLessThan(100);
    }
  });
});
