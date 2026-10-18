// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { captureUtm, parseUtmFromSearch, readUtm } from "./utm";

beforeEach(() => window.sessionStorage.clear());

describe("utm", () => {
  it("chỉ lấy utm_* không rỗng và cắt giá trị dài", () => {
    expect(parseUtmFromSearch("?utm_source=fb&utm_medium=&foo=1&utm_term=" + "x".repeat(300))).toEqual({ source: "fb", term: "x".repeat(200) });
    expect(parseUtmFromSearch("?foo=1")).toBeUndefined();
  });

  it("giữ ở sessionStorage; URL mới có UTM thì ghi đè; storage hỏng thì bỏ qua", () => {
    captureUtm("?utm_source=fb");
    expect(readUtm("")).toEqual({ source: "fb" });
    captureUtm("?utm_source=zalo&utm_campaign=c");
    expect(readUtm("")).toEqual({ source: "zalo", campaign: "c" });
    window.sessionStorage.setItem("tami.utm", "không phải json");
    expect(readUtm("")).toBeUndefined();
  });
});
