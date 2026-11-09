import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

/** BL-108/BL-109: chứng minh validate socialLinks chạy qua đường validate thật của Payload (updateGlobal). */
describe.skipIf(!baseUrl)("integration: site-settings socialLinks validate (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_sociallinks_${runId}`;
  let payload: Payload;
  let admin: { id: string | number; email: string };

  const save = (socialLinks: unknown[]) =>
    payload.updateGlobal({
      slug: "site-settings",
      // siteName bắt buộc: global mới tạo chưa có giá trị, thiếu thì test hợp lệ cũng bị chặn ở trường này.
      data: { siteName: "Tami Homes", socialLinks } as never,
      locale: "vi",
      user: { ...admin, collection: "staff" as const } as never,
      overrideAccess: false,
    });

  const errorOf = async (promise: Promise<unknown>) => {
    try {
      await promise;
    } catch (error) {
      return JSON.stringify((error as { data?: unknown }).data ?? (error as Error).message);
    }
    return "";
  };

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
    const { buildGlobalsTestConfig } = await import("../fixtures/globals/payload-config");
    payload = await getPayload({ config: buildGlobalsTestConfig(url.toString(), () => undefined) });
    admin = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `admin-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
    });
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

  it("Link trang trống -> chặn bằng thông báo tiếng Việt", async () => {
    expect(await errorOf(save([{ platform: "facebook", url: "" }]))).toContain("Vui lòng nhập Link trang");
  });

  it("2 dòng cùng nền tảng -> chặn tại dòng sau", async () => {
    const message = await errorOf(save([
      { platform: "instagram", url: "https://instagram.com/a" },
      { platform: "instagram", url: "https://instagram.com/b" },
    ]));
    expect(message).toContain("Nền tảng Instagram đã có ở dòng 1.");
  });

  it("link trùng sau chuẩn hoá (kể cả 'Khác') -> chặn", async () => {
    const message = await errorOf(save([
      { platform: "other", url: "https://www.instagram.com/tamihomes.test/" },
      { platform: "other", url: "https://instagram.com/tamihomes.test" },
    ]));
    expect(message).toContain("Link trang trùng với dòng 1.");
  });

  it("nhiều dòng 'Khác' khác link -> lưu được", async () => {
    const doc = await save([
      { platform: "other", url: "https://a.com/1" },
      { platform: "other", url: "https://a.com/2" },
    ]);
    expect(doc.socialLinks).toHaveLength(2);
  });
});
