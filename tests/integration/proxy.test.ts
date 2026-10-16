import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import proxy, { config } from "@/proxy";

const call = (path: string, headers: Record<string, string> = {}) =>
  proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));

// Header nội bộ của Next khi rewrite: nơi next-intl báo URL thật được phục vụ ở route nào.
const rewriteTarget = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("proxy (next-intl)", () => {
  it("`/` vào tiếng Việt kể cả khi Accept-Language: en, không chuyển hướng", () => {
    const res = call("/", { "accept-language": "en-US,en;q=0.9" });
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(rewriteTarget(res)).toContain("/vi");
  });

  it("không đặt cookie NEXT_LOCALE khi chỉ xem trang", () => {
    expect(call("/", { "accept-language": "en" }).headers.get("set-cookie")).toBeNull();
  });

  it("không có header Link hreflang tự sinh (slug EN riêng, hreflang làm ở metadata/sitemap)", () => {
    for (const path of ["/", "/en", "/du-an/abc", "/en/projects/abc"]) {
      expect(call(path).headers.get("link")).toBeNull();
    }
  });

  it("cookie NEXT_LOCALE=en không làm `/` chuyển hướng", () => {
    const res = call("/", { cookie: "NEXT_LOCALE=en" });
    expect(res.headers.get("location")).toBeNull();
    expect(rewriteTarget(res)).toContain("/vi");
  });

  it("`/du-an` → vi; `/en/projects` → en", () => {
    expect(rewriteTarget(call("/du-an"))).toContain("/vi/du-an");
    expect(call("/du-an").headers.get("x-middleware-request-x-next-intl-locale")).toBe("vi");
    expect(rewriteTarget(call("/en/projects"))).toContain("/en/du-an");
    const home = call("/en");
    expect(home.status).toBe(200);
    expect(home.headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
  });

  it("`/vi` và `/vi/du-an` → 301 về bản không tiền tố", () => {
    const home = call("/vi");
    expect(home.status).toBe(301);
    expect(new URL(home.headers.get("location")!).pathname).toBe("/");
    const page = call("/vi/du-an");
    expect(page.status).toBe(301);
    expect(new URL(page.headers.get("location")!).pathname).toBe("/du-an");
  });

  it("không redirect `/` → `/vi`", () => {
    expect(call("/").status).not.toBe(301);
  });

  it("đường dẫn tiếng Anh dùng ở bản vi (và ngược lại) bị chuẩn hoá bằng 301", () => {
    const res = call("/en/du-an");
    expect(res.status).toBe(301);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/en/projects");
  });
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
