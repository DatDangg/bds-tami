import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "../../app/robots";
import { AI_CRAWLERS, buildRobots } from "./robots";

afterEach(() => vi.unstubAllEnvs());

const PRODUCTION_RULES = {
  userAgent: ["*", ...AI_CRAWLERS],
  allow: ["/", "/api/media/file/"],
  disallow: ["/admin", "/api/"],
};

describe("robots", () => {
  it("không phải production: chặn toàn bộ, không có Sitemap dù biết URL gốc", () => {
    expect(buildRobots(false)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(buildRobots(false, "https://tami.example")).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("production: cho phép (GPTBot/ClaudeBot/PerplexityBot cùng nhóm với *), chặn /admin và /api/ nhưng vẫn cho /api/media/file/, có Sitemap", () => {
    expect(buildRobots(true, "https://tami.example")).toEqual({ rules: PRODUCTION_RULES, sitemap: "https://tami.example/sitemap.xml" });
    expect(AI_CRAWLERS).toEqual(expect.arrayContaining(["GPTBot", "ClaudeBot", "PerplexityBot"]));
  });

  it("production chưa biết URL gốc: không khai Sitemap thay vì khai sai", () => {
    expect(buildRobots(true)).toEqual({ rules: PRODUCTION_RULES });
  });

  it("route đọc APP_ENV lúc gọi: staging → Disallow /, production → Allow / + Sitemap", () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    vi.stubEnv("APP_ENV", "production");
    expect(robots()).toEqual({ rules: PRODUCTION_RULES, sitemap: "https://tami.example/sitemap.xml" });
  });
});
