import { ValidationError, type Payload } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicPipelineDeps } from "../_middleware/public-pipeline";

const log = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { child: () => log, ...log } }));

import { handleNewsletter } from "./newsletter";

const NOW = new Date("2026-10-22T03:00:00.000Z");
const baseBody = { email: "  Khach@Example.TEST ", consent: true, locale: "vi", turnstileToken: "token", sourcePath: "/tin-tuc" };

const allowed = (): PublicPipelineDeps => ({
  rateLimit: vi.fn(async () => ({ allowed: true as const, remaining: 4 })),
  verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
});

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return { headers: new Headers({ "CF-Connecting-IP": "198.51.100.9", ...headers }), text: async () => raw };
}

function fakePayload(existing: { id: string; status: "active" | "unsubscribed" } | null = null, policy: string | null = "2026-10") {
  const find = vi.fn(async () => ({ docs: existing ? [existing] : [] }));
  const findGlobal = vi.fn(async () => ({ privacyPolicyVersion: policy }));
  const create = vi.fn(async () => ({}));
  const update = vi.fn(async () => ({}));
  return { payload: { find, findGlobal, create, update } as unknown as Payload, find, findGlobal, create, update };
}

async function submit(body: unknown, fake = fakePayload(), pipelineDeps = allowed(), headers: Record<string, string> = {}) {
  const response = await handleNewsletter(makeRequest(body, headers), { payload: fake.payload, pipelineDeps, now: () => NOW });
  return { response, body: (await response.json()) as Record<string, unknown>, ...fake, pipelineDeps };
}

