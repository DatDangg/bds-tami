import { describe, expect, it } from "vitest";

import { CONTENT_ROUTES } from "./content-paths";
import { isRedirectSourcePath, normalizeRedirectSource, publicDetailPath } from "./redirect-paths";

describe("publicDetailPath", () => {
  it("vi không tiền tố, en có /en và đường dẫn tiếng Anh", () => {
    expect(publicDetailPath(CONTENT_ROUTES.news, "vi", "bai-moi")).toBe("/tin-tuc/bai-moi");
    expect(publicDetailPath(CONTENT_ROUTES.news, "en", "new-post")).toBe("/en/news/new-post");
    expect(publicDetailPath(CONTENT_ROUTES["job-postings"], "en", "dev")).toBe("/en/careers/dev");
    expect(publicDetailPath(CONTENT_ROUTES.services, "vi", "tu-van")).toBe("/dich-vu/tu-van");
  });

  it("mã hoá slug có ký tự đặc biệt", () => {
    expect(publicDetailPath(CONTENT_ROUTES.news, "vi", "a b")).toBe("/tin-tuc/a%20b");
  });
});

describe("isRedirectSourcePath", () => {
  it.each(["/tin-tuc/cu", "/tin-tuc/cu/", "/en/news/old", "/du-an/x", "/en/for-rent/x", "/en/careers/x", "/dich-vu/x", "/en/services/x"])(
    "%s có thể là slug cũ",
    (path) => expect(isRedirectSourcePath(path)).toBe(true),
  );

  it.each(["/", "/en", "/tin-tuc", "/en/news", "/tin-tuc/danh-muc/x", "/en/news/category/x", "/lien-he", "/en/contact", "/tin-tuc/", "/khac/x", "/tin-tuc/a/b"])(
    "%s thì không",
    (path) => expect(isRedirectSourcePath(path)).toBe(false),
  );

  it("normalizeRedirectSource bỏ / cuối nhưng giữ gốc", () => {
    expect(normalizeRedirectSource("/tin-tuc/cu/")).toBe("/tin-tuc/cu");
    expect(normalizeRedirectSource("/")).toBe("/");
  });
});
