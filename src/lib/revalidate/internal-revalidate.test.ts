import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import type { PayloadRequest } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createRevalidateViaApp,
  handleInternalRevalidate,
  isValidRevalidateAuth,
  MAX_PATHS_PER_REQUEST,
  parseRevalidateBody,
  revalidateToken,
} from "./internal-revalidate";

const SECRET = "secret-test-khong-dung-o-production";
const fakeReq = {} as PayloadRequest;

describe("token + body", () => {
  it("token dẫn xuất ổn định từ secret, không bằng secret, khác nhau theo secret", () => {
    expect(revalidateToken(SECRET)).toBe(revalidateToken(SECRET));
    expect(revalidateToken(SECRET)).not.toContain(SECRET);
    expect(revalidateToken(SECRET)).not.toBe(revalidateToken(`${SECRET}x`));
  });

  it("chỉ nhận Bearer đúng token", () => {
    const token = revalidateToken(SECRET);
    expect(isValidRevalidateAuth(`Bearer ${token}`, SECRET)).toBe(true);
    for (const header of [null, "", token, `Bearer ${token}x`, `Bearer ${SECRET}`, "Basic abc", `bearer ${token}`]) {
      expect(isValidRevalidateAuth(header, SECRET)).toBe(false);
    }
  });

  it("body: chỉ đường dẫn trang công khai /vi|/en, tối đa MAX_PATHS_PER_REQUEST", () => {
    expect(parseRevalidateBody(JSON.stringify({ paths: ["/vi", "/en/tin-bds", "/vi/tin-bds/khuyen-mai%20hot"] }))).toHaveLength(3);
    const bad = [
      "/admin",
      "/api/users",
      "vi/tin-bds",
      "//evil.test",
      "/vi/../admin",
      "/vi/./x",
      "/vi/tin-bds/",
      "/fr/tin-bds",
      "https://evil.test/vi",
      "/vi?x=1",
      "/vi/a b",
      "",
    ];
    for (const path of bad) expect(parseRevalidateBody(JSON.stringify({ paths: [path] })), path).toBeNull();
    expect(parseRevalidateBody(JSON.stringify({ paths: ["/vi", 3] }))).toBeNull();
    expect(parseRevalidateBody(JSON.stringify({}))).toBeNull();
    expect(parseRevalidateBody("không phải json")).toBeNull();
    expect(parseRevalidateBody(JSON.stringify({ paths: Array.from({ length: MAX_PATHS_PER_REQUEST + 1 }, () => "/vi") }))).toBeNull();
  });
});

describe("client (job) gọi route (app) qua HTTP thật", () => {
  const revalidated: string[] = [];
  let server: Server;
  let baseUrl = "";
  let requests = 0;

  beforeAll(async () => {
    server = createServer(async (incoming, outgoing) => {
      requests += 1;
      const chunks: Buffer[] = [];
      for await (const chunk of incoming) chunks.push(chunk as Buffer);
      const request = new Request(`http://localhost${incoming.url}`, {
        method: incoming.method,
        headers: incoming.headers as Record<string, string>,
        body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
      });
      const response = await handleInternalRevalidate(request, { secret: SECRET, revalidate: (path) => void revalidated.push(path) });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(await response.text());
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("đường dẫn đến đúng app và được revalidate; trả 200", async () => {
    revalidated.length = 0;
    await createRevalidateViaApp({ baseUrl, secret: SECRET })(["/vi/tin-bds/a", "/en", "/vi"], fakeReq);
    expect(revalidated).toEqual(["/vi/tin-bds/a", "/en", "/vi"]);
  });

  it("chia lô khi vượt trần mỗi request", async () => {
    revalidated.length = 0;
    requests = 0;
    const paths = Array.from({ length: MAX_PATHS_PER_REQUEST + 5 }, (_, index) => `/vi/tin-bds/b-${index}`);
    await createRevalidateViaApp({ baseUrl, secret: SECRET })(paths, fakeReq);
    expect(requests).toBe(2);
    expect(revalidated).toEqual(paths);
  });

  it("sai secret → app trả 401, client ném lỗi (để Payload Jobs thử lại), không revalidate gì", async () => {
    revalidated.length = 0;
    await expect(createRevalidateViaApp({ baseUrl, secret: "secret-sai" })(["/vi"], fakeReq)).rejects.toThrow(/401/);
    expect(revalidated).toEqual([]);
  });

  it("app không với tới được → client ném lỗi (không nuốt)", async () => {
    await expect(createRevalidateViaApp({ baseUrl: "http://127.0.0.1:1", secret: SECRET })(["/vi"], fakeReq)).rejects.toThrow();
  });

  it("route từ chối body sai (400) và không có token (401)", async () => {
    const token = revalidateToken(SECRET);
    const post = (body: string, authorization?: string) =>
      handleInternalRevalidate(
        new Request("http://localhost/api/internal/revalidate", { method: "POST", body, headers: authorization ? { authorization } : {} }),
        { secret: SECRET, revalidate: () => undefined },
      );
    expect((await post(JSON.stringify({ paths: ["/admin"] }), `Bearer ${token}`)).status).toBe(400);
    expect((await post(JSON.stringify({ paths: ["/vi"] }))).status).toBe(401);
    expect((await post(JSON.stringify({ paths: ["/vi"] }), `Bearer ${token}`)).status).toBe(200);
  });
});
