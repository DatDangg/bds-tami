import { describe, expect, it } from "vitest";

import { parseLegacyDistance, parseLegacyFloor } from "./legacy-parse";

describe("parseLegacyFloor (BL-065)", () => {
  it.each([
    ["Tầng cao", { kind: "level", level: "high" }],
    ["Tầng trung", { kind: "level", level: "mid" }],
    ["Tầng thấp", { kind: "level", level: "low" }],
    ["  tầng CAO  ", { kind: "level", level: "high" }],
    ["Tầng 3", { kind: "number", number: 3 }],
    ["Tầng 7", { kind: "number", number: 7 }],
    ["tầng   12", { kind: "number", number: 12 }],
    ["Tầng 0", { kind: "number", number: 0 }],
  ])("%s → chuẩn hoá", (text, expected) => expect(parseLegacyFloor(text)).toEqual(expected));

  it.each([null, undefined, "", "   "])("rỗng %j", (text) => expect(parseLegacyFloor(text)).toEqual({ kind: "empty" }));

  it.each(["3.4.5.6", "Tầng trệt", "12", "Tầng 3-5", "Tầng 2.5", "Tầng cao nhất", "Lầu 3"])("không đoán: %s", (text) =>
    expect(parseLegacyFloor(text)).toEqual({ kind: "unparsed" }),
  );
});

describe("parseLegacyDistance (BL-065)", () => {
  it.each([
    ["1,2 km", 1.2, "km"],
    ["1,8 km", 1.8, "km"],
    ["2,5 km", 2.5, "km"],
    ["1.5 km", 1.5, "km"],
    ["1 km", 1, "km"],
    ["800 m", 800, "m"],
    ["500m", 500, "m"],
    ["15 phút", 15, "min"],
    ["  5 PHÚT ", 5, "min"],
    ["300 M", 300, "m"],
  ])("%s → %s %s", (text, value, unit) => expect(parseLegacyDistance(text)).toEqual({ kind: "ok", value, unit }));

  it.each([null, undefined, "", "  "])("rỗng %j", (text) => expect(parseLegacyDistance(text)).toEqual({ kind: "empty" }));

  it.each(["gần", "5", "1,2", "km 1", "1,2,3 km", "5 giờ", "1 km 2", "1,2 kmm", "~800 m"])("không đoán: %s", (text) =>
    expect(parseLegacyDistance(text)).toEqual({ kind: "unparsed" }),
  );
});
