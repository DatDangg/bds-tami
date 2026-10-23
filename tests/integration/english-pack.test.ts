import type { EventEmitter } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import type { Payload } from "payload";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { runEnglishPack } from "../../seed/english/pack";
import { ROLES } from "../../src/access/roles";
import { PROJECTS_TEST_MEDIA_DIR } from "../fixtures/projects/payload-config";

const baseUrl = process.env.DATABASE_URL_TEST;
const PACK = "test-pack";

const paragraph = (...texts: string[]) => ({
  type: "paragraph",
  version: 1,
  direction: "ltr",
  format: "",
  indent: 0,
  children: texts.map((text) => ({ type: "text", version: 1, text })),
});
const lexical = (...texts: string[]) => ({ root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: texts.map((text) => paragraph(text)) } });

interface ProjectDoc {
  slug: string;
  title?: string;
  summary?: string;
  updatedAt: string;
  hasEnglish?: boolean;
  [key: string]: unknown;
}

const ENGLISH = (title: string) => ({ title, summary: `${title} summary`, overview: [`${title} overview`] });

describe.skipIf(!baseUrl)("integration: gói EN (BL-072) — dry-run, apply có confirm, không ghi đè EN biên tập viên (DB tạm)", () => {
  const dbName = `tami_en_pack_${Date.now().toString(36)}`;
  let payload: Payload;
  let testUrl: string;
  let packDir: string;
  let authorId = "";
  let categoryId = "";
  let provinceId = "";
  const ids: Record<string, string> = {};

  const read = (collection: "projects", id: string, locale: "vi" | "en") =>
    payload.findByID({ collection, id, locale, fallbackLocale: false, depth: 0, overrideAccess: true }) as unknown as Promise<ProjectDoc>;

  const createProject = async (title: string, slug: string) =>
    (
      await payload.create({
        collection: "projects",
        locale: "vi",
        overrideAccess: true,
        depth: 0,
        data: { title, slug, author: authorId, summary: `${title} tóm tắt`, overview: lexical(`${title} tổng quan`), category: categoryId, province: provinceId, salesStatus: "selling" } as never,
      })
    ).id as string;

  const writePack = async (files: Record<string, unknown>) => {
    for (const [group, data] of Object.entries(files)) await writeFile(join(packDir, `${group}.json`), JSON.stringify(data));
  };
  const run = (extra: { apply?: boolean; overwrite?: boolean; env?: Record<string, string> } = {}) =>
    runEnglishPack(payload, { pack: PACK, apply: extra.apply ?? false, overwrite: extra.overwrite ?? false, env: extra.env ?? {}, packDir });
  const statusOf = (result: Awaited<ReturnType<typeof run>>, key: string) => result.lines.find((line) => line.key === key)?.status;

  async function withDatabase<T>(work: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await work(client);
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
    packDir = await mkdtemp(join(tmpdir(), "tami-en-pack-"));
    authorId = (
      await payload.create({
        collection: "staff",
        overrideAccess: true,
        data: { email: `admin-${dbName}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
      })
    ).id as string;
    categoryId = (await payload.create({ collection: "categories", data: { name: "Căn hộ", scope: "project" } as never, locale: "vi", overrideAccess: true, depth: 0 })).id as string;
    provinceId = (await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true })).id as string;
    ids.target = await createProject("Dự án trong gói", "du-an-trong-goi");
    ids.bystander = await createProject("Dự án ngoài gói", "du-an-ngoai-goi");
    ids.dupA = await createProject("Dự án trùng tên", "du-an-trung-a");
    ids.dupB = await createProject("Dự án trùng tên", "du-an-trung-b");
    ids.edited = await createProject("Dự án biên tập viên đã dịch", "du-an-bien-tap");
    await payload.update({ collection: "projects", id: ids.edited!, locale: "en", overrideAccess: true, depth: 0, data: { title: "Editor Title" } as never });
  }, 120_000);

  afterAll(async () => {
    const pool = (payload?.db as unknown as { pool?: EventEmitter & { _clients?: EventEmitter[] } } | undefined)?.pool;
    pool?.on("error", () => undefined);
    for (const client of pool?._clients ?? []) client.on("error", () => undefined);
    await payload?.destroy();
    await rm(PROJECTS_TEST_MEDIA_DIR, { recursive: true, force: true });
    await rm(packDir, { recursive: true, force: true });
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    } finally {
      await connection.end();
    }
  }, 60_000);

  it("dry-run (mặc định): in kế hoạch, KHÔNG ghi gì (cả khi không có confirm)", async () => {
    await writePack({ projects: { "Dự án trong gói": ENGLISH("Pack Project") } });
    const before = await read("projects", ids.target!, "en");
    const update = vi.spyOn(payload, "update");
    const result = await run();
    expect(update).not.toHaveBeenCalled();
    update.mockRestore();
    expect(statusOf(result, "Dự án trong gói")).toBe("write");
    expect(result).toMatchObject({ problems: 0, written: 0 });
    const after = await read("projects", ids.target!, "en");
    expect(after.title ?? "").toBe("");
    expect(after.updatedAt).toBe(before.updatedAt);
  });

  it("apply thiếu hoặc sai ENGLISH_PACK_CONFIRM → từ chối, không ghi gì", async () => {
    await writePack({ projects: { "Dự án trong gói": ENGLISH("Pack Project") } });
    await expect(run({ apply: true })).rejects.toThrow("ENGLISH_PACK_CONFIRM=test-pack");
    await expect(run({ apply: true, env: { ENGLISH_PACK_CONFIRM: "goi-khac" } })).rejects.toThrow("khác tên gói");
    expect((await read("projects", ids.target!, "en")).title ?? "").toBe("");
  });

  it("apply + confirm đúng: ghi ĐÚNG 1 bản ghi trong gói, bật hasEnglish, không đụng bản ngoài gói và bản vi", async () => {
    const viBefore = JSON.stringify(await read("projects", ids.target!, "vi"));
    const bystanderBefore = await read("projects", ids.bystander!, "en");
    const queue = vi.spyOn(payload.jobs, "queue");
    const result = await run({ apply: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(result).toMatchObject({ problems: 0, written: 1 });
    expect(result.lines).toHaveLength(1);

    const en = await read("projects", ids.target!, "en");
    expect(en).toMatchObject({ title: "Pack Project", summary: "Pack Project summary", hasEnglish: true, slug: "pack-project", translation: { enSource: "manual" } });
    expect(queue).not.toHaveBeenCalled();
    queue.mockRestore();
    const viAfter = JSON.parse(JSON.stringify(await read("projects", ids.target!, "vi"))) as ProjectDoc;
    const viBeforeDoc = JSON.parse(viBefore) as ProjectDoc;
    // hasEnglish/translation/updatedAt không localized: đổi theo; mọi trường vi còn lại phải y nguyên.
    for (const key of ["hasEnglish", "translation", "updatedAt"]) {
      delete viAfter[key];
      delete viBeforeDoc[key];
    }
    expect(viAfter).toEqual(viBeforeDoc);
    const bystanderAfter = await read("projects", ids.bystander!, "en");
    expect(bystanderAfter.title ?? "").toBe("");
    expect(bystanderAfter.updatedAt).toBe(bystanderBefore.updatedAt);
  });

  it("chạy lại: mọi dòng 'không đổi', không ghi gì (idempotent)", async () => {
    const before = await read("projects", ids.target!, "en");
    const update = vi.spyOn(payload, "update");
    const result = await run({ apply: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(update).not.toHaveBeenCalled();
    update.mockRestore();
    expect(statusOf(result, "Dự án trong gói")).toBe("unchanged");
    expect(result).toMatchObject({ problems: 0, written: 0 });
    expect((await read("projects", ids.target!, "en")).updatedAt).toBe(before.updatedAt);
  });

  it("khoá trùng 2 bản ghi → bỏ qua có lý do, KHÔNG ghi bản nào, exit-code problems > 0", async () => {
    await writePack({ projects: { "Dự án trùng tên": ENGLISH("Duplicate Project") } });
    const result = await run({ apply: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(statusOf(result, "Dự án trùng tên")).toBe("skip");
    expect(result.lines[0]?.reason).toContain("khoá trùng");
    expect(result).toMatchObject({ problems: 1, written: 0 });
    for (const key of ["dupA", "dupB"]) expect((await read("projects", ids[key]!, "en")).title ?? "").toBe("");
  });

  it("EN biên tập viên đã nhập khác gói → giữ nguyên cả bản ghi; 'overwrite' mới ghi", async () => {
    await writePack({ projects: { "Dự án biên tập viên đã dịch": ENGLISH("Pack Wording") } });
    const kept = await run({ apply: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(statusOf(kept, "Dự án biên tập viên đã dịch")).toBe("skip");
    expect(kept.lines[0]?.reason).toContain("EN đã có, khác gói");
    expect(kept).toMatchObject({ problems: 1, written: 0 });
    const afterKeep = await read("projects", ids.edited!, "en");
    expect(afterKeep.title).toBe("Editor Title");
    expect(afterKeep.summary ?? "").toBe("");

    const forced = await run({ apply: true, overwrite: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(forced).toMatchObject({ problems: 0, written: 1 });
    expect((await read("projects", ids.edited!, "en")).title).toBe("Pack Wording");
  });

  it("categories cùng tên ở nhiều scope → áp cho MỌI bản (mỗi bản một dòng, kiểm không-ghi-đè riêng); projects trùng tên vẫn bỏ qua", async () => {
    const make = async (scope: string) => (await payload.create({ collection: "categories", data: { name: "Danh mục đôi", scope } as never, locale: "vi", overrideAccess: true, depth: 0 })).id as string;
    const project = await make("project");
    const rental = await make("rental");
    await payload.update({ collection: "categories", id: rental, locale: "en", data: { name: "Editor Category" } as never, depth: 0, overrideAccess: true });
    const nameEn = async (id: string) => ((await payload.findByID({ collection: "categories", id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as { name?: string }).name ?? "";

    await writeFile(join(packDir, "projects.json"), "{}");
    await writePack({ media: {}, categories: { "Danh mục đôi": { name: "Twin Category" } } });
    const result = await run({ apply: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(result.lines.map((line) => `${line.key}:${line.status}`).sort()).toEqual(["Danh mục đôi [project]:write", "Danh mục đôi [rental]:skip"]);
    expect(await nameEn(project)).toBe("Twin Category");
    expect(await nameEn(rental)).toBe("Editor Category");

    await run({ apply: true, overwrite: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(await nameEn(rental)).toBe("Twin Category");
    await rm(join(packDir, "categories.json"));
  });

  it("thiếu bản vi → 'thiếu bản vi' (problem), gói hỏng / tên lạ → ném lỗi trước khi đụng DB", async () => {
    await writePack({ projects: { "Dự án không tồn tại": ENGLISH("Ghost") } });
    const missing = await run();
    expect(statusOf(missing, "Dự án không tồn tại")).toBe("missing");
    expect(missing.problems).toBe(1);

    await writeFile(join(packDir, "project.json"), "{}");
    await expect(run()).rejects.toThrow("tên nhóm lạ");
    await rm(join(packDir, "project.json"));
    await expect(runEnglishPack(payload, { pack: "../x", apply: false, overwrite: false, packDir })).rejects.toThrow("Tên gói không hợp lệ");
  });

  it("media: chỉ alt có trong gói, không ghi đè alt EN đang có khác gói", async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#888" } }).png().toBuffer();
    const upload = async (alt: string, name: string) =>
      (await payload.create({ collection: "media", data: { alt } as never, file: { data: png, mimetype: "image/png", name, size: png.byteLength }, locale: "vi", depth: 0, overrideAccess: true })).id as string;
    const inPack = await upload("Ảnh trong gói", "in-pack.png");
    const outside = await upload("Ảnh ngoài gói", "outside.png");
    const editedId = await upload("Ảnh biên tập", "edited.png");
    await payload.update({ collection: "media", id: editedId, locale: "en", data: { alt: "Editor alt" }, depth: 0, overrideAccess: true });
    const altEn = async (id: string) => ((await payload.findByID({ collection: "media", id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true })) as unknown as { alt?: string }).alt ?? "";

    await writeFile(join(packDir, "projects.json"), "{}");
    await writePack({ media: { "Ảnh trong gói": "Photo in pack", "Ảnh biên tập": "Pack alt" } });
    const update = vi.spyOn(payload, "update");
    const dry = await run();
    expect(update).not.toHaveBeenCalled();
    update.mockRestore();
    expect(statusOf(dry, "Ảnh trong gói")).toBe("write");
    expect(await altEn(inPack)).toBe("");

    const result = await run({ apply: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(statusOf(result, "Ảnh trong gói")).toBe("write");
    expect(statusOf(result, "Ảnh biên tập")).toBe("skip");
    expect(await altEn(inPack)).toBe("Photo in pack");
    expect(await altEn(outside)).toBe("");
    expect(await altEn(editedId)).toBe("Editor alt");

    const rerun = await run({ apply: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(statusOf(rerun, "Ảnh trong gói")).toBe("unchanged");
    await run({ apply: true, overwrite: true, env: { ENGLISH_PACK_CONFIRM: PACK } });
    expect(await altEn(editedId)).toBe("Pack alt");
  });
});
