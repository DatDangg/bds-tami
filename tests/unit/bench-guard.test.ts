import { describe, expect, it } from "vitest";

import { benchBlockedReason } from "../../scripts/bench/bench-guard";

const dev = { NODE_ENV: "development", APP_ENV: "development", DATABASE_URL: "postgres://u:p@localhost:5432/tami" };

describe("benchBlockedReason (bench chèn 100.000 tin giả chỉ chạy trên DB dev)", () => {
  it("dev/test + DB localhost -> được chạy", () => {
    expect(benchBlockedReason(dev)).toBeNull();
    expect(benchBlockedReason({ ...dev, APP_ENV: "test", DATABASE_URL: "postgres://u:p@127.0.0.1/tami" })).toBeNull();
    expect(benchBlockedReason({ ...dev, DATABASE_URL: "postgres://u:p@[::1]:5432/tami" })).toBeNull();
    expect(benchBlockedReason({ DATABASE_URL: dev.DATABASE_URL })).toBeNull();
  });

  it("NODE_ENV=production -> chặn", () => {
    expect(benchBlockedReason({ ...dev, NODE_ENV: "production" })).toMatch(/NODE_ENV=production/);
  });

  it.each(["staging", "production"])("APP_ENV=%s -> chặn dù DB là localhost (tunnel)", (appEnv) => {
    expect(benchBlockedReason({ ...dev, APP_ENV: appEnv })).toContain(`APP_ENV=${appEnv}`);
  });

  it("host DB không phải máy dev -> chặn, kể cả tên giống localhost", () => {
    for (const host of ["db.internal", "10.0.0.5", "staging-db.example.com", "localhost.evil.com"]) {
      expect(benchBlockedReason({ ...dev, DATABASE_URL: `postgres://u:p@${host}:5432/tami` }), host).toMatch(/không phải máy dev/);
    }
  });

  it("thiếu hoặc hỏng DATABASE_URL -> chặn (không đoán)", () => {
    expect(benchBlockedReason({ NODE_ENV: "development" })).toMatch(/chưa đặt/);
    expect(benchBlockedReason({ DATABASE_URL: "không phải url" })).toMatch(/không đọc được/);
  });

  it("lý do không lộ mật khẩu trong DATABASE_URL", () => {
    expect(benchBlockedReason({ ...dev, DATABASE_URL: "postgres://u:matkhau-bi-mat@db.internal/tami" })).not.toContain("matkhau-bi-mat");
  });
});
