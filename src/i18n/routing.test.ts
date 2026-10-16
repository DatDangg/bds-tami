import { describe, expect, it } from "vitest";
import { pathnames, routing } from "./routing";
import vi from "./messages/vi.json";
import en from "./messages/en.json";

const dynamicParams = (path: string) => path.match(/\[[^\]]+\]/g) ?? [];

describe("routing", () => {
  it("tiếng Việt mặc định, không tiền tố; không chuyển ngôn ngữ theo trình duyệt", () => {
    expect(routing.defaultLocale).toBe("vi");
    expect(routing.localePrefix).toBe("as-needed");
    expect(routing.localeDetection).toBe(false);
  });

  it("có đủ các cặp đường dẫn theo BRD §2.1", () => {
    const expected: Record<string, string> = {
      "/du-an": "/projects",
      "/du-an/[slug]": "/projects/[slug]",
      "/cho-thue": "/for-rent",
      "/cho-thue/danh-muc/[category]": "/for-rent/category/[category]",
      "/cho-thue/khu-vuc/[province]": "/for-rent/area/[province]",
      "/cho-thue/[slug]": "/for-rent/[slug]",
      "/tin-bds": "/property-news",
      "/tin-bds/danh-muc/[category]": "/property-news/category/[category]",
      "/tin-bds/[slug]": "/property-news/[slug]",
      "/tin-tuc": "/news",
      "/tin-tuc/danh-muc/[category]": "/news/category/[category]",
      "/tin-tuc/[slug]": "/news/[slug]",
      "/tuyen-dung": "/careers",
      "/tuyen-dung/[slug]": "/careers/[slug]",
      "/lien-he": "/contact",
      "/dich-vu/[slug]": "/services/[slug]",
      "/chinh-sach-bao-mat": "/privacy-policy",
      "/dieu-khoan-su-dung": "/terms-of-use",
    };
    expect(pathnames["/"]).toEqual({ vi: "/", en: "/" });
    for (const [vi, en] of Object.entries(expected)) {
      expect(pathnames[vi as keyof typeof pathnames]).toEqual({ vi, en });
    }
    expect(Object.keys(pathnames)).toHaveLength(Object.keys(expected).length + 1);
  });

  it("không trùng đường dẫn trong cùng một ngôn ngữ; slug động trùng tên giữa vi và en", () => {
    for (const locale of ["vi", "en"] as const) {
      const paths = Object.values(pathnames).map((p) => p[locale]);
      expect(new Set(paths).size).toBe(paths.length);
    }
    for (const p of Object.values(pathnames)) {
      expect(dynamicParams(p.en)).toEqual(dynamicParams(p.vi));
    }
  });
});

describe("messages", () => {
  const keysOf = (obj: object, prefix = ""): string[] =>
    Object.entries(obj).flatMap(([k, v]) =>
      typeof v === "object" && v !== null ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`],
    );

  it("vi.json và en.json có cùng bộ khoá", () => {
    expect(keysOf(en).sort()).toEqual(keysOf(vi).sort());
  });
});
