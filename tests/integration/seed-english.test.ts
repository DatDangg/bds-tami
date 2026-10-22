import type { EventEmitter } from "node:events";
import { rm } from "node:fs/promises";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { applyCollection } from "../../seed/english/apply";
import { exportGroup } from "../../seed/english/export";
import { ROLES } from "../../src/access/roles";
import { PROJECTS_TEST_MEDIA_DIR } from "../fixtures/projects/payload-config";

const baseUrl = process.env.DATABASE_URL_TEST;

const paragraph = (...texts: string[]) => ({
  type: "paragraph",
  version: 1,
  direction: "ltr",
  format: "",
  indent: 0,
  children: texts.map((text) => ({ type: "text", version: 1, text })),
});
const lexical = (...paragraphs: string[][]) => ({
  root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: paragraphs.map((texts) => paragraph(...texts)) },
});

interface TextNode {
  children: Array<{ text: string }>;
}
interface ProjectDoc {
  slug: string;
  title: string;
  updatedAt: string;
  amenities: Array<{ name: string; description?: string }>;
  faqs: Array<{ question: string }>;
  overview: { root: { children: TextNode[] } };
  [key: string]: unknown;
}

const VI_TITLE = "Dự án Seed EN";
const ENGLISH = {
  title: "Seed EN Project",
  summary: "A project with hand-written English.",
  overview: ["First paragraph, ", "second part.", "Second paragraph."],
  "amenities.0.name": "Swimming pool",
  "amenities.0.description": "Infinity pool on the rooftop",
  "amenities.1.name": "Gym",
  "scale.handoverTime": "Q4 2027",
  "faqs.0.question": "When is handover?",
  "faqs.0.answer": "In the fourth quarter of 2027.",
};

