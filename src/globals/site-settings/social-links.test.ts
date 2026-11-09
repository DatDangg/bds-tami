import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { createSiteSettings } from "../SiteSettings";
import { createValidatePlatform, normalizeSocialUrl, SOCIAL_URL_REQUIRED_MESSAGE, validateSocialUrl } from "./social-links";

type Rows = { platform?: string; url?: string }[];
const PLATFORM_OPTIONS = ["facebook", "instagram", "other"].map((value) => ({ label: value, value }));
const req = { t: (key: string) => key, payload: { config: {} } };
// Payload 3.x truyền chỉ số dòng dạng chuỗi trong path; `indexAsNumber` để kiểm thêm dạng số.
const run = (validate: unknown, value: unknown, rows: Rows, index: number, name: "platform" | "url", indexAsNumber = false) =>
  (validate as (v: unknown, o: unknown) => unknown)(value, {
    data: { socialLinks: rows },
    path: ["socialLinks", indexAsNumber ? index : String(index), name],
    required: true,
    options: PLATFORM_OPTIONS,
    req,
  });

const validatePlatform = createValidatePlatform({ instagram: "Instagram", facebook: "Facebook", other: "Khác" });

describe("normalizeSocialUrl (BL-109)", () => {
  it("bỏ www., / cuối, host hoa thường, scheme; giữ path hoa thường", () => {
    expect(normalizeSocialUrl("https://www.instagram.com/tamihomes.test/")).toBe(normalizeSocialUrl("http://INSTAGRAM.com/tamihomes.test"));
    expect(normalizeSocialUrl("https://instagram.com/Tami")).not.toBe(normalizeSocialUrl("https://instagram.com/tami"));
    expect(normalizeSocialUrl("https://a.com/x?y=1")).not.toBe(normalizeSocialUrl("https://a.com/x"));
  });
});

describe("site-settings socialLinks.url (BL-108)", () => {
  it.each([undefined, "", "   "])("trống %j -> 'Vui lòng nhập Link trang'", (value) => {
    expect(run(validateSocialUrl, value, [{ platform: "facebook", url: value }], 0, "url")).toBe(SOCIAL_URL_REQUIRED_MESSAGE);
  });
  it("giữ kiểm http(s)", () => {
    expect(run(validateSocialUrl, "ftp://a.com", [], 0, "url")).toContain("http://");
    expect(run(validateSocialUrl, "https://facebook.com/tami", [], 0, "url")).toBe(true);
  });
  it("global nối đúng validate; zaloUrl/fanpageUrl vẫn không bắt buộc", () => {
    const tabs = createSiteSettings().fields.find((f) => f.type === "tabs") as { tabs: { fields: Field[] }[] };
    const fields = tabs.tabs.flatMap((t) => t.fields);
    const social = fields.find((f) => "name" in f && f.name === "socialLinks") as { fields: Field[] };
    const url = social.fields.find((f) => "name" in f && f.name === "url") as { validate: unknown };
    expect(url.validate).toBe(validateSocialUrl);
    const zalo = fields.find((f) => "name" in f && f.name === "zaloUrl") as { validate: (v: unknown) => unknown };
    expect(zalo.validate("")).toBe(true);
  });
});

describe("site-settings socialLinks trùng (BL-109)", () => {
  it("path dạng số vẫn đọc đúng chỉ số dòng", () => {
    const rows = [{ platform: "instagram", url: "https://instagram.com/a" }, { platform: "instagram", url: "https://instagram.com/a" }];
    expect(run(validatePlatform, "instagram", rows, 1, "platform", true)).toBe("Nền tảng Instagram đã có ở dòng 1.");
    expect(run(validateSocialUrl, rows[1]?.url, rows, 1, "url", true)).toBe("Link trang trùng với dòng 1.");
  });
  it("giá trị nền tảng lạ bị chặn bởi kiểm mặc định của select", () => {
    expect(run(validatePlatform, "myspace", [{ platform: "myspace" }], 0, "platform")).toBe("validation:invalidSelection");
    expect(run(validatePlatform, "", [{ platform: "" }], 0, "platform")).toBe("Vui lòng chọn nền tảng");
  });
  it("2 dòng cùng nền tảng -> lỗi tại dòng sau; dòng đầu hợp lệ", () => {
    const rows = [{ platform: "instagram", url: "https://instagram.com/a" }, { platform: "instagram", url: "https://instagram.com/b" }];
    expect(run(validatePlatform, "instagram", rows, 0, "platform")).toBe(true);
    expect(run(validatePlatform, "instagram", rows, 1, "platform")).toBe("Nền tảng Instagram đã có ở dòng 1.");
  });
  it("nhiều dòng 'Khác' khác link -> hợp lệ", () => {
    const rows = [{ platform: "other", url: "https://a.com/1" }, { platform: "other", url: "https://a.com/2" }];
    expect(run(validatePlatform, "other", rows, 1, "platform")).toBe(true);
    expect(run(validateSocialUrl, "https://a.com/2", rows, 1, "url")).toBe(true);
  });
  it("link trùng sau chuẩn hoá (kể cả 'Khác') -> lỗi tại dòng sau", () => {
    const rows = [{ platform: "other", url: "https://www.instagram.com/tamihomes.test/" }, { platform: "other", url: "https://instagram.com/tamihomes.test" }];
    expect(run(validateSocialUrl, rows[0]?.url, rows, 0, "url")).toBe(true);
    expect(run(validateSocialUrl, rows[1]?.url, rows, 1, "url")).toBe("Link trang trùng với dòng 1.");
  });
  it("nền tảng khác nhau, link khác nhau -> hợp lệ", () => {
    const rows = [{ platform: "facebook", url: "https://facebook.com/a" }, { platform: "instagram", url: "https://instagram.com/a" }];
    expect(run(validatePlatform, "instagram", rows, 1, "platform")).toBe(true);
    expect(run(validateSocialUrl, rows[1]?.url, rows, 1, "url")).toBe(true);
  });
});
