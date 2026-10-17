import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findRedirectTarget = vi.hoisted(() => vi.fn<(payload: unknown, pathname: string) => Promise<string | null>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("./find-redirect", () => ({ findRedirectTarget }));
vi.mock("../logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { clearRedirectCache, REDIRECT_CACHE_TTL_MS, REDIRECT_LOOKUP_TIMEOUT_MS, resolveRedirect } from "./resolve-redirect";

beforeEach(() => {
  vi.useFakeTimers();
  clearRedirectCache();
  findRedirectTarget.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("resolveRedirect", () => {
  it("cache cả kết quả có và không có trong TTL, hết TTL thì tra lại", async () => {
    findRedirectTarget.mockResolvedValueOnce("/tin-tuc/moi").mockResolvedValueOnce(null).mockResolvedValue("/tin-tuc/moi-2");
    expect(await resolveRedirect("/tin-tuc/cu")).toBe("/tin-tuc/moi");
    expect(await resolveRedirect("/tin-tuc/cu")).toBe("/tin-tuc/moi");
    expect(await resolveRedirect("/tin-tuc/khong")).toBeNull();
    expect(await resolveRedirect("/tin-tuc/khong")).toBeNull();
    expect(findRedirectTarget).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(REDIRECT_CACHE_TTL_MS + 1);
    expect(await resolveRedirect("/tin-tuc/cu")).toBe("/tin-tuc/moi-2");
  });

  it("quá hạn → null (không chờ DB) và không cache", async () => {
    findRedirectTarget.mockReturnValueOnce(new Promise(() => undefined)).mockResolvedValueOnce("/tin-tuc/moi");
    const pending = resolveRedirect("/tin-tuc/cu");
    await vi.advanceTimersByTimeAsync(REDIRECT_LOOKUP_TIMEOUT_MS + 1);
    expect(await pending).toBeNull();
    expect(await resolveRedirect("/tin-tuc/cu")).toBe("/tin-tuc/moi");
  });

  it("lỗi DB → null và không cache", async () => {
    findRedirectTarget.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce("/tin-tuc/moi");
    expect(await resolveRedirect("/tin-tuc/cu")).toBeNull();
    expect(await resolveRedirect("/tin-tuc/cu")).toBe("/tin-tuc/moi");
  });
});
