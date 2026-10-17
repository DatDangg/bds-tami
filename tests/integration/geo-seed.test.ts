import { spawnSync } from "node:child_process";
import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadAdministrativeUnits, seedGeo } from "../../seed/geo";
import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

/** Lỗi của Payload mang `status` (Forbidden 403, ValidationError 400). */
async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

describe.skipIf(!baseUrl)("integration: provinces + wards + seed địa giới (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_geo_${runId}`;
  const password = "Mat-khau-hop-le-123";
  // Tập con (3 tỉnh đầu) để test nhanh; toàn bộ 3.321 phường đã được kiểm ở test unit + lần seed thật.
  const all = loadAdministrativeUnits();
  const provinceCodes = new Set(all.provinces.slice(0, 3).map((p) => p.code));
  const units = {
    provinces: all.provinces.filter((p) => provinceCodes.has(p.code)),
    wards: all.wards.filter((w) => provinceCodes.has(w.provinceCode)),
  };
  let payload: Payload;
  let testUrl: string;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });
  const createStaff = (label: string, role: "admin" | "sale") =>
    payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });

  async function countRows(table: "provinces" | "wards" | "wards_legacy_names"): Promise<number> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      const { rows } = await client.query<{ n: string }>(`SELECT count(*) AS n FROM ${table}`);
      return Number(rows[0]!.n);
    } finally {
      await client.end();
    }
  }

  const countAll = async () => [await countRows("provinces"), await countRows("wards"), await countRows("wards_legacy_names")];

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
    const { buildGeoTestConfig } = await import("../fixtures/geo/payload-config");
    payload = await getPayload({ config: buildGeoTestConfig(testUrl) });
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
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

  it("seed 2 lần: lần 1 tạo hết, lần 2 không tạo/sửa gì và số bản ghi không đổi", async () => {
    const first = await seedGeo(payload, units);
    expect(first.provinces).toEqual({ created: 3, updated: 0, unchanged: 0 });
    expect(first.wards).toEqual({ created: units.wards.length, updated: 0, unchanged: 0 });
    const counts = await countAll();

    const second = await seedGeo(payload, units);
    expect(second.provinces).toEqual({ created: 0, updated: 0, unchanged: 3 });
    expect(second.wards).toEqual({ created: 0, updated: 0, unchanged: units.wards.length });
    expect(await countAll()).toEqual(counts);
    expect(counts[2]).toBe(units.wards.reduce((sum, w) => sum + w.legacyNames.length, 0));
  }, 180_000);

  it("seed upsert theo code: dữ liệu bị lệch thì seed đưa về đúng, không nhân bản", async () => {
    const sample = units.wards[0]!;
    const find = () => payload.find({ collection: "wards", where: { code: { equals: sample.code } }, depth: 0, overrideAccess: true });
    await payload.update({ collection: "wards", id: (await find()).docs[0]!.id, data: { name: "Tên sai", legacyNames: [] }, overrideAccess: true });
    const result = await seedGeo(payload, units);
    expect(result.wards).toMatchObject({ created: 0, updated: 1 });
    const fixed = await find();
    expect(fixed.totalDocs).toBe(1);
    expect(fixed.docs[0]).toMatchObject({ name: sample.name });
    expect(fixed.docs[0]!.legacyNames?.map((item) => item.name)).toEqual(sample.legacyNames);
  }, 60_000);

  it("khách (chưa đăng nhập) và sale chỉ đọc; admin ghi được", async () => {
    const anonymous = await payload.find({ collection: "provinces", overrideAccess: false, limit: 5 });
    expect(anonymous.totalDocs).toBe(3);
    const anonymousWards = await payload.find({ collection: "wards", overrideAccess: false, limit: 1 });
    expect(anonymousWards.totalDocs).toBe(units.wards.length);
    const province = anonymous.docs[0]!;
    const newProvince = { code: "99", name: "X", slug: "x" };

    const asSale = { user: asUser(sale), overrideAccess: false } as const;
    expect((await payload.find({ collection: "wards", limit: 1, ...asSale })).totalDocs).toBe(units.wards.length);
    expect(await statusOf(payload.update({ collection: "provinces", id: province.id, data: { shortName: "Sale sửa" }, ...asSale }))).toBe(403);
    expect(await statusOf(payload.create({ collection: "provinces", data: newProvince, ...asSale }))).toBe(403);
    const wardId = (await payload.find({ collection: "wards", limit: 1, depth: 0, overrideAccess: true })).docs[0]!.id;
    expect(await statusOf(payload.delete({ collection: "wards", id: wardId, ...asSale }))).toBe(403);
    expect(await statusOf(payload.create({ collection: "provinces", data: newProvince, overrideAccess: false }))).toBe(403);

    const asAdmin = { user: asUser(admin), overrideAccess: false } as const;
    const updated = await payload.update({ collection: "provinces", id: province.id, data: { shortName: "Admin sửa" }, ...asAdmin });
    expect(updated.shortName).toBe("Admin sửa");
    await payload.update({ collection: "provinces", id: province.id, data: { shortName: province.shortName }, ...asAdmin });
  }, 60_000);

  it("ràng buộc UNIQUE: mã phường, slug tỉnh, và slug phường trong cùng tỉnh", async () => {
    const provinceDocs = (await payload.find({ collection: "provinces", overrideAccess: true, sort: "sortOrder", limit: 2 })).docs;
    const [first, second] = [provinceDocs[0]!, provinceDocs[1]!];
    const ward = (await payload.find({ collection: "wards", where: { province: { equals: first.id } }, depth: 0, overrideAccess: true, limit: 1 })).docs[0]!;
    const base = { name: "Phường thử", type: "phuong" as const };
    const createWard = (data: { province: string; code: string; slug: string }) =>
      payload.create({ collection: "wards", data: { ...base, ...data }, overrideAccess: true });

    expect(await statusOf(createWard({ province: first.id, code: ward.code, slug: "khac" }))).toBeDefined();
    expect(await statusOf(createWard({ province: first.id, code: "T1", slug: ward.slug }))).toBeDefined();
    // Cùng slug nhưng khác tỉnh thì hợp lệ.
    expect((await createWard({ province: second.id, code: "T2", slug: ward.slug })).slug).toBe(ward.slug);
    const duplicateSlug = payload.create({ collection: "provinces", data: { code: "T3", name: "Trùng slug", slug: first.slug }, overrideAccess: true });
    expect(await statusOf(duplicateSlug)).toBeDefined();
  }, 60_000);

  it("không xoá được tỉnh còn phường: lỗi 409 có thông báo rõ", async () => {
    const province = (await payload.find({ collection: "provinces", overrideAccess: true, limit: 1 })).docs[0]!;
    const error = await payload.delete({ collection: "provinces", id: province.id, overrideAccess: true }).catch((e: unknown) => e as { status?: number; message?: string });
    expect(error).toMatchObject({ status: 409, message: expect.stringMatching(/đang có \d+ phường\/xã/) });
    expect((await payload.count({ collection: "provinces", overrideAccess: true })).totalDocs).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it("pnpm seed --sample với APP_ENV=production → thoát lỗi, không đụng DB", () => {
    const result = spawnSync(process.execPath, ["scripts/seed.mjs", "--sample"], {
      env: { ...process.env, APP_ENV: "production", DATABASE_URL: testUrl },
      encoding: "utf8",
      timeout: 90_000,
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toMatch(/Không seed dữ liệu mẫu \(--sample\) ở production/);
  }, 120_000);
});
