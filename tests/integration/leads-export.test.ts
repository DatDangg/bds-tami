import type { EventEmitter } from "node:events";
import { strFromU8, unzipSync } from "fflate";
import pg from "pg";
import { createLocalReq, handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import { handleLeadsExport } from "../../src/endpoints/admin/leads-export";
import type { Lead } from "../../src/payload-types";

const baseUrl = process.env.DATABASE_URL_TEST;
const PASSWORD = "Mat-khau-hop-le-123";
const SHEET = "xl/worksheets/sheet1.xml";

/** DB tạm (migration thật): GET /api/admin/leads/export. */
describe.skipIf(!baseUrl)("integration: xuất lead ra Excel (GET /api/admin/leads/export)", () => {
  const dbName = `tami_export_${Date.now().toString(36)}`;
  const runId = Date.now().toString(36);
  let payload: Payload;
  let secondAdmin: Awaited<ReturnType<typeof createStaff>>;
  let saleA: Awaited<ReturnType<typeof createStaff>>;
  let tokens: { admin: string; secondAdmin: string; saleA: string };
  let leads: Lead[];

  async function createStaff(label: string, role: (typeof ROLES)[keyof typeof ROLES], active = true) {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password: PASSWORD, fullName: `Nhân viên ${label}`, role, active },
    });
  }
  const login = async (label: string) =>
    (await payload.login({ collection: "staff", data: { email: `${label}-${runId}@example.test`, password: PASSWORD } })).token!;

  let phoneSeed = 0;
  async function createLead(data: Record<string, unknown> = {}) {
    phoneSeed += 1;
    return payload.create({
      collection: "leads",
      overrideAccess: true,
      data: {
        source: "contact",
        fullName: `Khách ${phoneSeed}`,
        phone: `09666${String(phoneSeed).padStart(5, "0")}`,
        locale: "vi",
        consentAt: new Date().toISOString(),
        consentVersion: "2026-10-test",
        ...data,
      } as never,
    }) as Promise<Lead>;
  }

  const exportLeads = (query = "", token?: string) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api/admin/leads/export${query}`, {
        method: "GET",
        headers: token ? { Authorization: `JWT ${token}` } : {},
      }),
    });

  /** Đọc lại sheet1 thành mảng dòng (mỗi dòng: mảng text ô). */
  async function readRows(response: Response): Promise<string[][]> {
    const sheet = strFromU8(unzipSync(new Uint8Array(await response.arrayBuffer()))[SHEET]!);
    return [...sheet.matchAll(/<row>([\s\S]*?)<\/row>/g)].map(([, cells]) =>
      [...cells!.matchAll(/<c[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)].map(([, inner]) =>
        (inner ?? "").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
      ),
    );
  }
  const exportAudits = async () =>
    (await payload.find({ collection: "audit-logs", where: { action: { equals: "lead.export" } }, overrideAccess: true, depth: 0, pagination: false, sort: "createdAt" })).docs;

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
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    await createStaff("admin", ROLES.admin);
    secondAdmin = await createStaff("admin2", ROLES.admin);
    saleA = await createStaff("salea", ROLES.sale);
    tokens = { admin: await login("admin"), secondAdmin: await login("admin2"), saleA: await login("salea") };
    leads = [
      await createLead({ source: "rental", fullName: "=HYPERLINK(\"http://evil.test\")", message: "+84 gọi lại\nđây" }),
      await createLead({ source: "project", assignedTo: saleA.id, status: "contacted" }),
      await createLead({ source: "project", assignedTo: saleA.id, email: "khach@example.test" }),
      await createLead({ source: "contact", fullName: "@SUM(1+1)" }),
    ];
  }, 180_000);

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

  it("khách 401, sale 403: không file, không audit, không tốn lượt rate limit", async () => {
    const before = (await exportAudits()).length;
    expect((await exportLeads("")).status).toBe(401);
    expect((await exportLeads("", tokens.saleA)).status).toBe(403);
    expect((await exportLeads("?status=bad", tokens.saleA)).status).toBe(403);
    expect((await exportAudits()).length).toBe(before);
  });

  it("admin xuất không lọc: file .xlsx đọc lại đủ dòng, header tải về an toàn, no-store, có đúng 1 audit không chứa PII", async () => {
    const response = await exportLeads("", tokens.secondAdmin);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(response.headers.get("Content-Disposition")).toMatch(/^attachment; filename="tami-leads-\d{12}\.xlsx"/);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const rows = await readRows(response);
    expect(rows).toHaveLength(1 + leads.length);
    expect(rows[0]).toContain("Số điện thoại");
    const codes = rows.slice(1).map((row) => row[0]);
    expect(codes.sort()).toEqual(leads.map((lead) => lead.code).sort());

    const audits = (await exportAudits()).filter((audit) => audit.actor === secondAdmin.id);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({ action: "lead.export", collection: "leads", meta: { filters: {}, rowCount: leads.length } });
    const auditText = JSON.stringify(audits[0]);
    for (const lead of leads) {
      expect(auditText).not.toContain(lead.phone);
      expect(auditText).not.toContain(lead.fullName);
    }
  });

  it("escape công thức: họ tên bắt đầu = hoặc @ và lời nhắn bắt đầu + dùng style quotePrefix (nội dung giữ nguyên, không nối dấu nháy)", async () => {
    const rentalResponse = await exportLeads("?source=rental", tokens.admin);
    const rawSheet = strFromU8(unzipSync(new Uint8Array(await rentalResponse.clone().arrayBuffer()))[SHEET]!);
    const rows = await readRows(rentalResponse);
    expect(rows).toHaveLength(2);
    expect(rows[1]![1]).toBe(`=HYPERLINK("http://evil.test")`);
    expect(rows[1]![4]).toBe("+84 gọi lại\nđây");
    expect(rawSheet.match(/<c s="2" t="inlineStr">/g)).toHaveLength(2);
    const contact = await readRows(await exportLeads("?source=contact", tokens.admin));
    expect(contact[1]![1]).toBe("@SUM(1+1)");
  });

  it("lọc theo trạng thái, nguồn, sale và khoảng ngày; audit ghi bộ lọc + số dòng", async () => {
    const bySale = await readRows(await exportLeads(`?assignedTo=${saleA.id}`, tokens.admin));
    expect(bySale).toHaveLength(3);
    expect(bySale[1]![8]).toBe(saleA.fullName);
    expect(await readRows(await exportLeads(`?assignedTo=${saleA.id}&status=contacted`, tokens.admin))).toHaveLength(2);
    expect(await readRows(await exportLeads("?source=project&status=new", tokens.admin))).toHaveLength(2);
    expect(await readRows(await exportLeads("?status=won", tokens.admin))).toHaveLength(1);

    const tomorrow = new Date(Date.now() + 36 * 3_600_000).toISOString();
    const longAgo = "2020-01-01T00:00:00.000Z";
    expect(await readRows(await exportLeads(`?createdFrom=${longAgo}&createdTo=${tomorrow}`, tokens.admin))).toHaveLength(1 + leads.length);
    expect(await readRows(await exportLeads(`?createdFrom=${longAgo}&createdTo=2020-12-31T12:00:00.000Z`, tokens.admin))).toHaveLength(1);

    const audit = (await exportAudits()).find((entry) => JSON.stringify(entry.meta).includes(saleA.id) && JSON.stringify(entry.meta).includes("contacted"));
    expect(audit?.meta).toMatchObject({ filters: { status: "contacted", assignedTo: saleA.id }, rowCount: 1 });
  });

  it("tham số sai -> 400 (kèm chi tiết), không audit", async () => {
    const before = (await exportAudits()).length;
    for (const query of ["?status=hack", "?source=x", "?assignedTo=1%27%20OR%201=1", "?createdFrom=2026-02-30T12:00:00.000Z", "?createdFrom=2026-10-01", "?createdTo=2026-10-01T12:00:00", "?createdFrom=2026-03-02T12:00:00.000Z&createdTo=2026-03-01T12:00:00.000Z"]) {
      const response = await exportLeads(query, tokens.admin);
      expect(response.status, query).toBe(400);
      expect((await response.json()).success).toBe(false);
    }
    expect((await exportAudits()).length).toBe(before);
  });

  it("lead đã ẩn danh: xuất placeholder, không có PII dù DB còn dữ liệu; lead xoá mềm không có trong file", async () => {
    const anonymized = await createLead({ fullName: "Nguyễn Bí Mật", phone: "0988777666", email: "bi.mat@example.test", message: "địa chỉ riêng" });
    await payload.update({ collection: "leads", id: anonymized.id, data: { anonymizedAt: new Date().toISOString() } as never, overrideAccess: true });
    const trashed = await createLead({ fullName: "Đã Xoá Mềm" });
    await payload.update({ collection: "leads", id: trashed.id, data: { deletedAt: new Date().toISOString() }, overrideAccess: true, trash: true });

    const response = await exportLeads("", tokens.admin);
    const text = JSON.stringify(await readRows(response));
    expect(text).not.toContain("Nguyễn Bí Mật");
    expect(text).not.toContain("0988777666");
    expect(text).not.toContain("bi.mat@example.test");
    expect(text).not.toContain("địa chỉ riêng");
    expect(text).not.toContain("Đã Xoá Mềm");
    expect(text).toContain(anonymized.code);
    expect(text).toContain("Đã ẩn danh");
  });

  it("audit lỗi thì không có file (fail-closed, 500)", async () => {
    const original = payload.create.bind(payload);
    (payload as { create: unknown }).create = (args: { collection: string }) =>
      args.collection === "audit-logs" ? Promise.reject(new Error("audit down")) : original(args as never);
    try {
      expect((await exportLeads("", tokens.secondAdmin)).status).toBe(500);
    } finally {
      (payload as { create: unknown }).create = original;
    }
  });

  it("lần thứ 11 trong giờ -> 429 + Retry-After + no-store; user khác không bị ảnh hưởng", async () => {
    const limited = await createStaff("admin3", ROLES.admin);
    const token = await login("admin3");
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await exportLeads("?status=won", token);
      expect(response.status, `lần ${attempt}`).toBe(200);
      await response.arrayBuffer();
    }
    const before = (await exportAudits()).filter((audit) => audit.actor === limited.id).length;
    const blocked = await exportLeads("?status=won", token);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(blocked.headers.get("Cache-Control")).toBe("no-store");
    expect((await exportAudits()).filter((audit) => audit.actor === limited.id)).toHaveLength(before);
    expect((await exportLeads("?status=won", tokens.admin)).status).toBe(200);
  });

  it("tài khoản admin bị khoá: 401 dù token còn hạn", async () => {
    const locked = await createStaff("admin4", ROLES.admin);
    const token = await login("admin4");
    await payload.update({ collection: "staff", id: locked.id, data: { active: false }, overrideAccess: true });
    expect((await exportLeads("", token)).status).toBe(401);
  });

  describe("khoảng ngày và keyset (lead có createdAt chỉ định, nằm ngoài các case trên)", () => {
    // Giá trị DatePicker của Payload khi admin chọn một ngày: 12:00 UTC.
    const PICKER_FROM = "2025-10-01T12:00:00.000Z";
    const PICKER_TO = "2025-10-05T12:00:00.000Z";
    const TIED_AT = "2025-03-01T00:00:00.000Z";
    const createdAtOf = ["2025-10-01T10:00:00.000Z", PICKER_FROM, "2025-10-03T05:00:00.000Z", PICKER_TO, "2025-10-05T13:00:00.000Z"];
    let tiedCodes: string[];
    let token: string;

    beforeAll(async () => {
      // Admin riêng: các case trên đã dùng gần hết 10 lượt/giờ của admin chung.
      await createStaff("admin5", ROLES.admin);
      token = await login("admin5");
      for (const createdAt of createdAtOf) await createLead({ createdAt });
      tiedCodes = [];
      for (let index = 0; index < 5; index += 1) tiedCodes.push((await createLead({ createdAt: TIED_AT })).code);
    }, 60_000);

    it("lọc khoảng ngày bằng giá trị picker thật: số dòng xuất = số lead danh sách hiển thị với cùng where", async () => {
      const where = { and: [{ createdAt: { greater_than_equal: PICKER_FROM } }, { createdAt: { less_than_equal: PICKER_TO } }] };
      const listed = await payload.find({ collection: "leads", where, overrideAccess: true, depth: 0, pagination: false, limit: 0 });
      expect(listed.docs).toHaveLength(3);
      const rows = await readRows(await exportLeads(`?createdFrom=${PICKER_FROM}&createdTo=${PICKER_TO}`, token));
      expect(rows.slice(1).map((row) => row[0]).sort()).toEqual(listed.docs.map((lead) => lead.code).sort());
    });

    it("mốc giờ Việt Nam tương đương cho cùng tập lead với mốc UTC", async () => {
      const rows = await readRows(await exportLeads("?createdFrom=2025-10-01T19:00:00%2B07:00&createdTo=2025-10-05T19:00:00%2B07:00", token));
      expect(rows).toHaveLength(1 + 3);
    });

    it("keyset: pageSize=2, 5 lead cùng createdAt -> đủ 5 dòng, không bỏ, không trùng", async () => {
      const admin = (await payload.find({ collection: "staff", where: { email: { equals: `admin-${runId}@example.test` } }, overrideAccess: true, depth: 0 })).docs[0]!;
      const url = `http://localhost/api/admin/leads/export?createdFrom=${TIED_AT}&createdTo=${TIED_AT}`;
      const req = await createLocalReq({ user: { ...admin, collection: "staff" } as never }, payload);
      Object.assign(req, { url });
      const response = await handleLeadsExport(req, async () => ({ allowed: true }) as never, 100, 2);
      expect(response.status).toBe(200);
      const codes = (await readRows(response)).slice(1).map((row) => row[0]!);
      expect(codes).toHaveLength(5);
      expect(new Set(codes).size).toBe(5);
      expect([...codes].sort()).toEqual([...tiedCodes].sort());
    });
  });
});
