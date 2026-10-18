import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { blockDeleteWhileUsedByHomepage } from "./guard-delete";

const homepage = {
  hero: { slides: [{ image: "img-1", video: "vid-1" }, { image: "img-2" }] },
  about: { image: "about-1" },
  ctaBanner: { backgroundImage: "cta-1" },
};

function fakeRequest(locale: string) {
  const dbFindGlobal = vi.fn(async () => homepage);
  const localFindGlobal = vi.fn();
  const req = {
    locale,
    fallbackLocale: "vi",
    payload: { config: { globals: [{ slug: "homepage" }] }, db: { findGlobal: dbFindGlobal }, findGlobal: localFindGlobal },
  } as unknown as PayloadRequest;
  return { req, dbFindGlobal, localFindGlobal };
}

const run = (id: string, req: PayloadRequest) =>
  // Hook `beforeDelete` chỉ dùng `id` và `req`.
  blockDeleteWhileUsedByHomepage({ id, req } as never);

describe("blockDeleteWhileUsedByHomepage", () => {
  it.each([
    ["ảnh slide", "img-2"],
    ["video slide", "vid-1"],
    ["ảnh khối Về TAMI", "about-1"],
    ["ảnh nền CTA banner", "cta-1"],
  ])("chặn xoá media là %s (409)", async (_label, id) => {
    const { req } = fakeRequest("vi");
    await expect(run(id, req)).rejects.toMatchObject({ status: 409 });
  });

  it("media không dùng (kể cả ảnh OG của SEO) xoá được", async () => {
    const { req } = fakeRequest("vi");
    await expect(run("og-image", req)).resolves.toBeUndefined();
  });

  it("đọc bản vi bằng adapter DB, KHÔNG qua Local API: request en không bị đổi locale", async () => {
    const { req, dbFindGlobal, localFindGlobal } = fakeRequest("en");
    await expect(run("img-1", req)).rejects.toMatchObject({ status: 409 });
    expect(dbFindGlobal).toHaveBeenCalledWith(expect.objectContaining({ slug: "homepage", locale: "vi" }));
    expect(localFindGlobal).not.toHaveBeenCalled();
    expect(req.locale).toBe("en");
    expect(req.fallbackLocale).toBe("vi");
  });

  it("config không có global homepage thì bỏ qua", async () => {
    const { req, dbFindGlobal } = fakeRequest("vi");
    (req.payload.config as { globals: unknown[] }).globals = [];
    await expect(run("img-1", req)).resolves.toBeUndefined();
    expect(dbFindGlobal).not.toHaveBeenCalled();
  });
});
