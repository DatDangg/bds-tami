Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-2-task-05 · round 1

- Task: BL-054 P2-T05 — Liên hệ `/lien-he` theo design + Hệ thống văn phòng / Giờ làm việc + script `backfill:offices`
- Worktree: `.worktrees/feature-news-careers-contact-redesign__phase-2__task-05` (chưa commit, base f7936d4)
- Review level: **STRICT**
- Reason: form lead `source=contact` dùng chung (`LeadForm`, `LeadFormSlot`), component dùng chung (`LazyMap`), view model `site-settings` có fallback dữ liệu cũ, i18n xoá key, script ghi global `site-settings` (data write).
- Blast radius: `src/app/(frontend)/[locale]/lien-he/page.tsx`; `src/components/contact/*` (xoá `ContactDetails`, thêm `ContactCards`, `OfficeSystem`, `JoinTeamBanner`); `src/lib/content/contact-view.ts`; `src/lib/home/load-home.ts` (JSON-LD trang chủ); `LeadForm` (mọi nơi dùng: /tin-tuc, chi tiết dự án/cho thuê layout compact, /lien-he); `LeadFormSlot`; `LazyMap` (prop mới, mặc định giữ hành vi); `src/lib/backfill/report.ts` (tham số `prefix`, mặc định giữ tên cũ); `scripts/backfill-offices.ts` + `src/lib/backfill/offices.ts`; `vi.json`/`en.json` namespace `page.contact`.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `docker exec tami-postgres psql ... "select 1"` | OK (1) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm vitest run src/components/contact src/lib/content src/components/leads src/components/forms src/lib/backfill "src/app/(frontend)/[locale]/lien-he" src/lib/home src/components/media` | PASS — 37 file / 436 test |
| `DATABASE_URL_TEST=<DB worktree tami_wt54_p2t05> pnpm vitest run tests/integration/leads-public.test.ts` | PASS — 16/16 (POST lead public, gồm `source=contact`) |
| Read-only `select` trên `site_settings_offices` + `_locales` (DB worktree) | Hàng backfill `6ad98218…` có cùng id ở `vi` và `en` (VI "Văn phòng TAMI HOMES", EN "TAMI HOMES office"); xác nhận EN ghi cùng hàng, không nhân đôi |
| Báo cáo `docs/reports/backfill-offices-2026-10-22-1025-apply-2.md` | Lần `--apply` thứ 2 → "Bỏ qua — offices đã có 1 văn phòng" (idempotent) |
| `pnpm build` | Không chạy lại (builder báo PASS) — residual risk thấp, typecheck + lint PASS |

Không có integration test riêng cho global `site-settings`/backfill (Glob `tests/integration/**/*{site-settings,globals,offices,backfill}*` rỗng); hành vi ghi được chứng minh bằng unit test mock + truy vấn DB worktree ở trên.

## Kiểm trọng tâm

- **LeadForm `source=contact` / form khác**: layout `default` chỉ thêm wrapper `display: contents` quanh Họ tên/SĐT (không đổi khoảng cách flex), nhãn nút giữ `t("submit")` khi không có `submitLabel`, mũi tên chỉ hiện khi `layout !== "default"` (compact giữ như cũ). Test khoá tập key payload `["consent","fullName","locale","pageUrl","phone","source","turnstileToken"]` + `source: "contact"`. Integration `leads-public` PASS. OK.
- **Xoá 11 key i18n**: Grep `page.contact` chỉ còn `lien-he/page.tsx:45` (metadata `title`/`description`) và `load-page-banner.ts:19` (namespace mặc định hero) — 2 key này còn giữ. Không còn chỗ dùng key đã xoá; typecheck PASS. OK.
- **JSON-LD**: trang Liên hệ vẫn dùng `contact`/`socials` từ `buildContact`/`buildSocialLinks` (test giữ); `load-home.ts` gọi thẳng cùng 2 hàm → kết quả y hệt. OK.
- **/en**: `read-global.ts:13` đọc `fallbackLocale: false, depth: 1`; `buildOffices` bỏ hàng thiếu `name`/`address` → fallback dùng `address` EN (null nếu chưa dịch) + trường không localized; test `/en` khẳng định không có ký tự tiếng Việt. OK.
- **Link an toàn**: Zalo qua `buildFloatingContact` (chỉ http(s); test `javascript:` bị bỏ), `target="_blank" rel="noopener noreferrer"` ở Zalo / Chỉ đường; Chỉ đường `encodeURIComponent` (toạ độ `%2C`, địa chỉ `%20`); `tel:` qua `toTelHref`. OK.
- **Script**: guard `checkBackfillEnvironment` chạy trước `getPayload` (từ chối DB không phải dev cục bộ); chỉ ghi khi `offices` VI trống + có `address` VI; dry-run mặc định; tham số lạ → exit 1; context `TRANSLATION_JOB_CONTEXT_KEY` để không xếp job dịch; báo cáo không đè (`wx`), dry-run bị gitignore. OK.
- **A11y tabs**: `role=tablist` có `aria-label`, `tab` có `aria-selected`/`aria-controls`/roving `tabIndex`, ←/→ vòng + Home/End, `tabpanel` `aria-labelledby` tab đang chọn; 1 văn phòng → không tablist. Thẻ `ul aria-label="Kênh liên hệ"`, aria-label link hành động có giá trị cụ thể. OK.
- **Token màu**: chỉ dùng class token (`bg-surface`, `bg-primary-soft`, `text-accent-text`, `bg-dark-deep`, `bg-banner-scrim`…), không màu thô. OK.
- **So design `lien-he.webp`**: ảnh `bl054-p2t05-vi-3offices-1440.png` khớp bố cục (hero → 4 thẻ đè mép → form trái / văn phòng phải → banner Gia nhập). Khác biệt có chủ đích: không chip loại yêu cầu (Quyết định 6), không placeholder ví dụ (ghi trong task). Bản đồ xám do headless không WebGL (builder đã kiểm ở trình duyệt thật — không tự xác minh được, residual).

## Responsive Checklist Gate

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Builder đo `scrollWidth == innerWidth` ở 390/768/1440; ảnh 390 không tràn; tab `flex-wrap`, link dài `break-all`/`break-words`, `min-w-0` |
| Mobile-first (`min-width`) | OK | Chỉ dùng `sm:`/`md:`/`lg:` Tailwind (min-width) |
| Grid không cột cố định | OK | Thẻ: 1 cột → `sm:grid-cols-2` → `lg:grid-cols-N` (N = số thẻ, không ô trống); form/văn phòng 1 cột → `lg:grid-cols-2` chỉ khi có văn phòng. Breakpoint tường minh theo design-spec, không fixed px width |
| Container không fixed px | OK | `max-w-container px-gutter` |
| Typography rem/token | OK | `text-h2-sm`, `text-h3`, `text-h4`, `text-small`, `text-eyebrow` (token) |
| Spacing scale | OK (MINOR-2) | Token `py-section-tight`, gap scale; riêng `md:-mt-[88px]` là px tuỳ ý |
| Media | OK | `ResponsiveImage` có `sizes`; khung ảnh `aspect-[4/3]`; bản đồ `aspectRatio="16/9"` |
| Touch target ≥ 44px | OK | Tab, link hành động, Chỉ đường, link tel/mail `min-h-11` dưới lg (chỉ nhỏ lại ≥ lg) |
| Nav mobile | N/A | Không đổi header |
| Table | N/A | Không có bảng |
| 100vh | OK | Không dùng |
| prefers-reduced-motion | OK | Chỉ `transition-colors` ngắn; không animation mới |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` chỉ ở thẻ bo góc chứa ảnh |

