import pino, { type DestinationStream, type Logger, type LoggerOptions } from "pino";

import { scrubText } from "@/lib/monitoring/scrub-text";
import { SERVICE_NAME } from "@/lib/monitoring/service-name";

/** Khoá chứa dữ liệu cá nhân hoặc bí mật: bị che ở mọi vị trí tới 3 cấp lồng (xem `redactPaths`). */
const SENSITIVE_KEYS = [
  "phone",
  "email",
  "fullName",
  "message",
  "password",
  "cookie",
  "set-cookie",
  "authorization",
  "Authorization",
  "Cookie",
  "Set-Cookie",
] as const;

const MAX_NESTING_DEPTH = 3;

/**
 * pino chỉ hỗ trợ wildcard theo từng cấp (`*.email`, `*.*.email`), không có "mọi độ sâu",
 * nên sinh sẵn các cấp 0..MAX_NESTING_DEPTH. `req.headers.cookie`, `body.lead.email`... đều nằm trong tầm này.
 */
export function redactPaths(): string[] {
  return SENSITIVE_KEYS.flatMap((key) => {
    const accessor = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `["${key}"]`;
    return Array.from({ length: MAX_NESTING_DEPTH + 1 }, (_, depth) =>
      [...Array<string>(depth).fill("*"), accessor].join(".").replace(/\.\[/g, "["),
    );
  });
}

/**
 * Serializer cho khoá `err`/`error`. Không dùng serializer mặc định vì nó xuất `message`/`stack` nguyên văn
 * (thông điệp lỗi có thể chứa email/SĐT khách) và khoá `message` lại đang bị che, làm log lỗi mất tác dụng.
 * Ở đây xuất `text` đã lọc email/SĐT (`scrubText`) nên vẫn đọc được để debug.
 */
function serializeError(value: unknown): unknown {
  if (!(value instanceof Error)) return value;
  return {
    type: value.name,
    text: scrubText(value.message),
    stack: value.stack ? scrubText(value.stack) : undefined,
  };
}

const OBJECT_FORMAT_PATTERN = /%[oOj]/;
const NUMBER_FORMAT_PATTERN = /%[dif]/g;

function stringifyForScrub(value: object): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "[unserializable]";
  }
}

/** Object đầu có `msg` chuỗi: pino ghi nguyên văn khoá này, nên lọc tại đây. */
function scrubRecordMessage(record: unknown): unknown {
  if (typeof record !== "object" || record === null || Array.isArray(record)) return record;
  const { msg } = record as { msg?: unknown };
  return typeof msg === "string" ? { ...record, msg: scrubText(msg) } : record;
}

/**
 * Tham số nội suy (đứng sau chuỗi format) trước khi pino ghép vào msg. `%s` với Error ghi `String(err)` (message thô),
 * `%d` với số ghi nguyên số (SĐT dạng number): đều không qua redact nên lọc ở đây. Số không chứa SĐT giữ nguyên kiểu number.
 */
function scrubInterpolatedArg(arg: unknown, interpolatesObjects: boolean): unknown {
  if (typeof arg === "string") return scrubText(arg);
  if (arg instanceof Error) return scrubText(`${arg.name}: ${arg.message}`);
  if (typeof arg === "number" || typeof arg === "bigint") {
    const cleaned = scrubText(String(arg));
    return cleaned === String(arg) ? arg : cleaned;
  }
  if (interpolatesObjects && typeof arg === "object" && arg !== null) return scrubText(stringifyForScrub(arg));
  return arg;
}

function hasStringMessage(value: unknown): value is { message: string } {
  return typeof value === "object" && value !== null && typeof (value as { message?: unknown }).message === "string";
}

/**
 * pino tự gán `msg = err.message` NGUYÊN VĂN khi tham số đầu là Error hoặc `{ err }` không kèm msg (proto.js `write`),
 * bỏ qua cả redact lẫn serializer. Payload log đúng kiểu này. Nên ta tự chèn msg đã lọc, và lọc mọi chuỗi còn lại.
 */
export function scrubLogArguments(args: unknown[]): unknown[] {
  const [first, second, ...rest] = args;
  let merge: unknown = first;
  let message: unknown = second;
  if (first instanceof Error) {
    merge = { err: first };
    message = second === undefined ? first.message : second;
  } else if (typeof first === "object" && first !== null && second === undefined) {
    const record = first as Record<string, unknown>;
    if (record.msg === undefined && hasStringMessage(record.err)) message = record.err.message;
  }
  const all = [scrubRecordMessage(merge), message, ...rest];
  // %o/%O/%j: pino stringify object thẳng vào msg (redact không áp dụng) nên stringify + lọc trước.
  // Chuỗi format là tham số đầu (`logger.info("lead %o", obj)`) hoặc tham số sau object đầu (`logger.info({ a }, "lead %o", obj)`).
  const formatIndex = typeof merge === "string" ? 0 : 1;
  const format = all[formatIndex];
  const interpolates = typeof format === "string" && OBJECT_FORMAT_PATTERN.test(format);
  const hasPlaceholder = typeof format === "string" && /%[sdifoOj]/.test(format);
  const scrubbed = all.map((arg, index) => {
    if (typeof arg === "string") return scrubText(arg);
    if (!hasPlaceholder || index <= formatIndex) return arg;
    return scrubInterpolatedArg(arg, interpolates);
  });
  // Số bị che thành chuỗi thì `%d` ra NaN: đổi sang `%s` để log vẫn đọc được ("[phone]").
  if (hasPlaceholder && scrubbed.some((arg, index) => typeof arg === "string" && typeof all[index] === "number")) {
    scrubbed[formatIndex] = (scrubbed[formatIndex] as string).replace(NUMBER_FORMAT_PATTERN, "%s");
  }
  // `logger.info("text")` / `logger.info({ ... })`: bỏ `message` undefined cuối để giữ dạng gọi ban đầu.
  while (scrubbed.length > 1 && scrubbed[scrubbed.length - 1] === undefined) scrubbed.pop();
  return scrubbed;
}

function resolveLevel(): string {
  const configured = process.env.LOG_LEVEL;
  if (configured) return configured;
  return process.env.NODE_ENV === "test" ? "silent" : "info";
}

/** Option pino dùng chung cho app, jobs và logger nội bộ của Payload. JSON một dòng ra stdout để Loki thu. */
export function createLoggerOptions(): LoggerOptions {
  return {
    level: resolveLevel(),
    base: { service: SERVICE_NAME, env: process.env.APP_ENV ?? "development" },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    redact: { paths: redactPaths(), censor: "[REDACTED]" },
    serializers: { err: serializeError, error: serializeError },
    hooks: {
      logMethod(args, method) {
        method.apply(this, scrubLogArguments(args) as Parameters<typeof method>);
      },
    },
  };
}

/** Tách riêng để test ghi vào bộ nhớ thay vì stdout. */
export function createLogger(destination?: DestinationStream): Logger {
  return pino(createLoggerOptions(), destination);
}

// Cache trên globalThis: hot reload của dev server nạp lại module (xem lib/redis.ts).
const globalForLogger = globalThis as typeof globalThis & { __tamiLogger?: Logger };

/** Logger dùng chung của process. Module nào cũng nên `logger.child({ component })` thay vì `console.*`. */
export const logger: Logger = (globalForLogger.__tamiLogger ??= createLogger());
