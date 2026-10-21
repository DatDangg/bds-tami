import { describe, expect, it } from "vitest";

import { checkBackfillEnvironment } from "./guard";

describe("checkBackfillEnvironment (chỉ DB dev cục bộ)", () => {
  const dev = "postgres://u:p@127.0.0.1:5433/tami";

  it("cho chạy với DB cục bộ (127.0.0.1 / localhost / ::1) khi không có dấu hiệu staging/prod", () => {
    expect(checkBackfillEnvironment({ DATABASE_URL: dev })).toEqual({ allowed: true });
    expect(checkBackfillEnvironment({ DATABASE_URL: "postgres://u:p@localhost:5432/tami_wt", NODE_ENV: "development", APP_ENV: "development" })).toEqual({ allowed: true });
    expect(checkBackfillEnvironment({ DATABASE_URL: "postgres://u:p@[::1]:5432/tami" })).toEqual({ allowed: true });
  });

  it("chặn production theo NODE_ENV / APP_ENV", () => {
    expect(checkBackfillEnvironment({ DATABASE_URL: dev, NODE_ENV: "production" })).toEqual({ allowed: false, reason: "NODE_ENV=production" });
    expect(checkBackfillEnvironment({ DATABASE_URL: dev, APP_ENV: "production" }).allowed).toBe(false);
  });

  it("chặn staging kể cả khi bật cờ seed staging (khác checkSeedEnvironment)", () => {
    expect(checkBackfillEnvironment({ DATABASE_URL: dev, APP_ENV: "staging", ALLOW_STAGING_SEED: "1" }).allowed).toBe(false);
    expect(checkBackfillEnvironment({ DATABASE_URL: dev, DATABASE_URL_STAGING: dev })).toEqual({ allowed: false, reason: "tên DB trùng DATABASE_URL_STAGING" });
    expect(checkBackfillEnvironment({ DATABASE_URL: dev, DATABASE_URL_PROD: ` ${dev} ` })).toEqual({ allowed: false, reason: "tên DB trùng DATABASE_URL_PROD" });
  });

  it("so sau khi chuẩn hoá với DATABASE_URL_STAGING/PROD: chặn tunnel localhost tới DB cùng tên, chặn cùng host:port; khác cả hai thì cho", () => {
    const prod = "postgres://app:secret@db.prod.internal:5432/Tami_Prod";
    expect(checkBackfillEnvironment({ DATABASE_URL: "postgres://app:secret@localhost:15432/tami_prod", DATABASE_URL_PROD: prod })).toEqual({ allowed: false, reason: "tên DB trùng DATABASE_URL_PROD" });
    const stagingOnLocal = "postgres://u:p@LOCALHOST/tami_staging";
    expect(checkBackfillEnvironment({ DATABASE_URL: "postgres://u:p@localhost:5432/tami_dev", DATABASE_URL_STAGING: stagingOnLocal })).toEqual({ allowed: false, reason: "host:port DB trùng DATABASE_URL_STAGING" });
    expect(checkBackfillEnvironment({ DATABASE_URL: dev, DATABASE_URL_STAGING: "postgres://u:p@postgres:5432/tami_staging", DATABASE_URL_PROD: prod })).toEqual({ allowed: true });
    expect(checkBackfillEnvironment({ DATABASE_URL: dev, DATABASE_URL_PROD: "garbage" })).toEqual({ allowed: false, reason: "DATABASE_URL_PROD không đúng dạng URL, không so được" });
  });

  it("chặn DB không ở máy cục bộ (host `postgres` trong container staging, máy xa) và lý do không lộ chuỗi kết nối", () => {
    for (const url of ["postgres://tami:secret@postgres:5432/tami", "postgres://tami:secret@10.0.0.5:5432/tami", "postgres://tami:secret@db.example.com/tami"]) {
      const result = checkBackfillEnvironment({ DATABASE_URL: url });
      expect(result.allowed).toBe(false);
      expect(JSON.stringify(result)).not.toContain("secret");
    }
  });

  it("chặn khi thiếu hoặc sai DATABASE_URL", () => {
    expect(checkBackfillEnvironment({})).toEqual({ allowed: false, reason: "thiếu DATABASE_URL" });
    expect(checkBackfillEnvironment({ DATABASE_URL: "not a url" })).toEqual({ allowed: false, reason: "DATABASE_URL không đúng dạng URL" });
  });
});
