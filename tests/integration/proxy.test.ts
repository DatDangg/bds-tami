import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import proxy, { config } from "@/proxy";

// Tra DB redirect có test riêng (content-redirects.test.ts); ở đây chỉ kiểm cách proxy dùng kết quả.
const resolveRedirect = vi.hoisted(() => vi.fn<(pathname: string) => Promise<string | null>>());
vi.mock("@/lib/content/resolve-redirect", () => ({ resolveRedirect }));

beforeEach(() => resolveRedirect.mockReset().mockResolvedValue(null));

const call = (path: string, headers: Record<string, string> = {}) =>
  proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));

// Header nội bộ của Next khi rewrite: nơi next-intl báo URL thật được phục vụ ở route nào.
const rewriteTarget = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("proxy (next-intl)", () => {
  it("`/` vào tiếng Việt kể cả khi Accept-Language: en, không chuyển hướng", async () => {
    const res = await call("/", { "accept-language": "en-US,en;q=0.9" });
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(rewriteTarget(res)).toContain("/vi");
  });

  it("không đặt cookie NEXT_LOCALE khi chỉ xem trang", async () => {
    expect((await call("/", { "accept-language": "en" })).headers.get("set-cookie")).toBeNull();
  });

  it("không có header Link hreflang tự sinh (slug EN riêng, hreflang làm ở metadata/sitemap)", async () => {
    for (const path of ["/", "/en", "/du-an/abc", "/en/projects/abc"]) {
      expect((await call(path)).headers.get("link")).toBeNull();
    }
  });

  it("cookie NEXT_LOCALE=en không làm `/` chuyển hướng", async () => {
    const res = await call("/", { cookie: "NEXT_LOCALE=en" });
    expect(res.headers.get("location")).toBeNull();
    expect(rewriteTarget(res)).toContain("/vi");
  });

  it("`/du-an` → vi; `/en/projects` → en", async () => {
    expect(rewriteTarget(await call("/du-an"))).toContain("/vi/du-an");
    expect((await call("/du-an")).headers.get("x-middleware-request-x-next-intl-locale")).toBe("vi");
    expect(rewriteTarget(await call("/en/projects"))).toContain("/en/du-an");
    const home = await call("/en");
    expect(home.status).toBe(200);
    expect(home.headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
  });

  it("`/vi` và `/vi/du-an` → 301 về bản không tiền tố", async () => {
    const home = await call("/vi");
    expect(home.status).toBe(301);
    expect(new URL(home.headers.get("location")!).pathname).toBe("/");
    const page = await call("/vi/du-an");
    expect(page.status).toBe(301);
    expect(new URL(page.headers.get("location")!).pathname).toBe("/du-an");
  });

  it("không redirect `/` → `/vi`", async () => {
    expect((await call("/")).status).not.toBe(301);
  });

  it("đường dẫn tiếng Anh dùng ở bản vi (và ngược lại) bị chuẩn hoá bằng 301", async () => {
    const res = await call("/en/du-an");
    expect(res.status).toBe(301);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/en/projects");
  });
});

describe("proxy redirect slug cũ: chỉ trong cùng origin", () => {
  it("target nội bộ → 301 giữ query", async () => {
    resolveRedirect.mockResolvedValue("/tin-tuc/moi");
    const res = await call("/tin-tuc/cu?utm=1");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("http://localhost:3000/tin-tuc/moi?utm=1");
  });

  it.each(["/\\evil.com", "/\\\\evil.com", "/%5Cevil.com", "//evil.com", "https://evil.com/x", "\\\\evil.com"])(
    "target %s không bao giờ thành Location ra ngoài origin",
    async (target) => {
      resolveRedirect.mockResolvedValue(target);
      const res = await call("/tin-tuc/cu");
      const location = res.headers.get("location");
      if (location) expect(new URL(location, "http://localhost:3000").origin).toBe("http://localhost:3000");
      expect(res.status === 301 ? new URL(location!).origin : "http://localhost:3000").toBe("http://localhost:3000");
    },
  );
});

describe("proxy matcher", () => {
  const pattern = new RegExp(`^${config.matcher[0]}$`);
  it.each(["/admin", "/admin/collections/staff", "/api/staff/login", "/_next/static/a.js", "/sitemap.xml", "/robots.txt", "/logo.png"])(
    "bỏ qua %s",
    (path) => expect(pattern.test(path)).toBe(false),
  );
  it.each(["/", "/en", "/du-an", "/en/projects/abc", "/vi/du-an", "/administrator-guide"])(
    "xử lý %s",
    (path) => expect(pattern.test(path)).toBe(true),
  );
});

describe("proxy redirect slug cũ (BR-05)", () => {
  it("URL có redirect → 301 tới đích cùng ngôn ngữ, giữ query", async () => {
    resolveRedirect.mockResolvedValue("/en/news/new");
    const res = await call("/en/news/old?utm=a");
    expect(res.status).toBe(301);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname + location.search).toBe("/en/news/new?utm=a");
    expect(resolveRedirect).toHaveBeenCalledWith("/en/news/old");
  });

  it("không có redirect → đi tiếp next-intl như thường", async () => {
    const res = await call("/tin-tuc/bai-viet");
    expect(res.status).toBe(200);
    expect(rewriteTarget(res)).toContain("/vi/tin-tuc/bai-viet");
  });
});
