import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

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

// BL-082: Sale thấy tên người tạo mà không đọc được hồ sơ staff khác; khách/API công khai không thấy tên/email staff.
describe.skipIf(!baseUrl)("integration: authorName (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_author_name_${runId}`;
  const password = "Mat-khau-hop-le-123";
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let otherSale: Awaited<ReturnType<typeof createStaff>>;
  let categoryId = "";
  let jobBySale = "";
  let jobByOther = "";

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale", fullName?: string) {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName, role, active: true } as never,
    });
  }

  const createJob = async (title: string, author: { id: string }) =>
    (
      await payload.create({
        collection: "job-postings",
        data: {
          title,
          description: lexical("Mô tả"),
          requirements: lexical("Yêu cầu"),
          category: categoryId,
          employmentType: "full_time",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: "published",
          author: author.id,
        } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      })
    ).id;

  const bearer = async (email: string) => {
    const { token } = await payload.login({ collection: "staff", data: { email, password } });
    return { Authorization: `JWT ${token}` };
  };
  const rest = (path: string, headers: Record<string, string> = {}) =>
    handleEndpoints({ config: payload.config, request: new Request(`http://localhost/api${path}`, { headers }) });

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
    admin = await createStaff("admin", ROLES.admin, "Quản Trị");
    sale = await createStaff("sale", ROLES.sale, "Sale Một");
    otherSale = await createStaff("other", ROLES.sale, "Sale Hai");
    categoryId = (await payload.create({ collection: "categories", data: { name: "Kinh doanh", scope: "job" } as never, locale: "vi", overrideAccess: true, depth: 0 })).id;
    jobBySale = await createJob("Tin của sale", sale);
    jobByOther = await createJob("Tin của người khác", otherSale);
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

  it("Sale đọc danh sách (overrideAccess false): tin của người khác có authorName", async () => {
    const result = await payload.find({ collection: "job-postings", user: asUser(sale), overrideAccess: false, depth: 1, locale: "vi", limit: 10 });
    const nameById = Object.fromEntries(result.docs.map((doc) => [doc.id, (doc as { authorName?: string | null }).authorName]));
    expect(nameById[jobBySale]).toBe("Sale Một");
    expect(nameById[jobByOther]).toBe("Sale Hai");
  });

  it("Sale vẫn không đọc được hồ sơ staff khác (Local API + REST) và hồ sơ tin không lộ email người tạo", async () => {
    await expect(payload.findByID({ collection: "staff", id: otherSale.id, user: asUser(sale), overrideAccess: false })).rejects.toMatchObject({ status: expect.any(Number) });
    const headers = await bearer(sale.email);
    expect([403, 404]).toContain((await rest(`/staff/${otherSale.id}`, headers)).status);
    const doc = (await (await rest(`/job-postings/${jobByOther}?depth=1`, headers)).json()) as Record<string, unknown>;
    expect(doc.authorName).toBe("Sale Hai");
    expect(JSON.stringify(doc)).not.toContain(otherSale.email);
  });

  it("Admin vẫn thấy authorName, author populate nguyên hồ sơ", async () => {
    const doc = await payload.findByID({ collection: "job-postings", id: jobByOther, user: asUser(admin), overrideAccess: false, depth: 1, locale: "vi" });
    expect((doc as { authorName?: string }).authorName).toBe("Sale Hai");
    expect(doc.author).toMatchObject({ id: otherSale.id });
  });

  it("Khách: REST không có authorName/email staff; Local API công khai (không user, overrideAccess mặc định) cũng không", async () => {
    const response = await rest(`/job-postings/${jobByOther}?depth=1`);
    expect(response.status).toBe(200);
    const text = JSON.stringify(await response.json());
    expect(text).not.toContain("authorName");
    expect(text).not.toContain("Sale Hai");
    expect(text).not.toContain(otherSale.email);

    const list = JSON.stringify(await (await rest("/job-postings?depth=1")).json());
    expect(list).not.toContain("authorName");
    expect(list).not.toContain("@example.test");

    const local = await payload.findByID({ collection: "job-postings", id: jobByOther, depth: 1, locale: "vi" });
    expect((local as { authorName?: unknown }).authorName ?? null).toBeNull();
  });

  it("GraphQL: cấu hình thật tắt hẳn GraphQL (không có bề mặt đọc authorName ngoài REST/Local API)", async () => {
    const { default: realConfig } = await import("../../src/payload.config");
    expect((await realConfig).graphQL?.disable).toBe(true);
  });

  it("staff bị khoá (active: false) không nhận authorName dù Local API overrideAccess", async () => {
    const locked = await payload.create({ collection: "staff", overrideAccess: true, data: { email: `locked-${runId}@example.test`, password, fullName: "Bị khoá", role: ROLES.sale, active: false } as never });
    const doc = await payload.findByID({ collection: "job-postings", id: jobByOther, user: asUser(locked), overrideAccess: true, depth: 0, locale: "vi" });
    expect((doc as { authorName?: unknown }).authorName ?? null).toBeNull();
  });

  it("danh sách nhiều dòng: mỗi người tạo khác nhau chỉ tra staff 1 lần (afterRead chạy song song)", async () => {
    await Promise.all([createJob("Tin sale 2", sale), createJob("Tin sale 3", sale), createJob("Tin other 2", otherSale)]);
    const spy = vi.spyOn(payload, "findByID");
    try {
      const result = await payload.find({ collection: "job-postings", user: asUser(admin), overrideAccess: false, depth: 0, locale: "vi", limit: 50 });
      expect(result.docs.length).toBeGreaterThanOrEqual(5);
      const staffLookups = spy.mock.calls.filter(([args]) => args.collection === "staff");
      expect(staffLookups).toHaveLength(2);
    } finally {
      spy.mockRestore();
    }
  });

  it("authorName chỉ đọc: giá trị gửi lên bị bỏ qua", async () => {
    const updated = await payload.update({
      collection: "job-postings",
      id: jobBySale,
      data: { authorName: "Giả mạo" } as never,
      user: asUser(admin),
      overrideAccess: false,
      depth: 0,
      locale: "vi",
    });
    expect((updated as { authorName?: string }).authorName).toBe("Sale Một");
  });
});
