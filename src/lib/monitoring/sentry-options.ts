import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

import { SERVICE_NAME } from "@/lib/monitoring/service-name";
import { scrubText } from "@/lib/monitoring/scrub-text";

const MAX_BREADCRUMBS = 20;

function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  // Bỏ `data` (URL fetch có query, body...) — chỉ giữ loại sự kiện và nhãn đã lọc.
  return {
    type: breadcrumb.type,
    category: breadcrumb.category,
    level: breadcrumb.level,
    timestamp: breadcrumb.timestamp,
    message: breadcrumb.message ? scrubText(breadcrumb.message) : undefined,
  };
}

/**
 * `beforeSend`: loại mọi dữ liệu cá nhân khỏi event trước khi rời máy (sendDefaultPii=false chưa đủ:
 * SDK vẫn gắn header/cookie/body của request). Giữ lại tên lỗi, stack, URL (không query) và method để điều tra.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.extra;
  if (event.message) event.message = scrubText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value);
  }
  if (event.request) {
    const { method, url } = event.request;
    event.request = { method, url: url?.split("?")[0] };
  }
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  return event;
}

/** Option chung server + trình duyệt. Tracing tắt (không đặt `tracesSampleRate`): chỉ thu lỗi, không thu span. */
export function buildSentryOptions(input: { dsn: string; environment: string }) {
  return {
    dsn: input.dsn,
    environment: input.environment,
    serverName: SERVICE_NAME,
    sendDefaultPii: false,
    maxBreadcrumbs: MAX_BREADCRUMBS,
    beforeSend: scrubSentryEvent,
    initialScope: { tags: { service: SERVICE_NAME } },
  };
}

/**
 * Khởi tạo Sentry SDK chỉ khi có DSN. Không DSN → không gọi `init` (SDK không dựng client, không network); trả `false`.
 * `init` được truyền vào để test kiểm "không init" mà không cần mock module.
 */
export function initSentryIfConfigured<Options extends object>(
  init: (options: Options) => unknown,
  input: { dsn: string | undefined; environment: string },
  extraOptions: Partial<Options> = {},
): boolean {
  if (!input.dsn) return false;
  const base = buildSentryOptions({ dsn: input.dsn, environment: input.environment });
  init({ ...base, ...extraOptions } as unknown as Options);
  return true;
}

/**
 * Process `jobs` (tsx, Node ESM) nạp bản CJS của SDK qua cjs-module-lexer nên namespace thiếu vài named export
 * (vd onUnhandledRejectionIntegration): đủ bộ export nằm ở `default` (module.exports). Next/Turbopack nạp bản ESM
 * (không có `default`) → giữ nguyên namespace.
 */
export function pickSentryExports<Namespace extends object>(namespace: Namespace): Namespace {
  return "default" in namespace ? (namespace as Namespace & { default: Namespace }).default : namespace;
}
