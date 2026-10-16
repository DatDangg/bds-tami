import { describe, expect, it } from "vitest";
import { EnvValidationError, parseEnv } from "./env";

const validEnv = {
  DATABASE_URL: "postgres://u:p@localhost:5433/db",
  PAYLOAD_SECRET: "test-secret-value",
  REDIS_URL: "redis://localhost:6381",
  S3_ENDPOINT: "http://localhost:8333",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret-s3",
  S3_BUCKET_PUBLIC: "public",
  S3_BUCKET_PRIVATE: "private",
  TURNSTILE_SITE_KEY: "site",
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  SMTP_HOST: "smtp.example.test",
  SMTP_USER: "user",
  SMTP_PASS: "smtp-pass",
  ANTHROPIC_API_KEY: "anthropic-key",
  TRANSLATION_MODEL: "claude-model",
  TRANSLATION_MONTHLY_BUDGET_USD: "25.5",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("parse đúng kiểu khi đủ biến", () => {
    const env = parseEnv(validEnv);
    expect(env.TRANSLATION_MONTHLY_BUDGET_USD).toBe(25.5);
    expect(env.DATABASE_URL_TEST).toBeUndefined();
  });

  it("throw nêu tên biến thiếu, không lộ giá trị", () => {
    const missing = Object.fromEntries(
      Object.entries(validEnv).filter(([name]) => name !== "PAYLOAD_SECRET"),
    );
    let caught: unknown;
    try {
      parseEnv(missing);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(EnvValidationError);
    const message = (caught as Error).message;
    expect(message).toContain("PAYLOAD_SECRET");
    expect(message).not.toContain(validEnv.DATABASE_URL);
  });

  it("biến sai định dạng bị báo tên biến, không kèm giá trị", () => {
    expect(() => parseEnv({ ...validEnv, NEXT_PUBLIC_SITE_URL: "not-a-url-secret" })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
    try {
      parseEnv({ ...validEnv, NEXT_PUBLIC_SITE_URL: "not-a-url-secret" });
    } catch (error) {
      expect((error as Error).message).not.toContain("not-a-url-secret");
    }
  });

  it("gom đủ mọi biến thiếu", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL.*PAYLOAD_SECRET/);
  });
});
