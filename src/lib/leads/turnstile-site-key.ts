/** Site key Turnstile (công khai, không phải secret) cho form lead; đọc ở Server Component rồi truyền xuống client island. Thiếu thì `undefined`. */
export function readTurnstileSiteKey(): string | undefined {
  return process.env.TURNSTILE_SITE_KEY?.trim() || undefined;
}
