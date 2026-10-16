Agent: reviewer

# Review — build-tami-website layer-1-task-03 (next-intl routing + proxy.ts + format Intl) — round 2

- **Review level:** STRICT
- **Reason:** proxy/navigation dùng chung cho mọi trang công khai, cache CDN theo URL, redirect 301, dependency mới (next-intl@4.14.9). Round 1 FAIL vì M1 (SEO/CDN).
- **Blast radius:** không đổi so với round 1 — `src/proxy.ts`, `src/i18n/{routing,navigation,request,localeCookie}.ts`, `src/i18n/messages/*`, `src/app/(frontend)/[locale]/layout.tsx`, `next.config.ts`, `vitest.config.ts`, `src/lib/format.ts`, `docs/ARCHITECTURE.md`, lockfile. Thay đổi round 2: `src/i18n/routing.ts` (+`alternateLinks: false`), `tests/integration/proxy.test.ts` (+1 test), task files `layer-1-task-03.md`, `layer-1-task-05.md`, `layer-5-task-05.md`.

## Verify commands + result (reviewer tự chạy)
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 8 files, 78 tests (round 1: 77; +1 test header `link`) |
| `pnpm build` | PASS — `/[locale]` SSG `/vi`, `/en`; `ƒ Proxy (Middleware)` |
| `git status` sau build | Không file lạ ngoài manifest |

## Kiểm fix round 1
- **M1 — đã sửa đúng.** `src/i18n/routing.ts:57` `alternateLinks: false`. Đọc next-intl 4.14.9: `routing/config.js:7` `alternateLinks: input.alternateLinks ?? true` → `false` được giữ nguyên (không bị `??` ghi đè); `middleware/middleware.js:159` là nơi duy nhất gắn header `Link`, điều kiện `&& resolvedRouting.alternateLinks` → tắt hẳn. Test `tests/integration/proxy.test.ts:23-27` assert `link` null cho `/`, `/en`, `/du-an/abc`, `/en/projects/abc` (cả 2 locale, trang tĩnh + chi tiết). Comment WHY rõ ràng.
- **m2 — xử lý hợp lý.** Decision ghi ở `tasks/tami-website/layer-1-task-03.md` (§ Decision review round 1); follow-up `layer-5-task-05.md` giao `LanguageSwitcher` gọi `buildLocaleCookie`, cấm dùng cookie để redirect `/` (đúng F12/D6), đổi hành vi phải qua Change Request. Không đổi intent doc.
- **m3 —** ràng buộc “slug không chứa `.`” + test đã giao `layer-1-task-05.md`. OK.
- **m4 — đã sửa.** Task file dòng 17 ghi Doc impact `docs/ARCHITECTURE.md` (§4, §5.1); khớp diff ARCHITECTURE.
- **Regression:** các test round 1 (không redirect theo Accept-Language/cookie, `/vi/*` 301, chuẩn hoá `/en/du-an` → `/en/projects`, matcher, không Set-Cookie) vẫn PASS; build/Proxy vẫn nhận diện.

## Findings
- [CRITICAL] — không có.
- [MAJOR] — không có.
- [MINOR] m5 — `tasks/tami-website/layer-1-task-03.md:67` “Doc impact result: pending (dự kiến …)”: điền kết quả thật khi close-out (bước 5e), không chặn.

## Responsive Checklist Gate
Round 2 không đụng UI/CSS. `layout.tsx` (round 1) chỉ đổi `<html lang>` + provider.
- Layout: N/A · Typography/Spacing: N/A · Media: N/A · Touch/Interaction: N/A · Viewport/A11y: N/A (không đổi markup/CSS hiển thị).

## Skill gates
- aislop: skip — không nằm trong verify commands được allow.
- oxlint (anti-slop): skip, oxlint not configured; ESLint PASS.
- ocr: skip, ocr not installed / không trong allow list.
- AI-readable: OK — 0 indicator (diff round 2 chỉ 1 option + 1 test, comment WHY).
- ai-friendly-web: N/A — task hạ tầng routing, chưa có trang công khai.
- blitzstrike: skip — không có môi trường được phép.

## Residual risk
- Như round 1: 301 bị cache vĩnh viễn → đổi `pathnames` sau go-live phải giữ redirect chuyển tiếp.
- hreflang hiện chưa có ở đâu cho tới task SEO (F11) — chủ đích, đã ghi Decision.
- Không chạy server thật; xác minh qua integration test gọi `proxy()` + đọc mã next-intl.

## Verdict: PASS
Không còn CRITICAL/MAJOR. M1 fix đúng + có test; m2/m3/m4 xử lý hợp lý; không regression.
