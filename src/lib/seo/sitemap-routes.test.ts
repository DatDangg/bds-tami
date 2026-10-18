import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  siteUrl: vi.fn<() => string | undefined>(),
  countSectionChunks: vi.fn<(...args: unknown[]) => Promise<number>>(),
  loadSectionUrls: vi.fn<(...args: unknown[]) => Promise<unknown[]>>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("../logger", () => ({ logger: { error: () => undefined } }));
vi.mock("./site-url", () => ({ getSiteUrl: mocks.siteUrl }));
vi.mock("./sitemap-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./sitemap-data")>()),
  countSectionChunks: mocks.countSectionChunks,
  loadSectionUrls: mocks.loadSectionUrls,
}));

import { sitemapFileResponse, sitemapIndexResponse } from "./sitemap-routes";

const request = (path = "/sitemaps/projects-1.xml") => new Request(`https://tami.example${path}`);

beforeEach(() => {
  mocks.siteUrl.mockReset().mockReturnValue("https://tami.example");
  mocks.countSectionChunks.mockReset().mockResolvedValue(1);
  mocks.loadSectionUrls.mockReset().mockResolvedValue([]);
});

describe("sitemapFileResponse", () => {
  it.each(["nhom-la-1.xml", "projects-0.xml", "projects-1.txt", "..%2Fx-1.xml"])("%s: 404, không chạm DB", async (file) => {
    const response = await sitemapFileResponse(file, request());
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=0, s-maxage=60");
    expect(mocks.countSectionChunks).not.toHaveBeenCalled();
  });

  it("chunk vượt số file thật: 404 (chỉ tốn câu count)", async () => {
    mocks.countSectionChunks.mockResolvedValue(2);
    expect((await sitemapFileResponse("projects-3.xml", request())).status).toBe(404);
    expect(mocks.loadSectionUrls).not.toHaveBeenCalled();
  });

  it("nhóm rỗng vẫn trả file 1 (urlset trống), nhưng chunk 2 là 404", async () => {
    mocks.countSectionChunks.mockResolvedValue(0);
    expect((await sitemapFileResponse("projects-1.xml", request())).status).toBe(200);
    expect((await sitemapFileResponse("projects-2.xml", request())).status).toBe(404);
  });

  it("static-2.xml: 404 (nhóm tĩnh chỉ có 1 file)", async () => {
    mocks.countSectionChunks.mockResolvedValue(1);
    expect((await sitemapFileResponse("static-2.xml", request())).status).toBe(404);
  });

  it("thiếu site URL: 503 no-store", async () => {
    mocks.siteUrl.mockReturnValue(undefined);
    const response = await sitemapFileResponse("projects-1.xml", request());
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("lỗi DB: 503 no-store", async () => {
    mocks.countSectionChunks.mockRejectedValue(new Error("db down"));
    const response = await sitemapFileResponse("projects-1.xml", request());
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("query string lạ: 404 trước khi chạm DB (không né cache CDN để ép truy vấn)", async () => {
    const response = await sitemapFileResponse("projects-1.xml", request("/sitemaps/projects-1.xml?x=123"));
    expect(response.status).toBe(404);
    expect(mocks.countSectionChunks).not.toHaveBeenCalled();
  });

  it("200: XML + Cache-Control ngắn", async () => {
    const response = await sitemapFileResponse("projects-1.xml", request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=0, s-maxage=60");
  });
});

describe("sitemapIndexResponse", () => {
  it("liệt kê file theo số chunk mỗi nhóm, đúng thứ tự nhóm", async () => {
    mocks.countSectionChunks.mockImplementation(async (_payload, section) => (section === "projects" ? 2 : section === "static" ? 1 : 0));
    const body = await (await sitemapIndexResponse(request("/sitemap.xml"))).text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs).toEqual([
      "https://tami.example/sitemaps/static-1.xml",
      "https://tami.example/sitemaps/projects-1.xml",
      "https://tami.example/sitemaps/projects-2.xml",
    ]);
  });

  it("thiếu site URL: 503 no-store; query lạ: 404", async () => {
    expect((await sitemapIndexResponse(request("/sitemap.xml?x=1"))).status).toBe(404);
    mocks.siteUrl.mockReturnValue(undefined);
    const response = await sitemapIndexResponse(request("/sitemap.xml"));
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
