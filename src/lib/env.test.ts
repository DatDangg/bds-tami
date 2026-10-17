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
  it("cấu hình email: mặc định cổng 587, APP_ENV=development; giá trị lạ -> lỗi nêu tên biến", () => {
    const env = parseEnv(validEnv);
    expect(env.SMTP_PORT).toBe(587);
    expect(env.APP_ENV).toBe("development");
    expect(env.EMAIL_ALLOWLIST).toBeUndefined();
    expect(parseEnv({ ...validEnv, APP_ENV: "staging", SMTP_PORT: "465" })).toMatchObject({ APP_ENV: "staging", SMTP_PORT: 465 });
    expect(() => parseEnv({ ...validEnv, APP_ENV: "prod" })).toThrow(/APP_ENV/);
  });

  it("TRUST_CF_CONNECTING_IP: mặc định false, nhận true/false, giá trị lạ -> lỗi nêu tên biến", () => {
    expect(parseEnv(validEnv).TRUST_CF_CONNECTING_IP).toBe(false);
    expect(parseEnv({ ...validEnv, TRUST_CF_CONNECTING_IP: "true" }).TRUST_CF_CONNECTING_IP).toBe(true);
    expect(() => parseEnv({ ...validEnv, TRUST_CF_CONNECTING_IP: "1" })).toThrow(/TRUST_CF_CONNECTING_IP/);
  });

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

describe("parseEnv: giám sát", () => {
  it("không đặt hoặc để trống → undefined (tắt GlitchTip, tắt /api/metrics)", () => {
    for (const env of [parseEnv(validEnv), parseEnv({ ...validEnv, GLITCHTIP_DSN: "", GLITCHTIP_PUBLIC_DSN: "", METRICS_TOKEN: "" })]) {
      expect(env.GLITCHTIP_DSN).toBeUndefined();
      expect(env.GLITCHTIP_PUBLIC_DSN).toBeUndefined();
      expect(env.METRICS_TOKEN).toBeUndefined();
    }
  });

  it("DSN phải là URL, METRICS_TOKEN tối thiểu 32 ký tự; lỗi chỉ nêu tên biến, không in giá trị", () => {
    const env = parseEnv({ ...validEnv, GLITCHTIP_DSN: "https://key@glitchtip.example/1", METRICS_TOKEN: "m".repeat(32) });
    expect(env.GLITCHTIP_DSN).toBe("https://key@glitchtip.example/1");
    expect(() => parseEnv({ ...validEnv, GLITCHTIP_DSN: "khong-phai-url" })).toThrow(/GLITCHTIP_DSN/);
    expect(() => parseEnv({ ...validEnv, METRICS_TOKEN: "token-ngan" })).toThrow(/METRICS_TOKEN/);
    expect(() => parseEnv({ ...validEnv, METRICS_TOKEN: "token-ngan" })).not.toThrow(/token-ngan/);
  });
});
