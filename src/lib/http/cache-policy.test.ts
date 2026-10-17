import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import {
  cacheControlHeaders,
  DOTTED_PATH_CACHE_CONTROL,
  DOTTED_PATH_SOURCE,
  MEDIA_FILE_CACHE_CONTROL,
  NO_STORE_CACHE_CONTROL,
  PUBLIC_PAGE_CACHE_CONTROL,
  PUBLIC_PAGE_SOURCE,
  withDefaultNoStore,
} from "./cache-policy";

// Bản biên dịch sẵn của Next không có type; đây đúng là bộ biên dịch `source` của `headers()` lúc build.
const { pathToRegexp } = createRequire(import.meta.url)("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (source: string) => RegExp;
};

describe("giá trị chính sách (ARCHITECTURE §5.1)", () => {
  it("khớp tài liệu", () => {
    expect(PUBLIC_PAGE_CACHE_CONTROL).toBe("public, s-maxage=60, stale-while-revalidate=300");
    expect(NO_STORE_CACHE_CONTROL).toBe("no-store");
    expect(MEDIA_FILE_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
    expect(DOTTED_PATH_CACHE_CONTROL).toBe("public, max-age=0, s-maxage=60");
  });
});

describe("PUBLIC_PAGE_SOURCE (biên dịch bằng path-to-regexp của Next như khi build)", () => {
  const matcher = pathToRegexp(PUBLIC_PAGE_SOURCE);

  it.each(["/", "/en", "/en/projects", "/du-an/can-ho-a", "/tin-tuc", "/administrator", "/apix"])("%s là trang công khai", (path) => {
    expect(matcher.test(path)).toBe(true);
  });

  it.each(["/api", "/api/health", "/api/media/file/a.jpg", "/admin", "/admin/collections/news", "/_next/static/a.js", "/robots.txt", "/sitemap.xml"])(
    "%s không phải trang công khai",
    (path) => {
      expect(matcher.test(path)).toBe(false);
    },
  );
});

describe("DOTTED_PATH_SOURCE (path có đuôi file, biên dịch bằng path-to-regexp của Next)", () => {
  const matcher = pathToRegexp(DOTTED_PATH_SOURCE);

  it.each(["/robots.txt", "/sitemap.xml", "/llms.txt", "/favicon.ico", "/brand/tami-logo-gold.png", "/en/robots.txt"])(
    "%s nhận TTL ngắn",
    (path) => {
      expect(matcher.test(path)).toBe(true);
    },
  );

  it.each(["/", "/en", "/du-an/can-ho-a", "/api/media/file/a.jpg", "/api/health", "/admin/a.b", "/_next/static/chunks/a.js", "/_next/static/media/f.woff2"])(
    "%s KHÔNG bị rule này (asset có hash, /api, /admin, trang)",
    (path) => {
      expect(matcher.test(path)).toBe(false);
    },
  );

  it("hai nhóm PUBLIC_PAGE_SOURCE và DOTTED_PATH_SOURCE không chồng nhau", () => {
    const page = pathToRegexp(PUBLIC_PAGE_SOURCE);
    for (const path of ["/", "/en", "/robots.txt", "/brand/a.png", "/api/x", "/admin", "/_next/static/a.js"]) {
      expect(page.test(path) && matcher.test(path)).toBe(false);
    }
  });
});

describe("cacheControlHeaders (next.config)", () => {
  it("chỉ khai trang công khai, path có đuôi và /admin; KHÔNG khai /api/* (sẽ đè header route tự đặt)", () => {
    const rules = cacheControlHeaders().filter((rule) => !("has" in rule));
    expect(rules.map((rule) => rule.source)).toEqual([PUBLIC_PAGE_SOURCE, DOTTED_PATH_SOURCE, "/admin/:path*"]);
    expect(rules.some((rule) => rule.source.startsWith("/api"))).toBe(false);
    expect(rules[0]?.headers).toEqual([{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE_CONTROL }]);
    expect(rules[1]?.headers).toEqual([{ key: "Cache-Control", value: DOTTED_PATH_CACHE_CONTROL }]);
    expect(rules[2]?.headers).toEqual([{ key: "Cache-Control", value: NO_STORE_CACHE_CONTROL }]);
  });

  it("biến thể RSC (header rsc/next-router-*, query _rsc) là private, no-store và đứng SAU rule trang công khai", () => {
    const all = cacheControlHeaders();
    const publicIndex = all.findIndex((rule) => rule.source === PUBLIC_PAGE_SOURCE && !("has" in rule));
    const rsc = all.filter((rule) => "has" in rule);
    const conditions = rsc.map((rule) => JSON.stringify((rule as { has: unknown }).has));
    expect(conditions).toEqual([
      '[{"type":"header","key":"rsc"}]',
      '[{"type":"header","key":"next-router-prefetch"}]',
      '[{"type":"header","key":"next-router-state-tree"}]',
      '[{"type":"header","key":"next-router-segment-prefetch"}]',
      '[{"type":"query","key":"_rsc"}]',
    ]);
    for (const rule of rsc) {
      expect(rule.source).toBe(PUBLIC_PAGE_SOURCE);
      expect(rule.headers).toEqual([{ key: "Cache-Control", value: NO_STORE_CACHE_CONTROL }]);
      expect(all.indexOf(rule)).toBeGreaterThan(publicIndex);
    }
  });
});

describe("withDefaultNoStore", () => {
  it("thêm no-store khi response chưa có Cache-Control, giữ nguyên status và thân", async () => {
    const wrapped = withDefaultNoStore(() => new Response("lỗi", { status: 404, headers: { "X-A": "1" } }));
    const response = await wrapped();
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-A")).toBe("1");
    expect(await response.text()).toBe("lỗi");
  });

  it("giữ nguyên Cache-Control do route đặt (ảnh immutable, monitoring-config private)", async () => {
    const wrapped = withDefaultNoStore(() => new Response("x", { headers: { "Cache-Control": MEDIA_FILE_CACHE_CONTROL } }));
    expect((await wrapped()).headers.get("Cache-Control")).toBe(MEDIA_FILE_CACHE_CONTROL);
  });

  it("xử lý response redirect (header immutable) và 304 không thân", async () => {
    const redirect = await withDefaultNoStore(() => Response.redirect("http://localhost/x", 302))();
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("Cache-Control")).toBe("no-store");
    const notModified = await withDefaultNoStore(() => new Response(null, { status: 304 }))();
    expect(notModified.status).toBe(304);
    expect(notModified.headers.get("Cache-Control")).toBe("no-store");
  });

  it("chuyển đối số cho handler", async () => {
    const wrapped = withDefaultNoStore((a: number, b: number) => Response.json({ sum: a + b }));
    expect(await (await wrapped(2, 3)).json()).toEqual({ sum: 5 });
  });
});
