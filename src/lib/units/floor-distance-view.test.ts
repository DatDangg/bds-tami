import { describe, expect, it } from "vitest";

import vi from "../../i18n/messages/vi.json";
import en from "../../i18n/messages/en.json";
import { formatDistance, formatFloor, toDistanceView, toFloorView } from "./floor-distance-view";

const lookup = (messages: Record<string, unknown>, key: string, values?: Record<string, string | number>) => {
  const raw = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages) as string;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(values?.[name]));
};
const tFloor = (messages: typeof vi) => (key: string, values?: Record<string, string | number>) => lookup(messages.page.rentalDetail as Record<string, unknown>, key, values);
const tDistance = (messages: typeof vi) => (key: string, values?: Record<string, string | number>) => lookup(messages.page.projectDetail as Record<string, unknown>, key, values);

describe("tầng theo ngôn ngữ (BL-065)", () => {
  it("số tầng ưu tiên hơn mức tầng", () => {
    expect(toFloorView({ floorNumber: 7, floorLevel: "high" }, "vi")).toEqual({ kind: "number", number: 7 });
    expect(formatFloor(toFloorView({ floorNumber: 7 }, "vi"), tFloor(vi))).toBe("Tầng 7");
    expect(formatFloor(toFloorView({ floorNumber: 7 }, "en"), tFloor(en))).toBe("Floor 7");
  });

  it("chỉ mức tầng", () => {
    expect(formatFloor(toFloorView({ floorLevel: "high" }, "vi"), tFloor(vi))).toBe("Tầng cao");
    expect(formatFloor(toFloorView({ floorLevel: "mid" }, "en"), tFloor(en))).toBe("Mid floor");
    expect(formatFloor(toFloorView({ floorLevel: "low" }, "en"), tFloor(en))).toBe("Low floor");
  });

  it("giá trị cũ chỉ hiện ở /vi", () => {
    expect(formatFloor(toFloorView({ floor: " 3.4.5.6 " }, "vi"), tFloor(vi))).toBe("3.4.5.6");
    expect(toFloorView({ floor: "3.4.5.6" }, "en")).toBeNull();
    expect(toFloorView({ floor: "  " }, "vi")).toBeNull();
    expect(toFloorView({}, "vi")).toBeNull();
  });

  it("có trường mới thì bỏ giá trị cũ; số tầng 0 vẫn là số", () => {
    expect(toFloorView({ floorLevel: "low", floor: "Tầng cao" }, "vi")).toEqual({ kind: "level", level: "low" });
    expect(toFloorView({ floorNumber: 0 }, "vi")).toEqual({ kind: "number", number: 0 });
  });
});

describe("khoảng cách theo ngôn ngữ (BL-065)", () => {
  it("số + đơn vị, dấu thập phân theo ngôn ngữ", () => {
    expect(formatDistance(toDistanceView({ distanceValue: 1.2, distanceUnit: "km" }, "vi"), tDistance(vi), "vi")).toBe("1,2 km");
    expect(formatDistance(toDistanceView({ distanceValue: 1.2, distanceUnit: "km" }, "en"), tDistance(en), "en")).toBe("1.2 km");
    expect(formatDistance(toDistanceView({ distanceValue: 800, distanceUnit: "m" }, "en"), tDistance(en), "en")).toBe("800 m");
    expect(formatDistance(toDistanceView({ distanceValue: 15, distanceUnit: "min" }, "vi"), tDistance(vi), "vi")).toBe("15 phút");
    expect(formatDistance(toDistanceView({ distanceValue: 15, distanceUnit: "min" }, "en"), tDistance(en), "en")).toBe("15 min");
  });

  it("thiếu số hoặc đơn vị → không chip (kể cả khi còn giá trị cũ)", () => {
    expect(toDistanceView({ distanceValue: 5 }, "vi")).toBeNull();
    expect(toDistanceView({ distanceUnit: "km", distance: "1 km" }, "vi")).toBeNull();
  });

  it("giá trị cũ chỉ hiện ở /vi khi chưa có trường mới", () => {
    expect(formatDistance(toDistanceView({ distance: "gần chợ" }, "vi"), tDistance(vi), "vi")).toBe("gần chợ");
    expect(toDistanceView({ distance: "gần chợ" }, "en")).toBeNull();
    expect(toDistanceView({ distance: " " }, "vi")).toBeNull();
  });
});
