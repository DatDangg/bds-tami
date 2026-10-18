import type { Payload } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicPipelineDeps } from "../_middleware/public-pipeline";

const log = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { child: () => log, ...log } }));
const createOrMerge = vi.hoisted(() => vi.fn());
vi.mock("@/lib/leads/create-or-merge", () => ({ createOrMergeLead: createOrMerge }));

import { handleLead } from "./leads";

const SOURCE_ID = "7f1c0f0e-2b0a-4c53-9d0e-2d6e1f0a9b11";
const NOW = new Date("2026-10-18T03:00:00.000Z");
const baseBody = {
  source: "rental",
  sourceId: SOURCE_ID,
  fullName: "Nguyễn Văn Khách",
  phone: "0901 234 567",
  email: "khach@example.test",
  message: "Cho tôi xem nhà",
  consent: true,
  turnstileToken: "token",
  locale: "vi",
};

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return {
    headers: new Headers({ "CF-Connecting-IP": "198.51.100.7", "User-Agent": "UA-test", ...headers }),
    text: async () => raw,
  };
}

const allowed = (): PublicPipelineDeps => ({
  rateLimit: vi.fn(async () => ({ allowed: true as const, remaining: 4 })),
  verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
});

const captchaRejected = (): PublicPipelineDeps => ({
  rateLimit: allowed().rateLimit,
  verifyTurnstile: vi.fn(async () => ({ ok: false as const, reason: "invalid" }) as never),
});

function fakePayload(options: { sourceFound?: boolean; privacyPolicyVersion?: string | null } = {}) {
  const find = vi.fn<(args: unknown) => Promise<{ docs: unknown[] }>>(async () => ({ docs: options.sourceFound === false ? [] : [{ id: SOURCE_ID }] }));
  const findGlobal = vi.fn(async () => ({
    privacyPolicyVersion: options.privacyPolicyVersion === undefined ? "2026-10" : options.privacyPolicyVersion,
    notificationEmails: [{ email: "admin@tami.test" }],
  }));
  return { payload: { find, findGlobal } as unknown as Payload, find, findGlobal };
}

async function submit(body: unknown, options: Parameters<typeof fakePayload>[0] = {}, pipelineDeps = allowed(), headers: Record<string, string> = {}) {
  const fake = fakePayload(options);
  const response = await handleLead(makeRequest(body, headers), { payload: fake.payload, pipelineDeps, now: () => NOW, siteUrl: "https://tami.test/" });
  return { response, body: (await response.json()) as Record<string, unknown>, ...fake, pipelineDeps };
}

