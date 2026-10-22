import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { applyCollection } from "../../seed/english/apply";

const baseUrl = process.env.DATABASE_URL_TEST;

const lexical = (...texts: string[]) => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: texts.map((text) => ({ type: "paragraph", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "text", version: 1, text }] })),
  },
});

const VI_TITLE = "Chính sách bảo mật seed EN";

/** Trang pháp lý (BR-08): chỉ cờ duyệt mới bật được `hasEnglish`; seed EN đi đúng đường đó và không xếp job dịch AI. */
describe.skipIf(!baseUrl)("integration: seed/english với trang pháp lý (DB tạm, collection pages thật)", () => {
  const dbName = `tami_seed_en_pages_${Date.now().toString(36)}`;
  let payload: Payload;
  let pageId = "";

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
    process.env.DATABASE_URL = url.toString();
    const { getPayload } = await import("payload");
    const { buildServicesPagesTestConfig } = await import("../fixtures/services-pages/payload-config");
    payload = await getPayload({ config: buildServicesPagesTestConfig(url.toString(), () => undefined, () => undefined) });
    const created = await payload.create({
      collection: "pages",
      locale: "vi",
      overrideAccess: true,
      depth: 0,
      data: { title: VI_TITLE, kind: "privacy", content: lexical("Đoạn một.", "Đoạn hai."), version: "1.0", effectiveDate: new Date().toISOString() } as never,
    });
    pageId = created.id as string;
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

  it("ghi EN: hasEnglish bật (đường duyệt), status done/manual, không xếp job dịch AI, bản vi không đổi", async () => {
    const queue = vi.spyOn(payload.jobs, "queue");
    const stats = await applyCollection(payload, "pages", { [VI_TITLE]: { title: "Privacy policy seed EN", content: ["Paragraph one.", "Paragraph two."] } });
    expect(stats).toEqual({ applied: 1, unchanged: 0, missing: [], mismatched: [] });
    expect(queue).not.toHaveBeenCalled();

    const en = (await payload.findByID({ collection: "pages", id: pageId, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
    expect(en).toMatchObject({ title: "Privacy policy seed EN", hasEnglish: true, translation: { status: "done", enSource: "manual" } });
    const viDoc = (await payload.findByID({ collection: "pages", id: pageId, locale: "vi", fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
    expect(viDoc.title).toBe(VI_TITLE);

    const again = await applyCollection(payload, "pages", { [VI_TITLE]: { title: "Privacy policy seed EN", content: ["Paragraph one.", "Paragraph two."] } });
    expect(again).toEqual({ applied: 0, unchanged: 1, missing: [], mismatched: [] });
  });
});