describe("POST /api/public/newsletter (handler)", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    for (const fn of Object.values(log)) fn.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("email mới -> 200 { received: true }; tạo bản active, email chuẩn hoá, consent + phiên bản chính sách từ site-settings, bỏ token", async () => {
    const { response, body, create, find } = await submit(baseBody);
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: { received: true } });
    expect(find.mock.calls[0]).toEqual([expect.objectContaining({ where: { email: { equals: "khach@example.test" } }, overrideAccess: true })]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "newsletter-subscribers",
        overrideAccess: true,
        data: { email: "khach@example.test", status: "active", locale: "vi", consentAt: NOW.toISOString(), privacyPolicyVersion: "2026-10", sourcePath: "/tin-tuc" },
      }),
    );
  });

  it("email đã active -> cùng phản hồi, không tạo / không sửa (giữ bằng chứng đồng ý lần đầu)", async () => {
    const fresh = await submit(baseBody);
    const again = await submit(baseBody, fakePayload({ id: "s1", status: "active" }));
    expect(again.response.status).toBe(fresh.response.status);
    expect(again.body).toEqual(fresh.body);
    expect(again.create).not.toHaveBeenCalled();
    expect(again.update).not.toHaveBeenCalled();
  });

  it("email đã huỷ -> bật lại active + consent mới (locale, thời điểm, phiên bản, trang), không tạo bản mới", async () => {
    const { response, update, create } = await submit({ ...baseBody, locale: "en", sourcePath: "/en/news" }, fakePayload({ id: "s2", status: "unsubscribed" }));
    expect(response.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "s2",
        overrideAccess: true,
        data: { status: "active", locale: "en", consentAt: NOW.toISOString(), privacyPolicyVersion: "2026-10", sourcePath: "/en/news" },
      }),
    );
  });

  it("đua 2 request cùng email (unique email) -> vẫn 200; lỗi khác -> 500 chung, log không có email", async () => {
    const raced = fakePayload();
    raced.create.mockRejectedValueOnce(new ValidationError({ errors: [{ message: "Value must be unique", path: "email" }] }));
    expect((await submit(baseBody, raced)).response.status).toBe(200);

    const broken = fakePayload();
    broken.create.mockRejectedValueOnce(new Error("db down"));
    const failed = await submit({ ...baseBody, locale: "en" }, broken);
    expect(failed.response.status).toBe(500);
    expect(failed.body.error).toBe("Something went wrong, please try again later");
    expect(JSON.stringify(log.error.mock.calls)).not.toContain("example.test");
  });

  it("thiếu privacyPolicyVersion -> ghi `unknown` + cảnh báo", async () => {
    const { create } = await submit(baseBody, fakePayload(null, null));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ privacyPolicyVersion: "unknown" }) }));
    expect(log.warn).toHaveBeenCalled();
  });

  it.each([
    ["thiếu consent", { consent: undefined }, "consent"],
    ["consent là chuỗi", { consent: "true" }, "consent"],
    ["consent false", { consent: false }, "consent"],
    ["email sai", { email: "khong-phai-email" }, "email"],
    ["thiếu email", { email: undefined }, "email"],
    ["email quá 254 ký tự", { email: `${"a".repeat(250)}@x.vn` }, "email"],
  ])("%s -> 400, details field %s, không chạm DB, không echo giá trị", async (_label, patch, field) => {
    const { response, body, find, create } = await submit({ ...baseBody, ...patch });
    expect(response.status).toBe(400);
    expect(body.details).toEqual([expect.objectContaining({ field })]);
    expect(JSON.stringify(body)).not.toContain("khong-phai-email");
    expect(find).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("thông báo lỗi theo locale (vi / en)", async () => {
    expect((await submit({ ...baseBody, consent: false })).body.details).toEqual([{ field: "consent", message: "Bạn cần đồng ý với chính sách bảo mật" }]);
    const english = await submit({ ...baseBody, locale: "en", consent: false });
    expect(english.body).toMatchObject({ error: "Invalid data", details: [{ field: "consent", message: "You must agree to the privacy policy" }] });
  });

  it("Turnstile sai -> 400 có chữ captcha (vi + en), không đọc DB", async () => {
    for (const locale of ["vi", "en"]) {
      const rejected: PublicPipelineDeps = { rateLimit: allowed().rateLimit, verifyTurnstile: vi.fn(async () => ({ ok: false as const, reason: "invalid" }) as never) };
      const { response, body, find } = await submit({ ...baseBody, locale }, fakePayload(), rejected);
      expect(response.status).toBe(400);
      expect(body.error).toMatch(/captcha/i);
      expect(find).not.toHaveBeenCalled();
    }
  });

  it("rate limit `newsletter` (429 + Retry-After) chặn trước Turnstile; Redis lỗi -> 503", async () => {
    const limited: PublicPipelineDeps = {
      rateLimit: vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 300 })),
      verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
    };
    const rate = await submit(baseBody, fakePayload(), limited, { "Accept-Language": "en-US" });
    expect(rate.response.status).toBe(429);
    expect(rate.response.headers.get("Retry-After")).toBe("300");
    expect(rate.body.error).toBe("Too many submissions, please try again later");
    expect(limited.rateLimit).toHaveBeenCalledWith("newsletter", expect.stringMatching(/^[0-9a-f]{64}$/));
    expect(limited.verifyTurnstile).not.toHaveBeenCalled();

    const { RateLimitUnavailableError } = await import("@/lib/security/rate-limit");
    const down: PublicPipelineDeps = {
      rateLimit: vi.fn(async () => {
        throw new RateLimitUnavailableError(new Error("down"));
      }),
      verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
    };
    expect((await submit(baseBody, fakePayload(), down)).response.status).toBe(503);
  });

  it("sourcePath ngoài site / sai kiểu bị bỏ (không từ chối); body không phải JSON -> 400", async () => {
    for (const sourcePath of ["//evil.test/x", "https://evil.test", 42]) {
      const { response, create } = await submit({ ...baseBody, sourcePath });
      expect(response.status).toBe(200);
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sourcePath: null }) }));
    }
    const long = await submit({ ...baseBody, sourcePath: `/${"a".repeat(600)}` });
    expect((long.create.mock.calls[0] as unknown as [{ data: { sourcePath: string } }])[0].data.sourcePath).toHaveLength(500);
    expect((await submit("{không phải json")).response.status).toBe(400);
  });
});
