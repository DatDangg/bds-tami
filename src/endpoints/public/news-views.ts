import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Endpoint, Payload, PayloadRequest } from "payload";
import { z } from "zod";

import { fail } from "../../lib/http/response";
import { logger } from "../../lib/logger";
import { findPublicList } from "../../lib/content/public-queries";
import {
  claimDailyView,
  isBotUserAgent,
  isPrefetchRequest,
  secondsUntilVietnamDayEnd,
  viewDedupeKey,
  ViewDedupeUnavailableError,
  vietnamDayStart,
} from "../../lib/news/view-dedupe";
import { runPublicPipeline, type PublicPipelineDeps, type ValidationOutcome } from "../_middleware/public-pipeline";

const log = logger.child({ component: "news-views" });

/** Body hợp lệ chỉ ~50 byte; chặn sớm body lớn bất thường trước khi parse. */
const MAX_BODY_CHARS = 500;

export const newsViewBodySchema = z.object({ newsId: z.uuid() });

export type NewsViewInput = z.infer<typeof newsViewBodySchema>;

/** Phần của request mà endpoint cần; `Request` chuẩn và `PayloadRequest` đều đáp ứng (đọc body chỉ sau rate limit). */
export interface NewsViewRequest {
  headers: Headers;
  text: () => Promise<string>;
}

/** Beacon gửi Blob `text/plain`: đọc body dạng chữ rồi tự parse JSON (như `click-events`). */
export async function validateNewsViewBody(request: NewsViewRequest): Promise<ValidationOutcome<NewsViewInput>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return { ok: false, details: [{ message: "Nội dung quá lớn" }] };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, details: [{ message: "Nội dung không phải JSON" }] };
  }
  const parsed = newsViewBodySchema.safeParse(json);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, details: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })) };
}

export interface NewsViewDeps {
  /** Bài đang công khai (đã xuất bản, chưa xoá mềm). */
  isCountable: (newsId: string) => Promise<boolean>;
  /** `true` = lần xem đầu trong ngày của người này; ném `ViewDedupeUnavailableError` khi Redis lỗi. */
  claimView: (key: string, ttlSeconds: number) => Promise<boolean>;
  /** Cộng 1 lượt cho (bài, ngày) bằng upsert nguyên tử. */
  addView: (newsId: string, day: Date) => Promise<void>;
  now?: () => Date;
}

const noContent = () => new Response(null, { status: 204 });

/**
 * Chuỗi: pipeline công khai (rate limit 30/phút/IP, 429/503; không Turnstile; body sai 400) -> bỏ bot / prefetch ->
 * bài phải đang công khai -> chống trùng (Redis `SET NX` tới hết ngày VN) -> upsert +1 -> 204.
 * Mọi trường hợp bỏ qua đều trả 204 như khi đếm, không lộ lý do. Redis lỗi ở bước chống trùng: KHÔNG cộng, trả 503
 * như pipeline (beacon không đọc phản hồi). Không log IP / UA (pipeline chỉ đưa ra `ipHash`).
 */
export async function handleNewsView(
  request: NewsViewRequest,
  deps: NewsViewDeps,
  pipelineDeps?: PublicPipelineDeps,
): Promise<Response> {
  const result = await runPublicPipeline(
    {
      // Pipeline chỉ dùng header của request này để xác định IP.
      request: new Request("http://localhost/api/public/news-views", { method: "POST", headers: request.headers }),
      endpoint: "news-views",
      turnstile: false,
      validate: () => validateNewsViewBody(request),
    },
    pipelineDeps,
  );
  if (!result.ok) return result.response;

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBotUserAgent(userAgent) || isPrefetchRequest(request.headers)) return noContent();

  const { newsId } = result.value;
  if (!(await deps.isCountable(newsId))) return noContent();

  const now = deps.now?.() ?? new Date();
  const day = vietnamDayStart(now);
  const key = viewDedupeKey({ ipHash: result.ipHash, userAgent, day, newsId });
  let firstView: boolean;
  try {
    firstView = await deps.claimView(key, secondsUntilVietnamDayEnd(now));
  } catch (error) {
    if (!(error instanceof ViewDedupeUnavailableError)) throw error;
    const reason = error.cause instanceof Error ? error.cause.name : "unknown";
    log.warn({ reason }, "Redis lỗi khi chống đếm trùng, bỏ lượt xem (trả 503)");
    return fail(503, "Hệ thống tạm thời không khả dụng, vui lòng thử lại sau");
  }
  if (!firstView) return noContent();

  await deps.addView(newsId, day);
  return noContent();
}

/** Bài công khai theo id, đọc như khách qua `findPublicList` (nơi duy nhất dựng điều kiện công khai). */
export async function isPublicNews(payload: Payload, newsId: string): Promise<boolean> {
  const { docs } = await findPublicList(payload, "news", "vi", {
    where: { id: { equals: newsId } },
    limit: 1,
    depth: 0,
    select: { id: true },
  });
  return docs.length > 0;
}

/**
 * MỘT câu `INSERT … ON CONFLICT (news_id, day) DO UPDATE SET views = views + 1` dựa vào unique index `news_day_idx`:
 * nhiều request song song không đọc-rồi-ghi đè nhau (mất lượt) cũng không va unique. `id` / `created_at` có DB default.
 */
export async function addNewsView(payload: Payload, newsId: string, day: Date): Promise<void> {
  const adapter = payload.db as unknown as PostgresAdapter;
  await adapter.drizzle.execute(sql`
    INSERT INTO news_views_daily (news_id, day, views)
    VALUES (${newsId}, ${day.toISOString()}, 1)
    ON CONFLICT (news_id, day) DO UPDATE SET views = news_views_daily.views + 1, updated_at = now()
  `);
}

function createNewsViewDeps(req: PayloadRequest): NewsViewDeps {
  return {
    isCountable: (newsId) => isPublicNews(req.payload, newsId),
    claimView: (key, ttlSeconds) => claimDailyView(key, ttlSeconds),
    addView: (newsId, day) => addNewsView(req.payload, newsId, day),
  };
}

export const newsViewsEndpoint: Endpoint = {
  path: "/public/news-views",
  method: "post",
  handler: (req) => handleNewsView({ headers: req.headers, text: () => req.text!() }, createNewsViewDeps(req)),
};
