import { afterEach, describe, expect, it } from "vitest";
import {
  CONSENT_COOKIE,
  clearGoogleAnalyticsCookies,
  currentConsent,
  isValidGaMeasurementId,
  parseConsent,
  readConsent,
  writeConsent,
} from "./consent-cookie";

const DAY_MS = 24 * 60 * 60 * 1000;
const encode = (value: unknown) => encodeURIComponent(JSON.stringify(value));

function expireCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

afterEach(() => {
  for (const name of [CONSENT_COOKIE, "_ga", "_ga_ABC123", "_gid"]) expireCookie(name);
});

describe("parseConsent", () => {
  it.each([
    ["rỗng", ""],
    ["không phải JSON", "%7Bhong"],
    ["JSON nhưng không phải object", encode("x")],
    ["thiếu analytics", encode({ v: 1, ts: Date.now() })],
    ["analytics sai kiểu", encode({ v: 1, analytics: "true", ts: Date.now() })],
    ["sai phiên bản v", encode({ v: 2, analytics: true, ts: Date.now() })],
    ["ts không phải số", encode({ v: 1, analytics: true, ts: "now" })],
    ["pv sai kiểu", encode({ v: 1, analytics: true, ts: Date.now(), pv: 3 })],
    ["quá 12 tháng", encode({ v: 1, analytics: true, ts: Date.now() - 400 * DAY_MS })],
    ["ts ở tương lai xa", encode({ v: 1, analytics: true, ts: Date.now() + 400 * DAY_MS })],
  ])("cookie %s → coi như chưa chọn (null)", (_label, raw) => {
    expect(parseConsent(raw)).toBeNull();
  });

  it("cookie hợp lệ → bản ghi; thiếu pv → chuỗi rỗng", () => {
    const ts = Date.now();
    expect(parseConsent(encode({ v: 1, analytics: true, ts, pv: "1.2" }))).toEqual({ v: 1, analytics: true, ts, pv: "1.2" });
    expect(parseConsent(encode({ v: 1, analytics: false, ts }))?.pv).toBe("");
  });
});

describe("currentConsent", () => {
  it("đổi privacyPolicyVersion → null (hỏi lại)", () => {
    const record = { v: 1 as const, analytics: true, ts: Date.now(), pv: "1" };
    expect(currentConsent(record, "1")).toBe(record);
    expect(currentConsent(record, "2")).toBeNull();
    expect(currentConsent(null, "1")).toBeNull();
  });
});

describe("ghi / đọc cookie", () => {
  it("writeConsent rồi readConsent trả đúng lựa chọn", () => {
    writeConsent(true, "v7");
    expect(readConsent()).toMatchObject({ v: 1, analytics: true, pv: "v7" });
    writeConsent(false, "v7");
    expect(readConsent()?.analytics).toBe(false);
  });

  it("cookie tami_consent hỏng trong trình duyệt → readConsent null", () => {
    document.cookie = `${CONSENT_COOKIE}=khong-phai-json; Path=/`;
    expect(readConsent()).toBeNull();
  });
});

describe("clearGoogleAnalyticsCookies", () => {
  it("xoá _ga, _ga_<ID>, _gid nhưng giữ cookie khác", () => {
    document.cookie = "_ga=GA1.1.1; Path=/";
    document.cookie = "_ga_ABC123=GS1; Path=/";
    document.cookie = "_gid=x; Path=/";
    document.cookie = "NEXT_LOCALE=vi; Path=/";
    clearGoogleAnalyticsCookies();
    expect(document.cookie).not.toContain("_ga");
    expect(document.cookie).not.toContain("_gid");
    expect(document.cookie).toContain("NEXT_LOCALE=vi");
    expireCookie("NEXT_LOCALE");
  });
});

describe("isValidGaMeasurementId", () => {
  it("chỉ nhận dạng G-XXXX", () => {
    expect(isValidGaMeasurementId("G-ABC123")).toBe(true);
    expect(isValidGaMeasurementId("UA-123")).toBe(false);
    expect(isValidGaMeasurementId('G-ABC123"><script>')).toBe(false);
    expect(isValidGaMeasurementId(null)).toBe(false);
  });
});
