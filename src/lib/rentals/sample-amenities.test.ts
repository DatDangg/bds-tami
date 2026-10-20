import { describe, expect, it } from "vitest";

import { RENTAL_AMENITIES } from "../../shared/types/api";
import { checkSeedEnvironment, sampleAmenitiesFor } from "./sample-amenities";

describe("sampleAmenitiesFor (seed dev BL-044)", () => {
  const ids = Array.from({ length: 200 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);

  it("ổn định theo id: cùng id → cùng bộ; 2–5 tiện ích hợp lệ, không trùng, theo thứ tự RENTAL_AMENITIES", () => {
    for (const id of ids) {
      const picked = sampleAmenitiesFor(id);
      expect(picked).toEqual(sampleAmenitiesFor(id));
      expect(picked.length).toBeGreaterThanOrEqual(2);
      expect(picked.length).toBeLessThanOrEqual(5);
      expect(new Set(picked).size).toBe(picked.length);
      expect(picked).toEqual(RENTAL_AMENITIES.filter((amenity) => picked.includes(amenity)));
    }
  });

  it("phân tán: nhiều tin khác nhau ra bộ khác nhau và mọi tiện ích đều xuất hiện (để lọc AND có kết quả thử được)", () => {
    const seen = new Set(ids.map((id) => sampleAmenitiesFor(id).join(",")));
    expect(seen.size).toBeGreaterThan(20);
    const used = new Set(ids.flatMap((id) => sampleAmenitiesFor(id)));
    expect(used.size).toBe(RENTAL_AMENITIES.length);
  });
});

describe("checkSeedEnvironment", () => {
  const dev = "postgres://u:p@127.0.0.1:5433/tami";

  it("cho chạy trên DB dev khác staging/prod", () => {
    expect(checkSeedEnvironment({ DATABASE_URL: dev, DATABASE_URL_STAGING: "postgres://u:p@postgres:5432/tami" })).toEqual({ allowed: true });
  });

  it("từ chối khi NODE_ENV=production, thiếu DATABASE_URL, hoặc DATABASE_URL trùng staging/prod", () => {
    expect(checkSeedEnvironment({ NODE_ENV: "production", DATABASE_URL: dev }).allowed).toBe(false);
    expect(checkSeedEnvironment({}).allowed).toBe(false);
    expect(checkSeedEnvironment({ DATABASE_URL: dev, DATABASE_URL_STAGING: dev })).toEqual({ allowed: false, reason: "DATABASE_URL trùng DATABASE_URL_STAGING" });
    expect(checkSeedEnvironment({ DATABASE_URL: dev, DATABASE_URL_PROD: ` ${dev} ` })).toEqual({ allowed: false, reason: "DATABASE_URL trùng DATABASE_URL_PROD" });
  });
});
