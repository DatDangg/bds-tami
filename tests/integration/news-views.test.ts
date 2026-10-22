import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;
const hasRedis = Boolean(process.env.REDIS_URL);

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
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

/**
 * BL-054 P1-T03: endpoint `POST /api/public/news-views` (Redis thật, DB tạm chạy migration thật) + loader "Đọc nhiều".
 * Thiếu DATABASE_URL_TEST / REDIS_URL thì bỏ qua có chủ đích.
 */
describe.skipIf(!baseUrl || !hasRedis)("integration: news-views + Đọc nhiều (DB tạm, Redis thật)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_nv_${runId}`;
  let testUrl = "";
  let payload: Payload;
  let authorId = "";
  let categoryId = "";
  let mediaId = "";
  let ipSeq = 0;
  let mostRead: typeof import("../../src/lib/news/most-read");
  let endpoint: typeof import("../../src/endpoints/public/news-views");

  /** Mỗi người xem một IP riêng (TRUST_CF_CONNECTING_IP) để bucket rate limit không dính nhau. */
  const newIp = () => {
    ipSeq += 1;
    return `198.51.${Math.floor(ipSeq / 250) + 10}.${(ipSeq % 250) + 1}`;
  };
  const usedIps: string[] = [];

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  function postView(newsId: unknown, ip: string, userAgent: string = CHROME) {
    usedIps.push(ip);
    return handleEndpoints({
      config: payload.config,
      request: new Request("http://localhost/api/public/news-views", {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8", "CF-Connecting-IP": ip, "User-Agent": userAgent },
        body: JSON.stringify({ newsId }),
      }),
    });
  }

  async function viewsOf(newsId: string): Promise<number> {
    const rows = await withDatabase((client) => client.query(`SELECT COALESCE(SUM(views), 0)::int AS total FROM news_views_daily WHERE news_id = $1`, [newsId]));
    return Number(rows.rows[0].total);
  }

  async function createNews(title: string, options: { status?: "draft" | "published"; featured?: boolean; english?: boolean; publishedAt?: string } = {}) {
    const doc = await payload.create({
      collection: "news",
      data: {
        title,
        excerpt: "Tóm tắt",
        content: lexical(`Nội dung ${title}`),
        category: categoryId,
        author: authorId,
        cover: mediaId,
        status: options.status ?? "published",
        isFeatured: options.featured ?? false,
      } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });
    if (options.english) {
      await payload.update({
        collection: "news",
        id: doc.id,
        data: { title: `EN ${title}`, excerpt: "Summary", content: lexical(`Body ${title}`), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
    }
    if (options.publishedAt) {
      await withDatabase((client) => client.query(`UPDATE news SET published_at = $1 WHERE id = $2`, [options.publishedAt, doc.id]));
    }
    return String(doc.id);
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
    process.env.TRUST_CF_CONNECTING_IP = "true";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    mostRead = await import("../../src/lib/news/most-read");
    endpoint = await import("../../src/endpoints/public/news-views");
    const author = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `admin-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
    });
    authorId = String(author.id);
    const category = await payload.create({ collection: "categories", data: { name: `Thị trường ${runId}`, scope: "news" } as never, locale: "vi", overrideAccess: true, depth: 0 });
    categoryId = String(category.id);
    // Trường upload chỉ cần `media` tồn tại: chèn thẳng dòng để khỏi ghi file ra đĩa.
    mediaId = (await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ('image/jpeg') RETURNING id`))).rows[0].id as string;
  }, 180_000);

  afterAll(async () => {
    const { getRedis, closeRedis } = await import("../../src/lib/redis");
    const { ipHash } = await import("../../src/lib/security/ip-hash");
    const redis = getRedis();
    const rateKeys = usedIps.map((ip) => `rl:news-views:${ipHash(ip)}`);
    if (rateKeys.length > 0) await redis.del(...rateKeys);
    // Khoá chống trùng là HMAC nên không dựng lại từ IP được: Redis db của worktree / CI riêng, quét `nv:*` rồi xoá.
    const viewKeys = await redis.keys("nv:*");
    if (viewKeys.length > 0) await redis.del(...viewKeys);
    await closeRedis();
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

  describe("POST /api/public/news-views", () => {
    it("cùng người xem 2 lần trong ngày -> +1; người khác -> +1 nữa; mọi phản hồi 204", async () => {
      const newsId = await createNews(`Bài đếm ${runId}`);
      const ip = newIp();
      expect((await postView(newsId, ip)).status).toBe(204);
      expect((await postView(newsId, ip)).status).toBe(204);
      expect(await viewsOf(newsId)).toBe(1);
      expect((await postView(newsId, newIp())).status).toBe(204);
      expect(await viewsOf(newsId)).toBe(2);
    });

    it("bot / UA rỗng -> 204 và không cộng", async () => {
      const newsId = await createNews(`Bài bot ${runId}`);
      expect((await postView(newsId, newIp(), "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).status).toBe(204);
      expect((await postView(newsId, newIp(), "")).status).toBe(204);
      expect(await viewsOf(newsId)).toBe(0);
    });

    it("bài nháp / xoá mềm / không tồn tại -> 204 và không ghi dòng", async () => {
      const draftId = await createNews(`Bài nháp ${runId}`, { status: "draft" });
      const trashedId = await createNews(`Bài xoá mềm ${runId}`);
      await payload.update({ collection: "news", id: trashedId, data: { deletedAt: new Date().toISOString() }, overrideAccess: true });
      for (const id of [draftId, trashedId, "00000000-0000-4000-8000-000000000000"]) {
        expect((await postView(id, newIp())).status).toBe(204);
      }
      expect(await viewsOf(draftId)).toBe(0);
      expect(await viewsOf(trashedId)).toBe(0);
    });

    it("body sai -> 400", async () => {
      expect((await postView("khong-phai-uuid", newIp())).status).toBe(400);
    });

    it("vượt 30 lần / phút / IP -> 429", async () => {
      const newsId = await createNews(`Bài rate limit ${runId}`);
      const ip = newIp();
      const statuses: number[] = [];
      for (let i = 0; i < 31; i += 1) statuses.push((await postView(newsId, ip)).status);
      expect(statuses.slice(0, 30).every((status) => status === 204)).toBe(true);
      expect(statuses[30]).toBe(429);
      expect(await viewsOf(newsId)).toBe(1);
    });

    it("bảng chỉ có news_id / day / views (không cột IP / UA); khoá Redis không chứa IP thô", async () => {
      const newsId = await createNews(`Bài PII ${runId}`);
      const ip = newIp();
      await postView(newsId, ip);
      const columns = await withDatabase((client) =>
        client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'news_views_daily' ORDER BY column_name`),
      );
      expect(columns.rows.map((row) => row.column_name)).toEqual(["created_at", "day", "id", "news_id", "updated_at", "views"]);
      const { getRedis } = await import("../../src/lib/redis");
      const keys = await getRedis().keys("*");
      expect(keys.some((key) => key.includes(ip) || key.includes(newsId))).toBe(false);
    });

    it("nhiều người xem ĐỒNG THỜI -> không mất lượt (upsert nguyên tử)", async () => {
      const newsId = await createNews(`Bài đồng thời ${runId}`);
      const responses = await Promise.all(Array.from({ length: 25 }, () => postView(newsId, newIp())));
      expect(responses.every((response) => response.status === 204)).toBe(true);
      expect(await viewsOf(newsId)).toBe(25);
    });

    it("addNewsView chạy song song 50 lần trên cùng (bài, ngày) -> đúng 50, một dòng", async () => {
      const newsId = await createNews(`Bài upsert ${runId}`);
      const day = new Date("2026-10-21T17:00:00.000Z");
      await Promise.all(Array.from({ length: 50 }, () => endpoint.addNewsView(payload, newsId, day)));
      const rows = await withDatabase((client) => client.query(`SELECT views::int AS views FROM news_views_daily WHERE news_id = $1`, [newsId]));
      expect(rows.rows).toEqual([{ views: 50 }]);
    });
  });

  describe("findMostReadNews", () => {
    const now = new Date("2026-10-22T03:00:00.000Z"); // 10:00 ngày 22/10 giờ VN
    const vnDay = (daysAgo: number) => new Date(Date.parse("2026-10-21T17:00:00.000Z") - daysAgo * DAY_MS).toISOString();
    const setViews = (newsId: string, daysAgo: number, views: number) =>
      withDatabase((client) => client.query(`INSERT INTO news_views_daily (news_id, day, views) VALUES ($1, $2, $3)`, [newsId, vnDay(daysAgo), views]));
    const ids: Record<string, string> = {};

    beforeAll(async () => {
      // Bắt đầu từ DB sạch tin tức: bài của describe trước không được chen vào phần bù.
      await payload.delete({ collection: "news", where: { id: { exists: true } }, overrideAccess: true, trash: true });
      const at = (day: number) => `2026-10-${String(day).padStart(2, "0")}T02:00:00.000Z`;
      ids.a = await createNews("A nhiều nhất", { publishedAt: at(1), english: true });
      ids.b = await createNews("B thứ hai", { publishedAt: at(2) });
      ids.c = await createNews("C hoà cũ", { publishedAt: at(3), english: true });
      ids.d = await createNews("D hoà mới", { publishedAt: at(4) });
      ids.e = await createNews("E thứ năm", { publishedAt: at(5) });
      ids.f = await createNews("F thứ sáu", { publishedAt: at(6), english: true });
      ids.old = await createNews("Old ngoài cửa sổ", { publishedAt: at(7) });
      ids.hidden = await createNews("Hidden đã ẩn", { publishedAt: at(8) });
      ids.featured = await createNews("Featured không lượt xem", { publishedAt: at(9), featured: true });
      ids.newest = await createNews("Newest không lượt xem", { publishedAt: at(10), english: true });
      await setViews(ids.a, 0, 50);
      await setViews(ids.a, 29, 50); // ngày đầu cửa sổ: vẫn tính
      await setViews(ids.b, 3, 80);
      await setViews(ids.c, 1, 40);
      await setViews(ids.d, 2, 40);
      await setViews(ids.e, 5, 30);
      await setViews(ids.f, 6, 20);
      await setViews(ids.old, 30, 9_999); // ngày thứ 31: ngoài cửa sổ
      await setViews(ids.hidden, 0, 9_999);
      await payload.update({ collection: "news", id: ids.hidden, data: { status: "draft" } as never, overrideAccess: true });
    }, 120_000);

    it("top 5 theo tổng 30 ngày; hoà -> bài mới hơn trước; bỏ bài ngoài cửa sổ và bài đã ẩn", async () => {
      const items = await mostRead.findMostReadNews(payload, "vi", { now });
      expect(items.map((item) => item.id)).toEqual([ids.a, ids.b, ids.d, ids.c, ids.e]);
      expect(items[0]).toMatchObject({ title: "A nhiều nhất", href: expect.stringMatching(/^\/tin-tuc\/.+/), cover: expect.objectContaining({ id: mediaId }) });
      expect(Object.keys(items[0]!).sort()).toEqual(["cover", "dateLabel", "href", "id", "publishedAt", "title"]);
    });

    it("/en chỉ bài có bản EN; thiếu thì bù featured (không có EN -> bỏ) rồi bài mới nhất, không trùng", async () => {
      const items = await mostRead.findMostReadNews(payload, "en", { now });
      // Có lượt xem + EN: A (100), C (40), F (20); bù: Featured không có EN nên bỏ, Newest (EN).
      expect(items.map((item) => item.id)).toEqual([ids.a, ids.c, ids.f, ids.newest]);
      expect(items[0]).toMatchObject({ title: "EN A nhiều nhất", href: expect.stringMatching(/^\/en\/news\/.+/) });
    });

    it("ít bài có lượt xem -> bù isFeatured mới nhất rồi bài mới nhất, không trùng", async () => {
      const items = await mostRead.findMostReadNews(payload, "vi", { now, limit: 8 });
      expect(items.map((item) => item.id)).toEqual([ids.a, ids.b, ids.d, ids.c, ids.e, ids.f, ids.featured, ids.newest]);
      expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    });

    it("chưa có lượt xem nào trong cửa sổ -> toàn bộ là phần bù", async () => {
      const later = new Date(now.getTime() + 60 * DAY_MS);
      const items = await mostRead.findMostReadNews(payload, "vi", { now: later });
      expect(items.map((item) => item.id)).toEqual([ids.featured, ids.newest, ids.old, ids.f, ids.e]);
    });
  });
});
