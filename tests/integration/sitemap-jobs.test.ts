import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;
const SITE = "https://tami.example";
const DAY_MS = 24 * 60 * 60 * 1000;

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

describe.skipIf(!baseUrl)("integration: sitemap — tuyển dụng hết hạn (DB tạm)", () => {
  const dbName = `tami_sitemap_jobs_${Date.now().toString(36)}`;
  let payload: Payload;
  let sitemap: typeof import("../../src/lib/seo/sitemap-data");
  let categoryId = "";
  let authorId = "";

  const createJob = (data: Record<string, unknown>) =>
    payload.create({
      collection: "job-postings",
      data: { description: lexical("Mô tả"), requirements: lexical("Yêu cầu"), category: categoryId, employmentType: "full_time", author: authorId, status: "published", ...data } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });

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
    const { buildJobPostingsTestConfig } = await import("../fixtures/job-postings/payload-config");
    payload = await getPayload({ config: buildJobPostingsTestConfig(url.toString(), () => undefined) });
    sitemap = await import("../../src/lib/seo/sitemap-data");
    authorId = (
      await payload.create({
        collection: "staff",
        overrideAccess: true,
        data: { email: `admin-${dbName}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Admin", role: ROLES.admin, active: true },
      })
    ).id;
    categoryId = (await payload.create({ collection: "categories", data: { name: "Kinh doanh", scope: "job" } as never, locale: "vi", overrideAccess: true, depth: 0 })).id;
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

  it("loại tin quá hạn nộp, nháp và seo.noindex; còn hạn thì có", async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 30 * DAY_MS).toISOString();
    await createJob({ title: "Còn hạn", slug: "con-han", deadline: future });
    await createJob({ title: "Quá hạn", slug: "qua-han", deadline: new Date(now.getTime() - 3 * DAY_MS).toISOString() });
    await createJob({ title: "Nháp", slug: "nhap", status: "draft", deadline: future });
    await createJob({ title: "Noindex", slug: "noindex", seo: { noindex: true }, deadline: future });

    const urls = await sitemap.loadSectionUrls(payload, "job-postings", 1, SITE, now);
    expect(urls.map((url) => url.loc)).toEqual([`${SITE}/tuyen-dung/con-han`]);
  });

  it("INDEXABLE_WHERE (llms.txt): loại seo.noindex, giữ bản ghi chưa đặt seo", async () => {
    const { findPublicList } = await import("../../src/lib/content/public-queries");
    const { INDEXABLE_WHERE } = await import("../../src/lib/seo/llms-txt");
    const result = await findPublicList<{ slug?: string }>(payload, "job-postings", "vi", { where: INDEXABLE_WHERE, depth: 0, select: { slug: true } });
    const slugs = result.docs.map((doc) => doc.slug);
    expect(slugs).toContain("con-han");
    expect(slugs).not.toContain("noindex");
  });
});
