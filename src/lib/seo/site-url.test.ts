import { afterEach, describe, expect, it, vi } from "vitest";

import { absoluteUrl, getSiteUrl, isIndexingAllowed, parseSiteUrl } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("getSiteUrl (đọc lúc chạy)", () => {
  it("chuẩn hoá về origin, bỏ `/` cuối", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example/");
    expect(getSiteUrl()).toBe("https://tami.example");
  });

  it("đổi env giữa hai lần gọi thì kết quả đổi theo (không bị đóng băng)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.tami.example");
    expect(getSiteUrl()).toBe("https://staging.tami.example");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
    expect(getSiteUrl()).toBe("https://tami.example");
  });

  it.each(["", "   ", "not-a-url", "ftp://x.example", "javascript:alert(1)"])("%j → undefined", (value) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
    expect(getSiteUrl()).toBeUndefined();
  });

  it("lúc next build → undefined (không để placeholder localhost lọt vào HTML prerender)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    expect(getSiteUrl()).toBeUndefined();
  });
});

describe("absoluteUrl / isIndexingAllowed", () => {
  it("nối đường dẫn vào URL gốc; không có URL gốc thì undefined", () => {
    expect(absoluteUrl("/en/news", "https://tami.example")).toBe("https://tami.example/en/news");
    expect(absoluteUrl("/en/news", undefined)).toBeUndefined();
  });

  it("chỉ APP_ENV=production được index", () => {
    vi.stubEnv("APP_ENV", "production");
    expect(isIndexingAllowed()).toBe(true);
    vi.stubEnv("APP_ENV", "staging");
    expect(isIndexingAllowed()).toBe(false);
  });
});

describe("parseSiteUrl (hàm thuần, nhận nguyên object env)", () => {
  it("đọc từ object truyền vào, không từ process.env", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://khac.example");
    expect(parseSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://tami.example/vi" })).toBe("https://tami.example");
  });

  it("thiếu / sai / giao thức lạ / đang build → undefined", () => {
    expect(parseSiteUrl({})).toBeUndefined();
    expect(parseSiteUrl({ NEXT_PUBLIC_SITE_URL: "ftp://x.example" })).toBeUndefined();
    expect(parseSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://tami.example", NEXT_PHASE: "phase-production-build" })).toBeUndefined();
  });
});
