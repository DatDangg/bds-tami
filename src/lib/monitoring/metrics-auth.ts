import { createHash, timingSafeEqual } from "node:crypto";

/** So token Bearer theo thời gian hằng: băm SHA-256 hai phía để độ dài bằng nhau rồi `timingSafeEqual`. */
export function isValidMetricsToken(authorizationHeader: string | null, expectedToken: string): boolean {
  const match = /^Bearer (.+)$/.exec(authorizationHeader ?? "");
  if (!match?.[1]) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(match[1]), digest(expectedToken));
}
