import { describe, expect, it } from "vitest";

import { parseMapLocationInput } from "./map-location-parse";

describe("parseMapLocationInput: cặp số", () => {
  it.each([
    ["10.7769, 106.7009", { lat: 10.7769, lng: 106.7009 }],
    ["10.7769,106.7009", { lat: 10.7769, lng: 106.7009 }],
    ["  10.7769 ,   106.7009  ", { lat: 10.7769, lng: 106.7009 }],
    ["10.7769 106.7009", { lat: 10.7769, lng: 106.7009 }],
    ["-33.8688, 151.2093", { lat: -33.8688, lng: 151.2093 }],
    ["21, 105", { lat: 21, lng: 105 }],
  ])("%s", (input, expected) => {
    expect(parseMapLocationInput(input)).toEqual(expected);
  });

  it("dán ngược kinh độ, vĩ độ → reversed", () => {
    expect(parseMapLocationInput("106.7009, 10.7769")).toEqual({ error: "reversed" });
  });

  it("ngoài biên ±90/±180 thì không đọc được", () => {
    expect(parseMapLocationInput("91, 191")).toBeNull();
    expect(parseMapLocationInput("10, 181")).toBeNull();
  });
});

describe("parseMapLocationInput: link Google Maps đầy đủ", () => {
  it("/@lat,lng,zoom", () => {
    expect(parseMapLocationInput("https://www.google.com/maps/@10.7769,106.7009,17z")).toEqual({ lat: 10.7769, lng: 106.7009 });
  });

  it.each(["q", "query", "ll"])("?%s=lat,lng", (key) => {
    expect(parseMapLocationInput(`https://www.google.com/maps?${key}=10.7769,106.7009`)).toEqual({ lat: 10.7769, lng: 106.7009 });
  });

  it("?q=lat%2Clng (đã mã hoá) và kèm tham số sau", () => {
    expect(parseMapLocationInput("https://maps.google.com/?q=10.7769%2C106.7009&z=15")).toEqual({ lat: 10.7769, lng: 106.7009 });
  });

  it("ưu tiên !3d!4d (ghim) hơn @ (tâm khung nhìn)", () => {
    const url = "https://www.google.com/maps/place/Ben+Thanh/@10.7700,106.7000,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d10.7725!4d106.6980";
    expect(parseMapLocationInput(url)).toEqual({ lat: 10.7725, lng: 106.698 });
  });

  it("link không có toạ độ (chỉ tên địa điểm) thì không đọc được", () => {
    expect(parseMapLocationInput("https://www.google.com/maps/place/Ben+Thanh+Market")).toBeNull();
    expect(parseMapLocationInput("https://www.google.com/maps?q=Ho+Chi+Minh")).toBeNull();
  });
});

describe("parseMapLocationInput: link rút gọn và rác", () => {
  it.each(["https://maps.app.goo.gl/abc123XYZ", "maps.app.goo.gl/abc123", "https://goo.gl/maps/AbCdEf"])("%s", (input) => {
    expect(parseMapLocationInput(input)).toEqual({ error: "short-link" });
  });

  it.each(["", "   ", "xin chào", "abc, def", "10.7769", "1,2,3"])("rác %j", (input) => {
    expect(parseMapLocationInput(input)).toBeNull();
  });
});
