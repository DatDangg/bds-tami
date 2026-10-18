import { beforeEach, describe, expect, it, vi } from "vitest";

type Resolver = (path: string, target: string) => Promise<string>;
// Hàm thường (không phải vi.fn) để mô phỏng lỗi tra DB: vitest coi lỗi do spy ném ra là lỗi của test dù route đã bắt.
const state = vi.hoisted(() => ({ resolve: (async () => "") as Resolver, calls: [] as [string, string][] }));
vi.mock("@/lib/i18n/resolve-counterpart", () => ({
  resolveCounterpartPath: (path: string, target: string) => {
    state.calls.push([path, target]);
    return state.resolve(path, target);
  },
}));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { GET } from "./route";

const call = (query: string) => GET(new Request(`http://localhost:3000/api/locale-counterpart?${query}`));

beforeEach(() => {
  state.calls.length = 0;
  state.resolve = async () => "/";
});

describe("GET /api/locale-counterpart", () => {
  it("302 tới đường dẫn tương ứng (tương đối), cache ngắn ở CDN", async () => {
    state.resolve = async () => "/cho-thue/can-ho-a";
    const res = await call(`to=vi&path=${encodeURIComponent("/en/for-rent/apartment-a")}`);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/cho-thue/can-ho-a");
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
    expect(state.calls).toEqual([["/en/for-rent/apartment-a", "vi"]]);
  });

  it.each(["to=fr&path=/cho-thue/x", "path=/cho-thue/x", "to=en", "to=en&path=cho-thue/x", "to=en&path=https://evil.com", `to=en&path=/${"a".repeat(400)}`])(
    "đầu vào sai (%s) → 400, không tra DB",
    async (query) => {
      expect((await call(query)).status).toBe(400);
      expect(state.calls).toEqual([]);
    },
  );

  it("lỗi khi tra → 302 về trang chủ ngôn ngữ đích, không lộ lỗi", async () => {
    state.resolve = async () => {
      throw new Error("db down");
    };
    const res = await call("to=en&path=/cho-thue/x");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/en");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
