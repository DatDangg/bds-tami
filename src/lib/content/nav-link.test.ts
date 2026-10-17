import { describe, expect, it } from "vitest";

import { pathnames } from "../../i18n/routing";
import { isPageLinkKey, PAGE_LINK_KEYS, resolveNavLink, validateNavLink } from "./nav-link";

describe("resolveNavLink: khoá trang → đường dẫn công khai theo ngôn ngữ", () => {
  it("vi không tiền tố, en có /en và đường dẫn tiếng Anh", () => {
    expect(resolveNavLink("projects", "vi")).toEqual({ href: "/du-an", external: false });
    expect(resolveNavLink("projects", "en")).toEqual({ href: "/en/projects", external: false });
    expect(resolveNavLink("rentals", "en")).toEqual({ href: "/en/for-rent", external: false });
    expect(resolveNavLink("contact", "vi")?.href).toBe("/lien-he");
    expect(resolveNavLink("privacy-policy", "en")?.href).toBe("/en/privacy-policy");
  });

  it("trang chủ: / và /en", () => {
    expect(resolveNavLink("home", "vi")?.href).toBe("/");
    expect(resolveNavLink("home", "en")?.href).toBe("/en");
  });

  it("URL tuyệt đối http/https giữ nguyên, đánh dấu external", () => {
    expect(resolveNavLink("https://zalo.me/abc", "vi")).toEqual({ href: "https://zalo.me/abc", external: true });
    expect(resolveNavLink("http://example.com/x?y=1", "en")?.external).toBe(true);
  });

  it("giá trị trống hoặc không hợp lệ → null", () => {
    expect(resolveNavLink("", "vi")).toBeNull();
    expect(resolveNavLink(null, "vi")).toBeNull();
    expect(resolveNavLink("khong-co-trang", "vi")).toBeNull();
    expect(resolveNavLink("javascript:alert(1)", "vi")).toBeNull();
    expect(resolveNavLink("//evil.example", "vi")).toBeNull();
    expect(resolveNavLink("toString", "vi")).toBeNull();
  });

  it("mọi khoá trang trỏ tới khoá pathnames có thật", () => {
    for (const key of Object.values(PAGE_LINK_KEYS)) expect(pathnames).toHaveProperty([key]);
  });
});

describe("validateNavLink", () => {
  it("chấp nhận khoá trang, URL http/https và giá trị trống", () => {
    expect(validateNavLink("projects")).toBe(true);
    expect(validateNavLink("https://example.com")).toBe(true);
    expect(validateNavLink("http://example.com")).toBe(true);
    expect(validateNavLink("")).toBe(true);
    expect(validateNavLink(undefined)).toBe(true);
  });

  it("từ chối scheme nguy hiểm, khoá lạ, đường dẫn tương đối", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "ftp://x.test", "/du-an", "unknown", "mailto:a@b.c"]) {
      expect(validateNavLink(bad)).toEqual(expect.any(String));
    }
  });

  it("isPageLinkKey không nhận thuộc tính của Object.prototype", () => {
    expect(isPageLinkKey("constructor")).toBe(false);
    expect(isPageLinkKey("news")).toBe(true);
  });
});
