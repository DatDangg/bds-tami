import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findPublicBySlug, findPublicList } from "../../src/lib/content/public-queries";

const baseUrl = process.env.DATABASE_URL_TEST;

interface NamedDoc {
  id: string;
  name?: string | null;
  slug?: string | null;
}

/**
 * Collection THẬT không có trường `status` (`categories`, `developers`): `publicWhere` chỉ lọc xoá mềm (+ hasEnglish ở en).
 * Lọc theo `status` ở đây sẽ làm truy vấn lỗi, nên test này chứng minh nhánh "không status" chạy đúng với DB thật.
 */
describe.skipIf(!baseUrl)("integration: truy vấn công khai cho collection không có status (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_pubq_nostatus_${runId}`;
  let payload: Payload;

  const createCategory = (name: string, locale: "vi" | "en" = "vi") =>
    payload.create({ collection: "categories", data: { name, scope: "news" }, locale, overrideAccess: true, depth: 0 });

  const createDeveloper = (name: string) =>
    payload.create({ collection: "developers", data: { name }, locale: "vi", overrideAccess: true, depth: 0 });

  const enableEnglish = (collection: "categories" | "developers", id: string, name: string) =>
    payload.update({ collection, id, data: { name, hasEnglish: true }, locale: "en", overrideAccess: true, depth: 0 });

  const softDelete = (collection: "categories" | "developers", id: string) =>
    payload.update({ collection, id, data: { deletedAt: new Date().toISOString() }, overrideAccess: true, depth: 0 });

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
    const { getPayload } = await import("payload");
    const { buildCategoriesTestConfig } = await import("../fixtures/categories/payload-config");
    payload = await getPayload({ config: buildCategoriesTestConfig(testUrl.toString()) });
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

  it("categories: vi thấy bản chưa xoá; xoá mềm biến mất; en cần hasEnglish; lọc theo scope qua `where`", async () => {
    const visible = await createCategory("Tin thị trường");
    const trashed = await createCategory("Tin đã xoá");
    const viOnly = await createCategory("Chỉ có tiếng Việt");
    await enableEnglish("categories", visible.id, "Market news");
    await enableEnglish("categories", trashed.id, "Trashed news");
    await softDelete("categories", trashed.id);

    const vi = await findPublicList<NamedDoc>(payload, "categories", "vi", { where: { scope: { equals: "news" } }, limit: 50 });
    const viNames = vi.docs.map((doc) => doc.name);
    expect(viNames).toEqual(expect.arrayContaining(["Tin thị trường", "Chỉ có tiếng Việt"]));
    expect(viNames).not.toContain("Tin đã xoá");

    const en = await findPublicList<NamedDoc>(payload, "categories", "en", { where: { scope: { equals: "news" } }, limit: 50 });
    expect(en.docs.map((doc) => doc.name)).toEqual(["Market news"]);

    expect(await findPublicBySlug(payload, "categories", "en", "market-news", { where: { scope: { equals: "news" } } })).not.toBeNull();
    expect(await findPublicBySlug(payload, "categories", "en", "market-news", { where: { scope: { equals: "project" } } })).toBeNull();
    expect(await findPublicBySlug(payload, "categories", "en", viOnly.slug!)).toBeNull();
    expect(await findPublicBySlug(payload, "categories", "en", "trashed-news")).toBeNull();
    expect(await findPublicBySlug(payload, "categories", "vi", trashed.slug!)).toBeNull();
  });

  it("developers: cùng quy tắc (không status)", async () => {
    const shown = await createDeveloper("Vinhomes");
    const hidden = await createDeveloper("Chủ đầu tư đã xoá");
    await softDelete("developers", hidden.id);

    const vi = await findPublicList<NamedDoc>(payload, "developers", "vi", { limit: 50 });
    expect(vi.docs.map((doc) => doc.id)).toContain(shown.id);
    expect(vi.docs.map((doc) => doc.id)).not.toContain(hidden.id);

    expect((await findPublicList(payload, "developers", "en", { limit: 50 })).totalDocs).toBe(0);
    await enableEnglish("developers", shown.id, "Vinhomes JSC");
    const en = await findPublicList<NamedDoc>(payload, "developers", "en", { limit: 50 });
    expect(en.docs.map((doc) => doc.name)).toEqual(["Vinhomes JSC"]);
  });
});
