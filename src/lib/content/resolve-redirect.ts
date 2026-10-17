import config from "@payload-config";
import { getPayload } from "payload";

import { logger } from "../logger";
import { findRedirectTarget } from "./find-redirect";

/** Quá hạn này coi như không có redirect: proxy chạy ở mọi trang chi tiết, DB chậm không được làm trang (kể cả ISR) chờ theo. */
export const REDIRECT_LOOKUP_TIMEOUT_MS = 400;
/** Cache kết quả (cả "không có") trong bộ nhớ: tương đương độ trễ cập nhật của CDN (s-maxage=60). */
export const REDIRECT_CACHE_TTL_MS = 60_000;
const REDIRECT_CACHE_MAX_ENTRIES = 1000;

const cache = new Map<string, { target: string | null; expiresAt: number }>();

/** Chỉ dùng cho test. */
export const clearRedirectCache = (): void => cache.clear();

function remember(pathname: string, target: string | null): void {
  // Chặn bot quét đường dẫn ngẫu nhiên làm phình bộ nhớ: đầy thì xoá hết (đơn giản hơn LRU, đủ cho TTL 60s).
  if (cache.size >= REDIRECT_CACHE_MAX_ENTRIES) cache.clear();
  cache.set(pathname, { target, expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS });
}

function timeoutAfter(ms: number): { promise: Promise<"timeout">; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), ms);
  });
  return { promise, cancel: () => clearTimeout(timer) };
}

/**
 * Dùng trong `proxy.ts`, TRƯỚC khi trang render: chỉ proxy mới trả được HTTP 301 thật (trang/`not-found` đã bắt đầu stream thì
 * Next chỉ chuyển hướng phía client). Lỗi hoặc quá hạn DB không được làm hỏng cả website: ghi log rồi coi như không có redirect
 * (và không cache kết quả đó).
 */
export async function resolveRedirect(pathname: string): Promise<string | null> {
  const hit = cache.get(pathname);
  if (hit && hit.expiresAt > Date.now()) return hit.target;

  const timeout = timeoutAfter(REDIRECT_LOOKUP_TIMEOUT_MS);
  try {
    const lookup = findRedirectTarget(await getPayload({ config }), pathname);
    lookup.catch(() => undefined); // nếu hết giờ trước, lỗi muộn của truy vấn không thành unhandled rejection
    const result = await Promise.race([lookup, timeout.promise]);
    if (result === "timeout") {
      logger.warn({ pathname, timeoutMs: REDIRECT_LOOKUP_TIMEOUT_MS }, "Tra redirect quá hạn, bỏ qua và phục vụ trang bình thường");
      return null;
    }
    remember(pathname, result);
    return result;
  } catch (error) {
    logger.error({ err: error, pathname }, "Không tra được redirect, bỏ qua và phục vụ trang bình thường");
    return null;
  } finally {
    timeout.cancel();
  }
}
