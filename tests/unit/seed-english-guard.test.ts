import { describe, expect, it } from "vitest";

import { missingBeforeWrite } from "../../seed/english/apply";
import { assertEnglishSeedAllowed, englishSeedBlockReason } from "../../seed/english";

const DEV = { DATABASE_URL: "postgres://u:p@127.0.0.1:5433/tami", NODE_ENV: "development" };

describe("seed EN: chỉ chạy trên DB dev (spec BL-064)", () => {
  it("DB dev (không APP_ENV hoặc APP_ENV=development) được phép", () => {
    expect(englishSeedBlockReason(DEV)).toBeNull();
    expect(englishSeedBlockReason({ ...DEV, APP_ENV: "development" })).toBeNull();
    expect(() => assertEnglishSeedAllowed(DEV)).not.toThrow();
  });

  it("chặn production, staging, NODE_ENV=production và thiếu DATABASE_URL", () => {
    expect(englishSeedBlockReason({ ...DEV, APP_ENV: "production" })).toContain("production");
    expect(englishSeedBlockReason({ ...DEV, APP_ENV: "staging" })).toBe("APP_ENV=staging");
    expect(englishSeedBlockReason({ ...DEV, NODE_ENV: "production" })).toContain("NODE_ENV=production");
    expect(englishSeedBlockReason({ NODE_ENV: "development" })).toContain("DATABASE_URL");
  });

  it("chặn khi DATABASE_URL trùng staging/prod dù không đặt APP_ENV", () => {
    expect(englishSeedBlockReason({ ...DEV, DATABASE_URL_STAGING: DEV.DATABASE_URL })).toContain("DATABASE_URL_STAGING");
    expect(englishSeedBlockReason({ ...DEV, DATABASE_URL_PROD: DEV.DATABASE_URL })).toContain("DATABASE_URL_PROD");
  });

  it("ALLOW_STAGING_SEED=1 KHÔNG mở đường cho seed EN ở staging", () => {
    expect(englishSeedBlockReason({ ...DEV, APP_ENV: "staging", NODE_ENV: "production", ALLOW_STAGING_SEED: "1" })).not.toBeNull();
    expect(() => assertEnglishSeedAllowed({ ...DEV, APP_ENV: "staging", ALLOW_STAGING_SEED: "1" })).toThrow(/chỉ chạy trên DB dev/);
  });
});

describe("missingBeforeWrite: kiểm trường EN bắt buộc trước khi ghi", () => {
  const leaf = (name: string) => ({ leaf: { path: [name], kind: "text", value: "vi" } as never, value: "en" });

  it("trường đã có trong EN hiện tại hoặc sắp ghi thì đủ; slug bỏ qua", () => {
    expect(missingBeforeWrite(["title", "summary", "slug"], { summary: "Có sẵn" }, [leaf("title")])).toEqual([]);
  });

  it("thiếu trường không có ở cả hai nơi", () => {
    expect(missingBeforeWrite(["title", "summary"], {}, [leaf("title")])).toEqual(["summary"]);
  });
});
