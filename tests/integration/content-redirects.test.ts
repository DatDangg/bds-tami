import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

type Locale = "vi" | "en";

const lexical = (text: string) => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: [{ type: "paragraph", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "text", version: 1, text }] }],
  },
});

describe.skipIf(!baseUrl)("integration: redirect khi đổi slug (BR-05, DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_redirects_${runId}`;
  let payload: Payload;
  let testUrl: string;
  let mediaId = "";
  let categoryId = "";
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let findRedirectTarget: typeof import("../../src/lib/content/find-redirect").findRedirectTarget;

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: `Test ${label}`, role, active: true },
    });
  }

  const createNews = (title: string, status: "draft" | "published" = "published") =>
    payload.create({
      collection: "news",
      data: { title, excerpt: "Tóm tắt", content: lexical("Nội dung"), category: categoryId, status, cover: mediaId, author: sale.id } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });

  const setSlug = (id: string, slug: string, locale: Locale = "vi", extra: Record<string, unknown> = {}) =>
    payload.update({ collection: "news", id, data: { slug, ...extra } as never, locale, overrideAccess: true, depth: 0 });

  /** Mọi redirect dạng `from -> to`, sắp xếp để so sánh ổn định. */
  async function redirects(): Promise<string[]> {
    const { docs } = await payload.find({ collection: "redirects", pagination: false, overrideAccess: true, depth: 0 });
    return docs.map((doc) => `${doc.from} -> ${doc.to} (${doc.type})`).sort();
  }

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  async function clearRedirects() {
    await payload.delete({ collection: "redirects", where: { id: { exists: true } }, overrideAccess: true });
  }

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const url = new URL(baseUrl!);
    url.pathname = `/${dbName}`;
    testUrl = url.toString();
    process.env.DATABASE_URL = testUrl;
    const { getPayload } = await import("payload");
    const { buildNewsTestConfig } = await import("../fixtures/news/payload-config");
    payload = await getPayload({ config: buildNewsTestConfig(testUrl, () => undefined) });
    ({ findRedirectTarget } = await import("../../src/lib/content/find-redirect"));
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    categoryId = (
      await payload.create({ collection: "categories", data: { name: "Thị trường", scope: "news" } as never, locale: "vi", overrideAccess: true, depth: 0 })
    ).id;
    const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" DEFAULT VALUES RETURNING id`));
    mediaId = inserted.rows[0].id as string;
  }, 120_000);

  afterAll(async () => {
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

  it("đổi slug VI của bài đã xuất bản → redirect /tin-tuc/cu → /tin-tuc/moi (301)", async () => {
    await clearRedirects();
    const doc = await createNews("Bài đổi slug vi");
    expect(doc.slug).toBe("bai-doi-slug-vi");
    await setSlug(doc.id, "bai-moi-vi");
    expect(await redirects()).toEqual(["/tin-tuc/bai-doi-slug-vi -> /tin-tuc/bai-moi-vi (301)"]);
    expect(await findRedirectTarget(payload, "/tin-tuc/bai-doi-slug-vi")).toBe("/tin-tuc/bai-moi-vi");
    expect(await findRedirectTarget(payload, "/tin-tuc/bai-doi-slug-vi/")).toBe("/tin-tuc/bai-moi-vi");
    expect(await findRedirectTarget(payload, "/tin-tuc/khong-co")).toBeNull();
    expect(await findRedirectTarget(payload, "/tin-tuc")).toBeNull();
  });

  it("đổi slug EN → /en/news/old → /en/news/new; slug VI không bị ảnh hưởng", async () => {
    await clearRedirects();
    const doc = await createNews("Bài song ngữ");
    await payload.update({
      collection: "news",
      id: doc.id,
      data: { title: "Bilingual post", excerpt: "S", content: lexical("en"), hasEnglish: true } as never,
      locale: "en",
      overrideAccess: true,
    });
    expect(await redirects()).toEqual([]);
    await setSlug(doc.id, "new-bilingual-post", "en");
    expect(await redirects()).toEqual(["/en/news/bilingual-post -> /en/news/new-bilingual-post (301)"]);
    expect(await findRedirectTarget(payload, "/en/news/bilingual-post")).toBe("/en/news/new-bilingual-post");
  });

  it("bài nháp đổi slug không tạo redirect; xuất bản xong mới đổi thì có", async () => {
    await clearRedirects();
    const draft = await createNews("Bản nháp đổi slug", "draft");
    await setSlug(draft.id, "ban-nhap-moi");
    expect(await redirects()).toEqual([]);
    await setSlug(draft.id, "ban-nhap-moi", "vi", { status: "published" });
    expect(await redirects()).toEqual([]);
    await setSlug(draft.id, "ban-nhap-cuoi");
    expect(await redirects()).toEqual(["/tin-tuc/ban-nhap-moi -> /tin-tuc/ban-nhap-cuoi (301)"]);
  });

  it("đổi slug 2 lần (A→B→C) không có chuỗi: A→C và B→C", async () => {
    await clearRedirects();
    const doc = await createNews("Chuỗi a");
    await setSlug(doc.id, "chuoi-b");
    await setSlug(doc.id, "chuoi-c");
    expect(await redirects()).toEqual(["/tin-tuc/chuoi-a -> /tin-tuc/chuoi-c (301)", "/tin-tuc/chuoi-b -> /tin-tuc/chuoi-c (301)"]);
    const all = (await payload.find({ collection: "redirects", pagination: false, overrideAccess: true, depth: 0 })).docs;
    const sources = new Set(all.map((redirect) => redirect.from));
    expect(all.some((redirect) => sources.has(redirect.to))).toBe(false);
  });

  it("đổi slug quay lại slug cũ không tạo vòng: redirect tới slug đang dùng bị xoá", async () => {
    await clearRedirects();
    const doc = await createNews("Vòng a");
    await setSlug(doc.id, "vong-b");
    await setSlug(doc.id, "vong-c");
    await setSlug(doc.id, "vong-a");
    expect(await redirects()).toEqual(["/tin-tuc/vong-b -> /tin-tuc/vong-a (301)", "/tin-tuc/vong-c -> /tin-tuc/vong-a (301)"]);
  });

  it("slug cũ được bài khác dùng lại: redirect cũ bị xoá để không che bài mới", async () => {
    await clearRedirects();
    const first = await createNews("Dùng lại x");
    await setSlug(first.id, "dung-lai-y");
    expect(await redirects()).toEqual(["/tin-tuc/dung-lai-x -> /tin-tuc/dung-lai-y (301)"]);
    const second = await createNews("Dùng lại x");
    expect(second.slug).toBe("dung-lai-x");
    expect(await redirects()).toEqual([]);
  });

  it("sửa nội dung khác (không đổi slug) không tạo redirect", async () => {
    await clearRedirects();
    const doc = await createNews("Sửa nội dung thôi");
    await payload.update({ collection: "news", id: doc.id, data: { excerpt: "Đã sửa" } as never, locale: "vi", overrideAccess: true });
    expect(await redirects()).toEqual([]);
  });

  it("chỉ admin xem/sửa redirects: sale và khách bị chặn", async () => {
    await clearRedirects();
    const doc = await createNews("Quyền redirect");
    await setSlug(doc.id, "quyen-redirect-moi");
    const as = (user: typeof admin | typeof sale | undefined) => ({
      collection: "redirects" as const,
      overrideAccess: false,
      ...(user ? { user: { ...user, collection: "staff" as const } } : {}),
    });
    expect((await payload.find(as(admin))).totalDocs).toBe(1);
    for (const actor of [sale, undefined]) {
      await expect(payload.find(as(actor))).rejects.toMatchObject({ status: 403 });
      await expect(payload.create({ ...as(actor), data: { from: "/tin-tuc/a", to: "/tin-tuc/b", type: "301" } })).rejects.toMatchObject({ status: 403 });
    }
  });

  it("findRedirectTarget bỏ qua đích độc hại ghi thẳng vào DB (qua mặt validator)", async () => {
    const targets = ["/\\evil.example", "/\\\\evil.example", "/%5Cevil.example", "//evil.example", "https://evil.example"];
    await withDatabase(async (client) => {
      for (const [index, target] of targets.entries()) {
        await client.query(`INSERT INTO "redirects" ("from", "to", "type") VALUES ($1, $2, '301')`, [`/tin-tuc/bi-xau-${index}`, target]);
      }
    });
    for (const index of targets.keys()) expect(await findRedirectTarget(payload, `/tin-tuc/bi-xau-${index}`)).toBeNull();
  });

  it("hai lần đổi slug đồng thời không làm hỏng lần lưu nào (khoá ghi redirect)", async () => {
    const a = await createNews("Song song A");
    const b = await createNews("Song song B");
    const results = await Promise.allSettled([setSlug(a.id, "song-song-a2"), setSlug(b.id, "song-song-b2")]);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    const now = await redirects();
    expect(now).toEqual(expect.arrayContaining([expect.stringContaining("-> /tin-tuc/song-song-a2"), expect.stringContaining("-> /tin-tuc/song-song-b2")]));
  });

  it("from/to phải là đường dẫn nội bộ, đích khác nguồn", async () => {
    const create = (from: string, to: string) => payload.create({ collection: "redirects", data: { from, to, type: "301" }, overrideAccess: true });
    await expect(create("/tin-tuc/a", "https://evil.example")).rejects.toMatchObject({ status: 400 });
    await expect(create("/tin-tuc/a", "//evil.example")).rejects.toMatchObject({ status: 400 });
    for (const bad of ["/\\evil.example", "/\\\\evil.example", "/%5Cevil.example", "/%2Fevil.example", "\\\\evil.example"]) {
      await expect(create("/tin-tuc/a", bad)).rejects.toMatchObject({ status: 400 });
      await expect(create(bad, "/tin-tuc/b")).rejects.toMatchObject({ status: 400 });
    }
    await expect(create("tin-tuc/a", "/tin-tuc/b")).rejects.toMatchObject({ status: 400 });
    await expect(create("/tin-tuc/a", "/tin-tuc/a")).rejects.toMatchObject({ status: 400 });
    expect((await create("/tin-tuc/ok-a", "/tin-tuc/ok-b")).type).toBe("301");
  });
});
