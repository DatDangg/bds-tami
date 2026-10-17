import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it, vi } from "vitest";

import { initSentryIfConfigured, pickSentryExports, scrubSentryEvent } from "./sentry-options";

describe("initSentryIfConfigured", () => {
  it("DSN rỗng/thiếu → không gọi init (tắt êm, không network)", () => {
    const init = vi.fn();
    expect(initSentryIfConfigured(init, { dsn: undefined, environment: "staging" })).toBe(false);
    expect(initSentryIfConfigured(init, { dsn: "", environment: "staging" })).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it("có DSN → init với service tami-web, environment theo APP_ENV, không PII, không tracing, không tunnel", () => {
    const init = vi.fn();
    expect(initSentryIfConfigured(init, { dsn: "https://key@glitchtip.example/1", environment: "staging" })).toBe(true);
    const options = init.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options).toMatchObject({
      dsn: "https://key@glitchtip.example/1",
      environment: "staging",
      serverName: "tami-web",
      sendDefaultPii: false,
    });
    expect(options.tracesSampleRate).toBeUndefined();
    expect(options.tunnel).toBeUndefined();
    expect(options.initialScope).toEqual({ tags: { service: "tami-web" } });
  });

  it("extraOptions được trộn vào", () => {
    const init = vi.fn();
    initSentryIfConfigured(init, { dsn: "https://k@h/1", environment: "test" }, { maxValueLength: 100 });
    expect(init.mock.calls[0]?.[0]).toMatchObject({ maxValueLength: 100 });
  });
});

describe("scrubSentryEvent (beforeSend)", () => {
  it("bỏ user, cookie, header, body, query của request; lọc email/SĐT trong thông điệp lỗi", () => {
    const event = {
      user: { email: "khach@example.com", ip_address: "1.2.3.4" },
      extra: { body: "x" },
      message: "lead 0901234567 lỗi",
      exception: { values: [{ type: "Error", value: "gửi mail tới khach@example.com thất bại" }] },
      request: {
        method: "POST",
        url: "https://tami.vn/api/public/leads?email=khach@example.com",
        headers: { cookie: "payload-token=abc", authorization: "JWT x" },
        cookies: { "payload-token": "abc" },
        data: { phone: "0901234567" },
        query_string: "email=khach@example.com",
      },
      breadcrumbs: [{ category: "fetch", message: "gọi 0901234567", data: { url: "https://x?email=a@b.vn" } }],
    } as unknown as ErrorEvent;

    const scrubbed = scrubSentryEvent(event);
    const serialized = JSON.stringify(scrubbed);
    for (const secret of ["khach@example.com", "0901234567", "payload-token", "JWT x", "a@b.vn", "1.2.3.4"]) {
      expect(serialized).not.toContain(secret);
    }
    expect(scrubbed.request).toEqual({ method: "POST", url: "https://tami.vn/api/public/leads" });
    expect(scrubbed.exception?.values?.[0]?.value).toContain("thất bại");
    expect(scrubbed.breadcrumbs?.[0]).toMatchObject({ category: "fetch" });
  });

  it("event không có request/exception vẫn chạy được", () => {
    expect(scrubSentryEvent({} as ErrorEvent)).toEqual({});
  });
});

describe("pickSentryExports", () => {
  it("namespace có `default` (CJS nạp qua ESM) → dùng default, nơi có đủ named export", () => {
    const full = { init: () => "init", onUnhandledRejectionIntegration: () => "integration" };
    const namespace = { init: full.init, default: full };
    expect(pickSentryExports(namespace)).toBe(full);
  });

  it("namespace không có `default` (Next/Turbopack) → giữ nguyên namespace", () => {
    const namespace = { init: () => "init", onUnhandledRejectionIntegration: () => "integration" };
    expect(pickSentryExports(namespace)).toBe(namespace);
  });
});
