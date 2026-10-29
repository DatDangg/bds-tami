const MAX_FIELD_LENGTH = 64;

export interface SendErrorFields {
  errorName: string;
  code?: string | number;
  responseCode?: number;
  command?: string;
}

const shortText = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value.slice(0, MAX_FIELD_LENGTH) : undefined;

/**
 * Chỉ trích vài trường định danh lỗi SMTP. KHÔNG trả `message`/`stack`/`response`/object lỗi gốc: chúng có thể
 * chứa địa chỉ người nhận, token trong nội dung thư hoặc thông tin đăng nhập SMTP.
 */
export function pickSendErrorFields(err: unknown): SendErrorFields {
  if (typeof err !== "object" || err === null) return { errorName: "UnknownError" };
  const source = err as { name?: unknown; code?: unknown; responseCode?: unknown; command?: unknown };
  const fields: SendErrorFields = { errorName: shortText(source.name) ?? "Error" };
  const code = typeof source.code === "number" ? source.code : shortText(source.code);
  if (code !== undefined) fields.code = code;
  if (typeof source.responseCode === "number") fields.responseCode = source.responseCode;
  const command = shortText(source.command);
  if (command) fields.command = command;
  return fields;
}