## Skill gates

- aislop: skip, `aislop` not installed
- oxlint (anti-slop): skip, oxlint not configured (ESLint PASS 0 error)
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK — tên rõ (`buildOffices`, `directionsUrl`, `OfficeSystem`); hàm ngắn (`OfficeSystem` ~65 dòng gồm JSX, `renderOfficesReport` ~42); file đều < 300 dòng; `docs/DESIGN.md` + `.context/design-spec.md` cập nhật luồng mới. 0–1 indicator (magic `-mt-[88px]`) < 3
- ai-friendly-web: N/A (không đổi robots/sitemap/llms; trang đã public, không chặn crawler)
- blitzstrike: skip, không có môi trường được phép / không đổi endpoint

## Findings

### CRITICAL
- Không có.

### MAJOR
- Không có.

### MINOR
1. **Doc lệch code** — `.context/design-spec.md` khối As-built S15 ghi "icon tròn 56px" nhưng `src/components/contact/ContactCards.tsx:17` dùng `size-12` (48px). Fix: sửa doc thành 48px (hoặc `size-14` nếu muốn đúng design).
2. **Px tuỳ ý** — `src/app/(frontend)/[locale]/lien-he/page.tsx:232` `md:-mt-[88px]` gắn ngầm với phần chừa đáy của `PageHero overlap`; đổi một bên dễ lệch. Fix: dùng token/biến chung với `PageHero` (hoặc comment chỉ rõ cặp giá trị).
3. **Backfill lỗi nửa chừng** — `src/lib/backfill/offices.ts:60-61,103-110`: VI ghi xong mà EN lỗi thì lần chạy sau `skip-has-offices`, script không bao giờ bù EN. Đã ghi lỗi vào báo cáo; đề xuất thêm dòng "nhập EN tay trong admin" ở mục "Cần admin soát" khi `errors` có lỗi EN.
4. **Báo cáo apply của DB worktree** trong `docs/reports/` là dữ liệu thử do builder tự điền — primary quyết không commit 2 file này, chạy lại trên DB dev `tami` để có báo cáo thật (như task ghi).

## Residual risk
- Không chạy `pnpm build` và full integration suite (Postgres dùng chung tải cao); đã chạy `leads-public` integration liên quan.
- Bản đồ tương tác + đổi tab đổi bản đồ trên trình duyệt thật: chỉ có unit test (`OfficeSystem.test.tsx`) + lời builder; ảnh headless là ô xám.

## Verdict
**PASS** — không có CRITICAL/MAJOR; 4 MINOR không chặn.