describe.skipIf(!baseUrl)("integration: seed/english áp dữ liệu EN viết sẵn (DB tạm, collection projects thật)", () => {
  const dbName = `tami_seed_en_${Date.now().toString(36)}`;
  let payload: Payload;
  let testUrl: string;
  let projectId = "";

  const readProject = (locale: "vi" | "en") =>
    payload.findByID({ collection: "projects", id: projectId, locale, fallbackLocale: false, depth: 0, overrideAccess: true }) as unknown as Promise<ProjectDoc>;

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
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
    await withDatabase((client) => client.query(`CREATE EXTENSION IF NOT EXISTS postgis`));
    const { getPayload } = await import("payload");
    const { buildProjectsTestConfig } = await import("../fixtures/projects/payload-config");
    payload = await getPayload({ config: buildProjectsTestConfig(testUrl, () => undefined) });
    const admin = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `admin-${dbName}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
    });
    const category = await payload.create({ collection: "categories", data: { name: "Căn hộ", scope: "project" } as never, locale: "vi", overrideAccess: true, depth: 0 });
    const province = await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true });
    const created = await payload.create({
      collection: "projects",
      locale: "vi",
      overrideAccess: true,
      depth: 0,
      data: {
        title: VI_TITLE,
        author: admin.id,
        summary: "Tóm tắt dự án",
        overview: lexical(["Đoạn một, ", "phần hai."], ["Đoạn hai."]),
        category: category.id,
        province: province.id,
        salesStatus: "selling",
        scale: { handoverTime: "Quý 4/2027" },
        amenities: [{ name: "Hồ bơi", description: "Hồ bơi tràn bờ trên tầng thượng" }, { name: "Phòng gym" }],
        faqs: [{ question: "Khi nào bàn giao?", answer: "Quý 4 năm 2027." }],
      } as never,
    });
    projectId = created.id as string;
  }, 120_000);

  afterAll(async () => {
    const pool = (payload?.db as unknown as { pool?: EventEmitter & { _clients?: EventEmitter[] } } | undefined)?.pool;
    pool?.on("error", () => undefined);
    for (const client of pool?._clients ?? []) client.on("error", () => undefined);
    await payload?.destroy();
    await rm(PROJECTS_TEST_MEDIA_DIR, { recursive: true, force: true });
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    } finally {
      await connection.end();
    }
  }, 60_000);

  it("export: bản vi ở đúng định dạng dữ liệu (chuỗi, mảng ô chữ richText, chỉ số hàng)", async () => {
    const exported = await exportGroup(payload, "projects", false);
    expect(exported[VI_TITLE]).toMatchObject({
      title: VI_TITLE,
      overview: ["Đoạn một, ", "phần hai.", "Đoạn hai."],
      "amenities.0.name": "Hồ bơi",
      "amenities.1.name": "Phòng gym",
      "scale.handoverTime": "Quý 4/2027",
      "faqs.0.answer": "Quý 4 năm 2027.",
    });
  });

  it("áp dữ liệu: ghi locale en (mảng localized, richText), bật hasEnglish, slug en sinh từ tiêu đề EN, bản vi không đổi", async () => {
    const viContent = async () => {
      // hasEnglish, translation, updatedAt không localized (dùng chung hai ngôn ngữ) nên đổi theo; mọi trường còn lại của bản vi phải y nguyên.
      const doc = await readProject("vi");
      for (const key of ["hasEnglish", "translation", "updatedAt"]) delete doc[key];
      return JSON.stringify(doc);
    };
    const viBefore = await viContent();
    const queue = vi.spyOn(payload.jobs, "queue");
    const stats = await applyCollection(payload, "projects", { [VI_TITLE]: ENGLISH });
    expect(stats).toEqual({ applied: 1, unchanged: 0, missing: [], mismatched: [] });

    const en = await readProject("en");
    expect(en).toMatchObject({
      title: "Seed EN Project",
      slug: "seed-en-project",
      summary: "A project with hand-written English.",
      hasEnglish: true,
      scale: { handoverTime: "Q4 2027" },
      translation: { status: "done", enSource: "manual" },
    });
    expect(en.amenities.map((row) => row.name)).toEqual(["Swimming pool", "Gym"]);
    expect(en.amenities[0]?.description).toBe("Infinity pool on the rooftop");
    expect(en.faqs[0]).toMatchObject({ question: "When is handover?" });
    expect(en.overview.root.children.map((node) => node.children.map((child) => child.text))).toEqual([["First paragraph, ", "second part."], ["Second paragraph."]]);
    expect(await viContent()).toBe(viBefore);
    // Cờ translationJob của lần ghi seed: hook enqueue không xếp job dịch AI nào.
    expect(queue).not.toHaveBeenCalled();
  });

  it("chạy lại: không ghi gì (idempotent), slug en giữ nguyên", async () => {
    const before = await readProject("en");
    const stats = await applyCollection(payload, "projects", { [VI_TITLE]: ENGLISH });
    expect(stats).toEqual({ applied: 0, unchanged: 1, missing: [], mismatched: [] });
    const after = await readProject("en");
    expect(after.slug).toBe(before.slug);
    expect(after.updatedAt).toBe(before.updatedAt);
  });

  it("dữ liệu lệch bản vi (số ô chữ richText, khoá lạ) → bỏ cả bản ghi, không ghi nửa vời; khoá thiếu bản vi → missing", async () => {
    const stats = await applyCollection(payload, "projects", {
      [VI_TITLE]: { title: "Changed title", overview: ["Only one"] },
      "Dự án không tồn tại": { title: "Ghost" },
    });
    expect(stats.applied).toBe(0);
    expect(stats.missing).toEqual(["Dự án không tồn tại"]);
    expect(stats.mismatched).toHaveLength(1);
    expect(stats.mismatched[0]).toContain("số ô chữ lệch");
    expect((await readProject("en")).title).toBe("Seed EN Project");

    const unknownKey = await applyCollection(payload, "projects", { [VI_TITLE]: { "amenities.9.name": "X" } });
    expect(unknownKey.mismatched[0]).toContain("không có trường này");
  });

  it("thiếu trường EN bắt buộc → bỏ cả bản ghi TRƯỚC khi ghi (không để nội dung nửa vời), báo lỗi", async () => {
    const second = await payload.create({
      collection: "projects",
      locale: "vi",
      overrideAccess: true,
      depth: 0,
      data: {
        title: "Dự án thiếu EN",
        author: (await payload.find({ collection: "staff", depth: 0, overrideAccess: true, limit: 1 })).docs[0]!.id,
        summary: "Tóm tắt",
        overview: lexical(["Tổng quan"]),
        category: (await payload.find({ collection: "categories", depth: 0, overrideAccess: true, limit: 1 })).docs[0]!.id,
        province: (await payload.find({ collection: "provinces", depth: 0, overrideAccess: true, limit: 1 })).docs[0]!.id,
        salesStatus: "selling",
      } as never,
    });
    const stats = await applyCollection(payload, "projects", { "Dự án thiếu EN": { title: "Missing EN project" } });
    expect(stats.mismatched[0]).toContain("thiếu trường EN bắt buộc");
    const en = (await payload.findByID({ collection: "projects", id: second.id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
    expect(en.title ?? "").toBe("");
    expect(en.hasEnglish).toBeFalsy();
  });
});
