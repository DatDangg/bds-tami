import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = process.env.DATABASE_URL_TEST;
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<<>>\nstartxref\n0\n%%EOF\n");
const PASSWORD = "Mat-khau-hop-le-123";
const RANDOM_UUID = "11111111-2222-4333-8444-555555555555";
const ADMIN_IP = "203.0.113.77";

/** DB tạm (migration thật) + SeaweedFS dev thật. Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích. */
describe.skipIf(!baseUrl)("integration: GET /api/admin/private-files/:id/download (DB tạm + S3 thật)", () => {
  const dbName = `tami_cvdl_${Date.now().toString(36)}`;
  const extraKeys: string[] = [];
  let payload: Payload;
  let s3: S3Client;
  let bucket = "";
  let tokens: { admin: string; sale: string; inactive: string };
  let cvId = "";
  let cvFilename = "";

  const download = (id: string, token?: string) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api/admin/private-files/${id}/download`, {
        method: "GET",
        headers: { "CF-Connecting-IP": ADMIN_IP, ...(token ? { Authorization: `JWT ${token}` } : {}) },
      }),
    });

  const viewCvLogs = () =>
    payload.find({ collection: "audit-logs", where: { action: { equals: "application.view_cv" } }, overrideAccess: true, depth: 0, limit: 50, sort: "createdAt" });

  const storeFile = (name: string) =>
    payload.create({
      collection: "private-files",
      data: {},
      file: { data: PDF, mimetype: "application/pdf", name, size: PDF.byteLength },
      overrideAccess: true,
      depth: 0,
    });

  async function createStaff(role: "admin" | "sale", active = true) {
    const email = `${role}-${Math.random().toString(36).slice(2)}@example.test`;
    const user = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email, password: PASSWORD, fullName: role === "admin" ? "Quản trị" : "Nhân viên", role, active: true },
    });
    const { token } = await payload.login({ collection: "staff", data: { email, password: PASSWORD } });
    if (!active) await payload.update({ collection: "staff", id: user.id, data: { active: false }, overrideAccess: true });
    return token!;
  }

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const testUrl = new URL(baseUrl!);
    testUrl.pathname = `/${dbName}`;
    process.env.DATABASE_URL = testUrl.toString();
    process.env.TRUST_CF_CONNECTING_IP = "true";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    bucket = process.env.S3_BUCKET_PRIVATE ?? "";
    s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
    });

    tokens = { admin: await createStaff("admin"), sale: await createStaff("sale"), inactive: await createStaff("admin", false) };
    const stored = await storeFile("cv-test.pdf");
    cvId = stored.id;
    cvFilename = stored.filename ?? "";
  }, 120_000);

  afterAll(async () => {
    await payload?.delete({ collection: "private-files", where: { id: { exists: true } }, overrideAccess: true }).catch(() => {});
    for (const Key of extraKeys) await s3?.send(new DeleteObjectCommand({ Bucket: bucket, Key })).catch(() => {});
    const pool = (payload?.db as unknown as { pool?: EventEmitter & { _clients?: EventEmitter[] } } | undefined)?.pool;
    pool?.on("error", () => undefined);
    for (const client of pool?._clients ?? []) client.on("error", () => undefined);
    await payload?.destroy();
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    } finally {
      await connection.end();
    }
  }, 60_000);

  it("admin tải CV: 200, đúng byte, header tải về an toàn, không cache, không chuyển hướng tới URL công khai", async () => {
    const response = await download(cvId, tokens.admin);
    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer()).equals(PDF)).toBe(true);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Length")).toBe(String(PDF.byteLength));
    expect(response.headers.get("Content-Disposition")).toBe(
      `attachment; filename="${cvFilename}"; filename*=UTF-8''${encodeURIComponent(cvFilename)}`,
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Location")).toBeNull();
  });

  it("mỗi lần tải ghi 1 audit application.view_cv: actor, docId, ipHash; không có PII/tên file/IP thô", async () => {
    const before = (await viewCvLogs()).totalDocs;
    expect((await download(cvId, tokens.admin)).status).toBe(200);
    const logs = await viewCvLogs();
    expect(logs.totalDocs).toBe(before + 1);
    const entry = logs.docs.at(-1)!;
    expect(entry).toMatchObject({ action: "application.view_cv", collection: "private-files", docId: cvId });
    expect(entry.actor).toBeTruthy();
    // `ipHash` không trả ra qua API: đọc thẳng DB.
    const raw = await payload.db.find({ collection: "audit-logs", where: { action: { equals: "application.view_cv" } }, limit: 50, pagination: false });
    expect((raw.docs.at(-1) as { ipHash?: string }).ipHash).toMatch(/^[0-9a-f]{64}$/);
    const text = JSON.stringify(entry);
    expect(text).not.toContain(cvFilename);
    expect(text).not.toContain("example.test");
    expect(text).not.toContain(ADMIN_IP);
  });

  it("khách chưa đăng nhập hoặc token giả -> 401; không ghi audit", async () => {
    const before = (await viewCvLogs()).totalDocs;
    expect((await download(cvId)).status).toBe(401);
    expect((await download(cvId, "token.gia.mao")).status).toBe(401);
    expect((await viewCvLogs()).totalDocs).toBe(before);
  });

  it("sale -> 403, kể cả với id không tồn tại (không lộ sự tồn tại); không ghi audit", async () => {
    const before = (await viewCvLogs()).totalDocs;
    expect((await download(cvId, tokens.sale)).status).toBe(403);
    expect((await download(RANDOM_UUID, tokens.sale)).status).toBe(403);
    expect((await viewCvLogs()).totalDocs).toBe(before);
  });

  it("admin đã bị khoá -> không tải được (401/403); không ghi audit", async () => {
    const before = (await viewCvLogs()).totalDocs;
    expect([401, 403]).toContain((await download(cvId, tokens.inactive)).status);
    expect((await viewCvLogs()).totalDocs).toBe(before);
  });

  it("id không tồn tại -> 404; id sai định dạng/path traversal -> 400; không ghi audit", async () => {
    const before = (await viewCvLogs()).totalDocs;
    expect((await download(RANDOM_UUID, tokens.admin)).status).toBe(404);
    expect((await download("not-a-uuid", tokens.admin)).status).toBe(400);
    expect((await download("..%2F..%2Fetc%2Fpasswd", tokens.admin)).status).toBe(400);
    expect((await viewCvLogs()).totalDocs).toBe(before);
  });

  it("bản ghi còn nhưng object S3 đã mất -> 404; không ghi audit", async () => {
    const orphan = await storeFile("orphan.pdf");
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: orphan.filename! }));
    const before = (await viewCvLogs()).totalDocs;
    expect((await download(orphan.id, tokens.admin)).status).toBe(404);
    expect((await viewCvLogs()).totalDocs).toBe(before);
  });

  it("tên file trong DB chứa dấu nháy, ; và Unicode: header vẫn an toàn; MIME lạ -> octet-stream", async () => {
    const nasty = 'cv"; filename=evil.exe; x=é ü.pdf';
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: nasty, Body: PDF, ContentType: "application/pdf" }));
    extraKeys.push(nasty);
    const record = await storeFile("nasty-base.pdf");
    await payload.db.updateOne({ collection: "private-files", id: record.id, data: { filename: nasty, mimeType: "text/html; charset=utf-8" } });
    const response = await download(record.id, tokens.admin);
    expect(response.status).toBe(200);
    const disposition = response.headers.get("Content-Disposition")!;
    expect(disposition).not.toMatch(/[\r\n]/);
    expect(disposition).toMatch(/^attachment; filename="[A-Za-z0-9._-]+"; filename\*=UTF-8''[A-Za-z0-9%._~!-]+$/);
    expect(disposition).not.toContain("evil.exe;");
    expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
    await response.arrayBuffer();
  });

  it("không có route công khai nào phục vụ file: /api/private-files/file/:name -> 404", async () => {
    const response = await handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api/private-files/file/${cvFilename}`, { method: "GET", headers: { Authorization: `JWT ${tokens.admin}` } }),
    });
    expect(response.status).toBe(404);
  });

  it("ghi audit lỗi -> fail-closed: 500, không trả nội dung file", async () => {
    const original = payload.create.bind(payload);
    (payload as unknown as { create: unknown }).create = ((args: { collection: string }) =>
      args.collection === "audit-logs" ? Promise.reject(new Error("audit down")) : original(args as never)) as never;
    try {
      const response = await download(cvId, tokens.admin);
      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Disposition")).toBeNull();
    } finally {
      (payload as unknown as { create: unknown }).create = original;
    }
  });
});
