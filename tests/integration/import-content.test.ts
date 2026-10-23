import type { EventEmitter } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import type { Payload } from "payload";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { runContentImport } from "../../seed/content/import";
import { CONTENT_DATASET } from "../../seed/content/import-plan";
import { ROLES } from "../../src/access/roles";
import { PROJECTS_TEST_MEDIA_DIR } from "../fixtures/projects/payload-config";

const baseUrl = process.env.DATABASE_URL_TEST;
const APPLY_ENV = { IMPORT_CONFIRM: CONTENT_DATASET };

const PROJECTS_MODULE = `
export const DEVELOPERS = { dev: { name: "Chủ đầu tư thử" } };
export const PROJECTS = [{
  slug: "du-an-nhap-thu", title: "Dự án nhập thử", category: "Căn hộ chung cư", developer: "dev",
  summary: "Tóm tắt", overview: "Tổng quan **đậm**.", salesPolicy: "- Chính sách", salesStatus: "selling", address: "Hà Nội",
  areaFromM2: 50, areaToM2: 90, productTypes: ["apartment"], featuredAmenities: [], scale: {}, products: [],
  amenities: [["Hồ bơi", "Mô tả"]], highlights: [], nearby: [], priceTable: [], faqs: [["Hỏi?", "Đáp."]],
}];
`;

describe.skipIf(!baseUrl)("integration: scripts/import-content (BL-072) — dry-run mặc định, apply có confirm, chỉ tạo mới (DB tạm)", () => {
  const dbName = `tami_import_${Date.now().toString(36)}`;
  let payload: Payload;
  let testUrl: string;
  let workDir: string;
  let dataDir: string;
  let imgDir: string;

  const options = (extra: { apply?: boolean; env?: Record<string, string> } = {}) => ({
    dataDir,
    newsDir: null,
    coversFile: join(dataDir, "news-covers.json"),
    imgDir,
    apply: extra.apply ?? false,
    env: extra.env ?? {},
  });
  const count = async (collection: "projects" | "media" | "developers") =>
    (await payload.find({ collection, depth: 0, overrideAccess: true, limit: 0, pagination: false, trash: true })).docs.length;

  async function withDatabase<T>(work: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await work(client);
    } finally {
      await client.end();
    }
  }

  async function writeImages(withSecond: boolean) {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#444" } }).png().toBuffer();
    await mkdir(join(imgDir, "du-an-nhap-thu"), { recursive: true });
    await writeFile(join(imgDir, "du-an-nhap-thu", "g01.png"), png);
    if (withSecond) await writeFile(join(imgDir, "du-an-nhap-thu", "g02.png"), png);
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
    await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `admin-${dbName}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
    });
    await payload.create({ collection: "categories", data: { name: "Căn hộ chung cư", scope: "project" } as never, locale: "vi", overrideAccess: true, depth: 0 });
    await payload.create({ collection: "provinces", data: { code: "01", name: "Thành phố Hà Nội", slug: "ha-noi" }, overrideAccess: true });

    workDir = await mkdtemp(join(tmpdir(), "tami-import-"));
    dataDir = join(workDir, "data");
    imgDir = join(workDir, "ảnh");
    await mkdir(dataDir);
    await writeFile(join(dataDir, "projects-data.mjs"), PROJECTS_MODULE);
    await writeFile(join(dataDir, "news-covers.json"), "{}");
    await mkdir(imgDir);
    const manifest = { "du-an-nhap-thu": { gallery: [{ file: "img/du-an-nhap-thu/g01.png", alt: "Ảnh một" }, { file: "img/du-an-nhap-thu/g02.png", alt: "Ảnh hai" }] } };
    await writeFile(join(imgDir, "manifest.json"), JSON.stringify(manifest));
  }, 120_000);

  afterAll(async () => {
    const pool = (payload?.db as unknown as { pool?: EventEmitter & { _clients?: EventEmitter[] } } | undefined)?.pool;
    pool?.on("error", () => undefined);
    for (const client of pool?._clients ?? []) client.on("error", () => undefined);
    await payload?.destroy();
    await rm(PROJECTS_TEST_MEDIA_DIR, { recursive: true, force: true });
    await rm(workDir, { recursive: true, force: true });
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    } finally {
      await connection.end();
    }
  }, 60_000);

  it("dry-run: thiếu ảnh → báo lỗi từng file; apply (đủ confirm) vẫn KHÔNG ghi gì khi dry-run còn lỗi", async () => {
    await writeImages(false);
    const dry = await runContentImport(payload, options());
    expect(dry.applied).toBe(false);
    expect(dry.lines.filter((line) => line.status === "error").map((line) => line.key)).toEqual(["img/du-an-nhap-thu/g02.png"]);

    const blocked = await runContentImport(payload, options({ apply: true, env: APPLY_ENV }));
    expect(blocked).toMatchObject({ applied: false, problems: 1 });
    expect([await count("projects"), await count("media"), await count("developers")]).toEqual([0, 0, 0]);
  });

  it("dry-run đủ ảnh: liệt kê 'sẽ tạo', KHÔNG ghi gì", async () => {
    await writeImages(true);
    const dry = await runContentImport(payload, options());
    expect(dry).toMatchObject({ applied: false, problems: 0 });
    expect(dry.lines.filter((line) => line.status === "create").map((line) => `${line.kind}:${line.key}`)).toEqual(["developer:Chủ đầu tư thử", "project:du-an-nhap-thu", "media:(tổng)"]);
    expect([await count("projects"), await count("media"), await count("developers")]).toEqual([0, 0, 0]);
  });

  it("apply thiếu hoặc sai IMPORT_CONFIRM → từ chối, không ghi gì", async () => {
    await expect(runContentImport(payload, options({ apply: true }))).rejects.toThrow("IMPORT_CONFIRM=2026-10-23");
    await expect(runContentImport(payload, options({ apply: true, env: { IMPORT_CONFIRM: "2026-10-24" } }))).rejects.toThrow("khác tên bộ dữ liệu");
    expect(await count("projects")).toBe(0);
  });

  it("apply + confirm đúng: tạo chủ đầu tư, dự án (đã xuất bản, gallery 2 ảnh), ảnh; alt/tên theo vi", async () => {
    const result = await runContentImport(payload, options({ apply: true, env: APPLY_ENV }));
    expect(result).toMatchObject({ applied: true, problems: 0 });
    expect([await count("projects"), await count("media"), await count("developers")]).toEqual([1, 2, 1]);
    const project = (await payload.find({ collection: "projects", where: { slug: { equals: "du-an-nhap-thu" } }, locale: "vi", depth: 0, overrideAccess: true, limit: 1 })).docs[0] as unknown as { title: string; status: string; gallery: unknown[]; amenities: Array<{ name: string }>; hasEnglish?: boolean };
    expect(project).toMatchObject({ title: "Dự án nhập thử", status: "published" });
    expect(project.gallery).toHaveLength(2);
    expect(project.amenities[0]?.name).toBe("Hồ bơi");
    expect(project.hasEnglish).toBeFalsy();
  });

  it("chạy lại (dry-run và apply): mọi bản ghi 'đã có, bỏ qua', không tạo thêm", async () => {
    const dry = await runContentImport(payload, options());
    expect(dry.lines.filter((line) => line.kind !== "media").every((line) => line.status === "exists")).toBe(true);
    const again = await runContentImport(payload, options({ apply: true, env: APPLY_ENV }));
    expect(again).toMatchObject({ applied: true, problems: 0 });
    expect([await count("projects"), await count("media"), await count("developers")]).toEqual([1, 2, 1]);
  });
});
