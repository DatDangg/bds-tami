import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "../../app/robots";
import { buildRobots } from "./robots";

afterEach(() => vi.unstubAllEnvs());

describe("robots", () => {
  it("không phải production: chặn toàn bộ", () => {
    expect(buildRobots(false)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("production: cho phép, chặn /admin và /api/ nhưng vẫn cho /api/media/file/ (ảnh, OG)", () => {
    expect(buildRobots(true)).toEqual({
      rules: { userAgent: "*", allow: ["/", "/api/media/file/"], disallow: ["/admin", "/api/"] },
    });
  });

  it("route đọc APP_ENV lúc gọi: staging → Disallow /, production → Allow /", () => {
    vi.stubEnv("APP_ENV", "staging");
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    vi.stubEnv("APP_ENV", "production");
    expect(robots()).toMatchObject({ rules: { allow: ["/", "/api/media/file/"] } });
  });
});
