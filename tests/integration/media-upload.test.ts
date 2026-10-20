import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { handleEndpoints, type Payload } from "payload";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const databaseUrl = process.env.DATABASE_URL_TEST;
const MB = 1024 * 1024;

interface TestFile {
  bytes: Uint8Array;
  name: string;
  type: string;
}

type IdOrDoc = string | { id: string };
const idOf = (value: IdOrDoc): string => (typeof value === "string" ? value : value.id);

// Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích (giống các integration test khác). Cần SeaweedFS dev chạy.
describe.skipIf(!databaseUrl)("integration: media + private-files (DB + SeaweedFS S3 thật)", () => {
  const runId = Date.now().toString(36);
  const password = "Mat-khau-hop-le-123";
  const staffIds: string[] = [];
  const mediaIds: string[] = [];
  const privateIds: string[] = [];
  let uploadedJpegFilename = "";
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};
  let payload: Payload;
  let s3: S3Client;
  let publicBucket: string;
  let privateBucket: string;

  const bigJpeg = () =>
    sharp({ create: { width: 2000, height: 1400, channels: 3, background: { r: 200, g: 80, b: 40 } } })
      .jpeg()
      .toBuffer();
  const pdfBytes = () => Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<<>>\nstartxref\n0\n%%EOF\n");

  async function createStaff(label: string, role: (typeof ROLES)[keyof typeof ROLES]) {
    const doc = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
    staffIds.push(doc.id);
    ids[label] = doc.id;
    const login = await payload.login({ collection: "staff", data: { email: doc.email, password } });
    tokens[label] = login.token ?? "";
  }

  /** Gọi REST như trình duyệt: multipart `file` + `_payload`. Không tự parse gì, đi qua handler của Payload. */
  function rest(path: string, init: { method: string; token?: string; file?: TestFile; data?: object; ifNoneMatch?: string }) {
    const headers: Record<string, string> = {};
    if (init.token) headers.Authorization = `JWT ${init.token}`;
    if (init.ifNoneMatch) headers["If-None-Match"] = init.ifNoneMatch;
    let body: FormData | undefined;
    if (init.file || init.data) {
      body = new FormData();
      if (init.data) body.append("_payload", JSON.stringify(init.data));
      if (init.file) body.append("file", new File([init.file.bytes as BlobPart], init.file.name, { type: init.file.type }));
    }
    return handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api${path}`, { method: init.method, headers, body }),
    });
  }

  async function uploadMedia(label: string, file: TestFile, data: object = {}) {
    const response = await rest("/media?locale=vi", { method: "POST", token: tokens[label], file, data: { alt: "Mô tả", ...data } });
    if (response.status === 201) {
      const body = (await response.clone().json()) as { doc: { id: string } };
      mediaIds.push(body.doc.id);
    }
    return response;
  }

  async function objectExists(bucket: string, key: string): Promise<boolean> {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    publicBucket = process.env.S3_BUCKET_PUBLIC ?? "";
    privateBucket = process.env.S3_BUCKET_PRIVATE ?? "";
    s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
    await createStaff("admin", ROLES.admin);
    await createStaff("sale", ROLES.sale);
    await createStaff("other", ROLES.sale);
  });

  afterAll(async () => {
    // Xoá doc kéo theo xoá object trên S3 (hook của plugin). Gỡ avatar trước để không vướng FK.
    for (const id of privateIds) await payload.delete({ collection: "private-files", id, overrideAccess: true }).catch(() => {});
    await payload.update({ collection: "staff", id: ids.sale ?? "", data: { avatar: null }, overrideAccess: true }).catch(() => {});
    for (const id of mediaIds) await payload.delete({ collection: "media", id, overrideAccess: true }).catch(() => {});
    for (const id of staffIds) await payload.delete({ collection: "staff", id, overrideAccess: true }).catch(() => {});
    await payload.destroy();
  });

  describe("media: upload", () => {
    it("JPG thật sinh thumb/card/large/og WebP; tên file ngẫu nhiên; uploadedBy tự gán; object có trên S3", async () => {
      const response = await uploadMedia("sale", { bytes: await bigJpeg(), name: "../anh-goc.JPG", type: "image/jpeg" });
      expect(response.status).toBe(201);
      const { doc } = (await response.json()) as {
        doc: {
          filename: string;
          mimeType: string;
          uploadedBy: IdOrDoc;
          sizes: Record<string, { filename: string; mimeType: string; width: number; height: number }>;
        };
      };
      expect(doc.filename).toMatch(/^[0-9a-f-]{36}\.jpg$/);
      expect(doc.mimeType).toBe("image/jpeg");
      expect(idOf(doc.uploadedBy)).toBe(ids.sale);
      const { thumb, card, large, og } = doc.sizes;
      expect([thumb?.width, card?.width, large?.width]).toEqual([400, 800, 1600]);
      expect([og?.width, og?.height]).toEqual([1200, 630]);
      for (const size of [thumb, card, large, og]) {
        expect(size?.mimeType).toBe("image/webp");
        expect(await objectExists(publicBucket, size?.filename ?? "missing")).toBe(true);
      }
      expect(await objectExists(publicBucket, doc.filename)).toBe(true);
      uploadedJpegFilename = doc.filename;
    });

    it("khách đọc được danh sách và file media", async () => {
      // Ghim đúng file test trước đã tải lên: "bản ghi mới nhất" không đáng tin vì file test khác (homepage/projects) chèn media không có object S3.
      const file = await rest(`/media/file/${uploadedJpegFilename}`, { method: "GET" });
      expect(file.status).toBe(200);
      expect(file.headers.get("content-type")).toContain("image/jpeg");
      // Ngoại lệ cache G1: storage-s3 không tự đặt Cache-Control, header do `Media.upload.modifyResponseHeaders` đặt.
      expect(file.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
      const etag = file.headers.get("etag");
      await file.arrayBuffer();
      const revalidated = await rest(`/media/file/${uploadedJpegFilename}`, { method: "GET", ifNoneMatch: etag ?? "" });
      expect(revalidated.status).toBe(304);
      expect(revalidated.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
      const list = await rest("/media", { method: "GET" });
      expect(list.status).toBe(200);
      const body = (await list.json()) as { docs: object[] };
      expect(body.docs.length).toBeGreaterThan(0);
      for (const doc of body.docs) expect(doc).not.toHaveProperty("uploadedBy");
      const staffView = await rest("/media", { method: "GET", token: tokens.sale });
      const staffDocs = ((await staffView.json()) as { docs: object[] }).docs;
      expect(staffDocs.some((doc) => "uploadedBy" in doc)).toBe(true);
    });

    it("ảnh mới trống alt: tự điền từ tên file gốc (BL-042); sửa ảnh cũ để trống alt bị chặn; PDF không cần alt", async () => {
      const noAlt = await rest("/media?locale=vi", {
        method: "POST",
        token: tokens.sale,
        file: { bytes: await bigJpeg(), name: "a.jpg", type: "image/jpeg" },
        data: {},
      });
      expect(noAlt.status).toBe(201);
      const created = ((await noAlt.json()) as { doc: { id: string; alt: string } }).doc;
      mediaIds.push(created.id);
      expect(created.alt).toBe("a");
      const clearAlt = await rest(`/media/${created.id}?locale=vi`, { method: "PATCH", token: tokens.sale, data: { alt: "" } });
      expect(clearAlt.status).toBe(400);
      const pdf = await rest("/media?locale=vi", {
        method: "POST",
        token: tokens.sale,
        file: { bytes: pdfBytes(), name: "tai-lieu.pdf", type: "application/pdf" },
        data: {},
      });
      expect(pdf.status).toBe(201);
      mediaIds.push(((await pdf.json()) as { doc: { id: string } }).doc.id);
    });

    it("file .jpg nhưng nội dung là HTML: 415 (kể cả khai Content-Type image/jpeg)", async () => {
      const html = new TextEncoder().encode("<html><body><script>alert(1)</script></body></html>");
      expect((await uploadMedia("sale", { bytes: html, name: "anh.jpg", type: "image/jpeg" })).status).toBe(415);
    });

    it("SVG (dù đặt tên .png): 415", async () => {
      const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      expect((await uploadMedia("sale", { bytes: svg, name: "x.svg", type: "image/svg+xml" })).status).toBe(415);
      expect((await uploadMedia("sale", { bytes: svg, name: "x.png", type: "image/png" })).status).toBe(415);
    });

    it("ảnh 11MB: 413; file > 20MB: 413", async () => {
      const eleven = Buffer.concat([await bigJpeg(), Buffer.alloc(11 * MB)]);
      expect((await uploadMedia("sale", { bytes: eleven, name: "to.jpg", type: "image/jpeg" })).status).toBe(413);
      const huge = Buffer.concat([pdfBytes(), Buffer.alloc(21 * MB)]);
      expect((await uploadMedia("sale", { bytes: huge, name: "to.pdf", type: "application/pdf" })).status).toBe(413);
    });

    it("video MP4 > 15MB: 413", async () => {
      const ftyp = Buffer.from("00000018667479706d703432000000006d70343269736f6d", "hex");
      const video = Buffer.concat([ftyp, Buffer.alloc(16 * MB)]);
      expect((await uploadMedia("sale", { bytes: video, name: "v.mp4", type: "video/mp4" })).status).toBe(413);
    });

    it("tạo bằng data.url (không file) bị chặn, không tải file ngoài", async () => {
      const response = await rest("/media?locale=vi", {
        method: "POST",
        token: tokens.sale,
        data: { alt: "x", filename: "x.jpg", url: "http://127.0.0.1:1/x.jpg" },
      });
      expect(response.status).toBe(400);
    });

    it("khách không upload được; sale không gán uploadedBy cho người khác", async () => {
      const guest = await rest("/media?locale=vi", {
        method: "POST",
        file: { bytes: await bigJpeg(), name: "a.jpg", type: "image/jpeg" },
        data: { alt: "x" },
      });
      expect([401, 403]).toContain(guest.status);
      const spoof = await uploadMedia("sale", { bytes: await bigJpeg(), name: "a.jpg", type: "image/jpeg" }, { uploadedBy: ids.other });
      expect(spoof.status).toBe(201);
      const { doc } = (await spoof.json()) as { doc: { uploadedBy: IdOrDoc } };
      expect(idOf(doc.uploadedBy)).toBe(ids.sale);
    });
  });

  describe("media: phân quyền sửa/xoá", () => {
    let saleMediaId: string;

    beforeAll(async () => {
      const response = await uploadMedia("sale", { bytes: await bigJpeg(), name: "own.jpg", type: "image/jpeg" });
      saleMediaId = ((await response.json()) as { doc: { id: string } }).doc.id;
    });

    it("sale sửa media của sale khác: 403; sửa của mình: 200 và không đổi được uploadedBy", async () => {
      const foreign = await rest(`/media/${saleMediaId}?locale=vi`, { method: "PATCH", token: tokens.other, data: { caption: "hack" } });
      expect(foreign.status).toBe(403);
      const own = await rest(`/media/${saleMediaId}?locale=vi`, {
        method: "PATCH",
        token: tokens.sale,
        data: { caption: "ok", uploadedBy: ids.other },
      });
      expect(own.status).toBe(200);
      const { doc } = (await own.json()) as { doc: { caption: string; uploadedBy: IdOrDoc } };
      expect(doc.caption).toBe("ok");
      expect(idOf(doc.uploadedBy)).toBe(ids.sale);
    });

    it("sửa metadata PDF không đòi alt; admin sửa mọi media", async () => {
      const pdf = await payload.create({
        collection: "media",
        overrideAccess: true,
        file: { data: pdfBytes(), mimetype: "application/pdf", name: "a.pdf", size: pdfBytes().length },
        data: {},
      });
      mediaIds.push(pdf.id);
      expect((await rest(`/media/${pdf.id}?locale=vi`, { method: "PATCH", token: tokens.admin, data: { caption: "tài liệu" } })).status).toBe(200);
      expect((await rest(`/media/${saleMediaId}?locale=vi`, { method: "PATCH", token: tokens.admin, data: { caption: "admin" } })).status).toBe(200);
    });

    it("sale không xoá được (403); admin xoá được và object S3 bị gỡ", async () => {
      expect((await rest(`/media/${saleMediaId}`, { method: "DELETE", token: tokens.sale })).status).toBe(403);
      const doc = await payload.findByID({ collection: "media", id: saleMediaId, overrideAccess: true });
      expect((await rest(`/media/${saleMediaId}`, { method: "DELETE", token: tokens.admin })).status).toBe(200);
      expect(await objectExists(publicBucket, doc.filename ?? "missing")).toBe(false);
    });
  });

  describe("staff.avatar", () => {
    it("nhận ảnh; từ chối PDF", async () => {
      const image = await payload.create({
        collection: "media",
        overrideAccess: true,
        file: { data: await bigJpeg(), mimetype: "image/jpeg", name: "a.jpg", size: 1 },
        data: { alt: "Ảnh đại diện" },
      });
      mediaIds.push(image.id);
      const pdf = await payload.create({
        collection: "media",
        overrideAccess: true,
        file: { data: pdfBytes(), mimetype: "application/pdf", name: "a.pdf", size: 1 },
        data: {},
      });
      mediaIds.push(pdf.id);
      expect((await rest(`/staff/${ids.sale}`, { method: "PATCH", token: tokens.sale, data: { avatar: image.id } })).status).toBe(200);
      expect((await rest(`/staff/${ids.sale}`, { method: "PATCH", token: tokens.sale, data: { avatar: pdf.id } })).status).toBe(400);
    });
  });

  describe("private-files", () => {
    let privateId: string;
    let privateName: string;

    it("admin KHÔNG tạo/sửa được qua REST (403): private-files chỉ chứa CV do endpoint nộp CV tạo", async () => {
      const file = { bytes: pdfBytes(), name: "file-noi-bo.pdf", type: "application/pdf" };
      const before = (await payload.count({ collection: "private-files", overrideAccess: true })).totalDocs;
      expect((await rest("/private-files", { method: "POST", token: tokens.admin, file, data: {} })).status).toBe(403);
      expect((await payload.count({ collection: "private-files", overrideAccess: true })).totalDocs).toBe(before);
    });

    it("Local API (như endpoint nộp CV) tạo CV PDF: tên ngẫu nhiên, nằm ở bucket private, KHÔNG có URL công khai", async () => {
      const bytes = pdfBytes();
      const doc = await payload.create({
        collection: "private-files",
        overrideAccess: true,
        file: { data: bytes, mimetype: "application/pdf", name: "CV Nguyen Van A.pdf", size: bytes.length },
        data: {},
      });
      privateId = doc.id;
      privateName = doc.filename as string;
      privateIds.push(doc.id);
      expect(doc.filename).toMatch(/^[0-9a-f-]{36}\.pdf$/);
      expect(doc.mimeType).toBe("application/pdf");
      expect(doc.url ?? "").toBe("");
      expect(await objectExists(privateBucket, privateName)).toBe(true);
      expect(await objectExists(publicBucket, privateName)).toBe(false);
    });

    it("admin không sửa được CV qua REST (403) nhưng vẫn đọc được", async () => {
      expect((await rest(`/private-files/${privateId}`, { method: "PATCH", token: tokens.admin, data: {} })).status).toBe(403);
    });

    it("không có route phục vụ file (kể cả admin): chỉ tải qua endpoint riêng ở task CV", async () => {
      const asAdmin = await rest(`/private-files/file/${privateName}`, { method: "GET", token: tokens.admin });
      expect(asAdmin.status).toBe(404);
      const asGuest = await rest(`/private-files/file/${privateName}`, { method: "GET" });
      expect(asGuest.status).not.toBe(200);
    });

    it("khách đọc danh sách / chi tiết: 401/403; sale: 403; admin: 200", async () => {
      expect([401, 403]).toContain((await rest("/private-files", { method: "GET" })).status);
      expect([401, 403]).toContain((await rest(`/private-files/${privateId}`, { method: "GET" })).status);
      expect((await rest("/private-files", { method: "GET", token: tokens.sale })).status).toBe(403);
      expect((await rest(`/private-files/${privateId}`, { method: "GET", token: tokens.sale })).status).toBe(403);
      expect((await rest("/private-files", { method: "GET", token: tokens.admin })).status).toBe(200);
    });

    it("sale không tạo/sửa/xoá được (403)", async () => {
      const file = { bytes: pdfBytes(), name: "cv.pdf", type: "application/pdf" };
      expect((await rest("/private-files", { method: "POST", token: tokens.sale, file, data: {} })).status).toBe(403);
      expect((await rest(`/private-files/${privateId}`, { method: "PATCH", token: tokens.sale, data: {} })).status).toBe(403);
      expect((await rest(`/private-files/${privateId}`, { method: "DELETE", token: tokens.sale })).status).toBe(403);
    });

    it("Local API (endpoint công khai nộp CV) vẫn bị kiểm: ảnh 415, quá 5MB 413, PDF đúng được qua", async () => {
      const create = (data: Buffer, name: string, mimetype: string) =>
        payload.create({ collection: "private-files", overrideAccess: true, file: { data, mimetype, name, size: data.length }, data: {} });
      await expect(create(await bigJpeg(), "cv.pdf", "application/pdf")).rejects.toMatchObject({ status: 415 });
      await expect(create(Buffer.concat([pdfBytes(), Buffer.alloc(6 * MB)]), "cv.pdf", "application/pdf")).rejects.toMatchObject({
        status: 413,
      });
      const ok = await create(pdfBytes(), "cv.pdf", "text/html");
      privateIds.push(ok.id);
      expect(ok.mimeType).toBe("application/pdf");
    });
  });
});