describe("POST /api/public/leads (handler)", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    createOrMerge.mockReset();
    createOrMerge.mockResolvedValue("created");
    for (const fn of Object.values(log)) fn.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hợp lệ -> 200 { received: true }; SĐT chuẩn hoá, ngữ cảnh có ipHash/consentVersion/userAgent/email nhận thông báo", async () => {
    const { response, body } = await submit(baseBody);
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, data: { received: true } });
    const [, input, context] = createOrMerge.mock.calls[0]!;
    expect(input).toMatchObject({ source: "rental", sourceId: SOURCE_ID, phone: "+84901234567", consent: true, locale: "vi" });
    expect(input).not.toHaveProperty("turnstileToken");
    expect(context).toMatchObject({
      consentVersion: "2026-10",
      notificationEmails: ["admin@tami.test"],
      siteUrl: "https://tami.test",
      userAgent: "UA-test",
      now: NOW,
    });
    expect(context.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(context)).not.toContain("198.51.100.7");
  });

  it("response tạo mới và gộp giống hệt nhau (status, body)", async () => {
    createOrMerge.mockResolvedValueOnce("created").mockResolvedValueOnce("merged");
    const created = await submit(baseBody);
    const merged = await submit(baseBody);
    expect(merged.response.status).toBe(created.response.status);
    expect(merged.body).toEqual(created.body);
  });

  it("thứ tự: rate limit (429) trước Turnstile; Turnstile sai (400 captcha) trước validate; không chạm DB khi bị chặn", async () => {
    const limited: PublicPipelineDeps = {
      rateLimit: vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 120 })),
      verifyTurnstile: vi.fn(async () => ({ ok: true as const })),
    };
    const rate = await submit(baseBody, {}, limited);
    expect(rate.response.status).toBe(429);
    expect(rate.response.headers.get("Retry-After")).toBe("120");
    expect(limited.verifyTurnstile).not.toHaveBeenCalled();

    const captcha = await submit({ ...baseBody, consent: false }, {}, captchaRejected());
    expect(captcha.response.status).toBe(400);
    expect(captcha.body.error).toMatch(/captcha/i);
    expect(captcha.find).not.toHaveBeenCalled();
    expect(createOrMerge).not.toHaveBeenCalled();
  });

  it("lỗi theo locale của khách, vẫn có chữ captcha ở cả vi và en", async () => {
    for (const locale of ["vi", "en"]) {
      expect((await submit({ ...baseBody, locale }, {}, captchaRejected())).body.error).toMatch(/captcha/i);
    }
    const english = await submit({ ...baseBody, locale: "en", consent: false });
    expect(english.response.status).toBe(400);
    expect(english.body.error).toBe("Invalid data");
    expect(english.body.details).toEqual([{ field: "consent", message: "You must agree to the privacy policy" }]);
    const vietnamese = await submit({ ...baseBody, consent: false });
    expect(vietnamese.body.details).toEqual([{ field: "consent", message: "Bạn cần đồng ý với chính sách bảo mật" }]);
    const limited: PublicPipelineDeps = { rateLimit: vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 5 })), verifyTurnstile: allowed().verifyTurnstile };
    expect((await submit(baseBody, {}, limited, { "Accept-Language": "en-US" })).body.error).toBe("Too many submissions, please try again later");
  });

  it.each([
    ["thiếu consent", { consent: undefined }],
    ["consent là chuỗi true", { consent: "true" }],
    ["SĐT không phải VN", { phone: "12345" }],
    ["tên 1 ký tự", { fullName: "A" }],
    ["tên quá 100 ký tự", { fullName: "a".repeat(101) }],
    ["email sai", { email: "khong-phai-email" }],
    ["message quá 1000", { message: "x".repeat(1001) }],
    ["source lạ", { source: "admin" }],
    ["thiếu sourceId khi source khác contact", { sourceId: undefined }],
    ["sourceId không phải UUID", { sourceId: "abc" }],
  ])("%s -> 400 không tạo lead, details không echo giá trị nhập", async (_label, patch) => {
    const { response, body } = await submit({ ...baseBody, ...patch });
    expect(response.status).toBe(400);
    expect(createOrMerge).not.toHaveBeenCalled();
    expect(JSON.stringify(body)).not.toContain("khach@example.test");
  });

  it("body không phải JSON hoặc quá lớn -> 400", async () => {
    expect((await submit("không phải json")).response.status).toBe(400);
    expect((await submit({ ...baseBody, message: "x".repeat(20_000) })).response.status).toBe(400);
    expect(createOrMerge).not.toHaveBeenCalled();
  });

  it("contact không cần sourceId (bỏ qua nếu có); ô email/message trống coi như không gửi; chuỗi phụ quá dài bị cắt", async () => {
    const { response, find } = await submit({
      ...baseBody,
      source: "contact",
      sourceId: undefined,
      email: "",
      message: "  ",
      utm: { source: "s".repeat(500), medium: "cpc" },
      pageUrl: `https://tami.test/${"a".repeat(3000)}`,
    });
    expect(response.status).toBe(200);
    expect(find).not.toHaveBeenCalled();
    const input = createOrMerge.mock.calls[0]![1];
    expect(input.email).toBeUndefined();
    expect(input.message).toBeUndefined();
    expect(input.utm.source).toHaveLength(200);
    expect(input.pageUrl).toHaveLength(2000);
  });

  it("nguồn không công khai (nháp, đã xoá, không tồn tại) -> 400 trên sourceId, không tạo/gộp", async () => {
    const { response, body } = await submit(baseBody, { sourceFound: false });
    expect(response.status).toBe(400);
    expect(body.details).toEqual([{ field: "sourceId", message: "Giá trị không hợp lệ" }]);
    expect(createOrMerge).not.toHaveBeenCalled();
  });

  it("kiểm nguồn đúng collection, dùng điều kiện công khai (tin cho thuê nhận cả rented) + id", async () => {
    const rental = await submit(baseBody);
    const args = rental.find.mock.calls[0]![0] as { collection: string; where: unknown };
    expect(args.collection).toBe("rentals");
    expect(JSON.stringify(args.where)).toContain("rented");
    const project = await submit({ ...baseBody, source: "project" });
    expect((project.find.mock.calls[0]![0] as { collection: string }).collection).toBe("projects");
    expect(JSON.stringify(project.find.mock.calls[0]![0])).not.toContain("rented");
  });

  it("thiếu privacyPolicyVersion -> consentVersion unknown + cảnh báo", async () => {
    await submit(baseBody, { privacyPolicyVersion: null });
    expect(createOrMerge.mock.calls[0]![2].consentVersion).toBe("unknown");
    expect(log.warn).toHaveBeenCalled();
  });

  it("lỗi bất ngờ -> 500 theo locale, log chỉ có tên lỗi (không SĐT/email/tên)", async () => {
    createOrMerge.mockRejectedValueOnce(new Error("lỗi DB 0901234567 khach@example.test"));
    const { response, body } = await submit({ ...baseBody, locale: "en" });
    expect(response.status).toBe(500);
    expect(body.error).toBe("Something went wrong, please try again later");
    const logged = JSON.stringify(log.error.mock.calls);
    for (const pii of ["0901234567", "khach@example.test", "Nguyễn Văn Khách"]) expect(logged).not.toContain(pii);
  });
});
