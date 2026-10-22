import { createHmac } from "node:crypto";

import { getRedis } from "@/lib/redis";

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** UA thật hiếm khi quá vài trăm ký tự; cắt trước khi băm để request bơm UA khổng lồ không tốn CPU. */
const MAX_USER_AGENT_CHARS = 512;

/**
 * UA không phải người đọc: crawler / bot, trình duyệt headless / tự động hoá, công cụ xem trước link, thư viện HTTP.
 * Không chặn từ khoá của trình duyệt trong app (Zalo, Messenger `FBAN`, Slack desktop…) vì đó là người thật đang đọc; `(?<!cu)` để máy
 * Android hãng Cubot (UA chứa "CUBOT") không bị coi là bot.
 */
const BOT_USER_AGENT =
  /(?<!cu)bot\b|crawl|spider|slurp|archiver|headless|phantomjs|puppeteer|playwright|selenium|webdriver|lighthouse|page ?speed|gtmetrix|preview|facebookexternalhit|embedly|quora link|vkshare|w3c_validator|mediapartners|adsbot|apis-google|google-inspectiontool|feedfetcher|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|axios\/|node-fetch|undici|go-http-client|okhttp|java\/|libwww|httpclient|scrapy|postman|insomnia/i;

/** UA rỗng (không trình duyệt nào gửi vậy) hoặc khớp danh sách bot thì không đếm. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim();
  if (!ua) return true;
  return BOT_USER_AGENT.test(ua);
}

/** Trình duyệt tải trước trang (prefetch / prerender) gửi `Sec-Purpose` hoặc `Purpose`; người dùng chưa thật sự xem. */
export function isPrefetchRequest(headers: Headers): boolean {
  const purpose = `${headers.get("sec-purpose") ?? ""} ${headers.get("purpose") ?? ""} ${headers.get("x-moz") ?? ""}`;
  return /prefetch|prerender/i.test(purpose);
}

/** Mốc 00:00 giờ Việt Nam (UTC+7, không có giờ mùa hè) của ngày chứa `now`, đúng quy ước cột `news-views-daily.day` (ERD). */
export function vietnamDayStart(now: Date): Date {
  return new Date(Math.floor((now.getTime() + VIETNAM_UTC_OFFSET_MS) / DAY_MS) * DAY_MS - VIETNAM_UTC_OFFSET_MS);
}

/** Số giây còn lại tới 24:00 giờ Việt Nam (ít nhất 1): TTL của khoá chống trùng. */
export function secondsUntilVietnamDayEnd(now: Date): number {
  const end = vietnamDayStart(now).getTime() + DAY_MS;
  return Math.max(1, Math.ceil((end - now.getTime()) / 1000));
}

export interface ViewIdentity {
  /** `ipHash` từ pipeline công khai: IP thô không bao giờ tới đây. */
  ipHash: string;
  userAgent: string;
  day: Date;
  newsId: string;
}

/**
 * Khoá Redis "người này đã xem bài này hôm nay": HMAC-SHA256(secret, ip + ua + ngày VN + bài). Khoá chỉ là hex,
 * không chứa IP / UA / id bài thô nên đọc Redis cũng không suy ra được ai đã đọc gì.
 */
export function viewDedupeKey(identity: ViewIdentity, secret: string | undefined = process.env.PAYLOAD_SECRET): string {
  if (!secret) throw new Error("Thiếu PAYLOAD_SECRET để băm khoá lượt xem");
  const day = identity.day.toISOString();
  const ua = identity.userAgent.trim().slice(0, MAX_USER_AGENT_CHARS);
  const digest = createHmac("sha256", secret)
    .update(`news-view:v1:${identity.ipHash}|${ua}|${day}|${identity.newsId}`)
    .digest("hex");
  return `nv:${digest}`;
}

/** Redis lỗi khi ghi khoá chống trùng: người gọi KHÔNG được cộng lượt xem (không xác định được là trùng hay không). */
export class ViewDedupeUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Không kiểm tra được lượt xem trùng (Redis không sẵn sàng)", { cause });
    this.name = "ViewDedupeUnavailableError";
  }
}

export interface DedupeRedis {
  set(key: string, value: string, ex: "EX", seconds: number, nx: "NX"): Promise<unknown>;
}

/**
 * `SET key 1 EX ttl NX` trong MỘT lệnh: `true` = lần xem đầu trong ngày (được cộng), `false` = đã xem rồi.
 * Hai request song song cùng người chỉ một cái thắng.
 */
export async function claimDailyView(key: string, ttlSeconds: number, redis: DedupeRedis = getRedis()): Promise<boolean> {
  try {
    return (await redis.set(key, "1", "EX", ttlSeconds, "NX")) === "OK";
  } catch (error) {
    throw new ViewDedupeUnavailableError(error);
  }
}
