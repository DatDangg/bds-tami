/**
 * Chỉ sinh source map trình duyệt khi có token upload GlitchTip (`scripts/upload-sourcemaps.mjs` upload rồi xoá `.map`).
 * Không token (dev, CI thường, `pnpm build` cục bộ) thì không sinh: không có file `.map` nào để lộ qua `next start`.
 */
export function shouldEmitBrowserSourceMaps(env: Record<string, string | undefined>): boolean {
  return Boolean(env.GLITCHTIP_AUTH_TOKEN?.trim());
}
