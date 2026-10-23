# feature-consult-popup-30s · phase-1-task-01 — popup "Nhận tư vấn" tự hiện sau 30s (mọi trang công khai, 1 lần / phiên)

- Change doc: `spec/changes/2026-10-23-consult-popup-30s.md` (BACKLOG BL-066)
- Spec: `SPECIFICATIONS.md` F9 — khối **Popup "Nhận tư vấn" (BL-066)** (đọc kỹ, là nguồn yêu cầu)

## Classification / Risk
- Type: **ADDITIVE**
- Risk: **MEDIUM** → review **STRICT** — đụng DB schema (enum `enum_leads_source` thêm `popup`, migration additive), API contract (`POST /api/public/leads` nhận `source: "popup"`), khung trang dùng chung `PublicShell` (mọi trang công khai VI/EN), form lead công khai (Turnstile / rate limit / consent).

## Hiện trạng (đọc code)
- `src/lib/leads/lead-values.ts:2` `LEAD_SOURCES = ["rental","property_post","project","contact"]` — nguồn duy nhất cho select, zod (`src/shared/types/api.ts:79`), lọc xuất Excel (`src/lib/leads/export-filters.ts:82`).
- `src/collections/Leads.ts:20` `SOURCE_LABELS` (dùng ở `src/components/admin/dashboard/RecentLists.tsx`, `src/endpoints/admin/leads-export.ts`).
- Postgres enum `enum_leads_source` tạo ở `migrations/20261018_094454_leads.ts`. Tiền lệ ADD VALUE: `migrations/20261018_140000_translate_content.ts` (ADD VALUE IF NOT EXISTS, down no-op có comment). Có test `tests/integration/leads-migration.test.ts`.
- `src/endpoints/public/leads.ts:119` chỉ bỏ tra bản ghi nguồn khi `source === "contact"`; `LeadForm.buildLeadExtra` (`src/components/leads/LeadForm.tsx:44`) chỉ bỏ `sourceId` khi `contact`. Kiểm thêm schema zod `sourceId` bắt buộc trừ `contact` (`src/shared/types/api.ts`), auto-assign (`src/lib/leads/assign.ts`), dedupe (`dedupe.ts`) để `popup` đi như `contact` (không bản ghi nguồn, admin giao).
- `src/components/layout/PublicShell.tsx` — khung mọi trang công khai (+ 404), island client mẫu: `UtmCapture`, `CookieBanner`, `BackToTop`. Dialog sẵn có: `src/components/ui/dialog.tsx` (có test). Trang Liên hệ: `src/app/(frontend)/[locale]/lien-he/page.tsx` (xem cách lấy `turnstileSiteKey`, `hotline` cho `LeadForm`; xem pathname EN của trang liên hệ trong routing/i18n).
- Messages i18n vi/en (namespace `form.lead`, …).

## Thiết kế (gợi ý — builder chốt theo code thật, giữ đơn giản)
1. **Schema:** thêm `"popup"` vào `LEAD_SOURCES`, nhãn `"Popup tư vấn"` trong `SOURCE_LABELS`; migration mới `pnpm payload migrate:create` (tên vd `leads_source_popup`) chỉ `ALTER TYPE "public"."enum_leads_source" ADD VALUE IF NOT EXISTS 'popup';` down no-op + comment (theo tiền lệ). Đăng ký trong `migrations/index.ts`. Kiểm snapshot `.json` sinh ra KHÔNG chứa thay đổi lạ ngoài enum (nếu có drift khác → dừng, báo). Chạy `pnpm payload migrate` trên DB dev.
2. **API:** `popup` xử lý như `contact` ở endpoint (không `sourceId`, không tra bản ghi, không tự giao), zod, `buildLeadExtra`. Chống trùng 7 ngày theo (SĐT, `popup`) như hiện có.
3. **Island `ConsultPopup`** (client, vd `src/components/leads/ConsultPopup.tsx`) gắn vào `PublicShell`:
   - Hằng `POPUP_DELAY_MS = 30_000`. Đếm theo phiên: lưu mốc bắt đầu phiên (vd `sessionStorage["tami.consultPopup.startedAt"]`) lần đầu vào site; mỗi trang tính thời gian còn lại = 30s − (now − startedAt) → chuyển trang không reset. Cờ đã hiện (`…shown`) → không hiện lại trong phiên. Ghi cờ ngay khi mở popup (đóng/gửi đều không hiện lại).
   - `sessionStorage` lỗi/không có → không hiện, không crash.
   - Không hiện ở trang Liên hệ (vi + en; dùng `usePathname`, không `useSearchParams`, không làm layout dynamic). Nếu khách đang ở /lien-he lúc tới mốc → không hiện ở đó; sang trang khác thì hiện (chưa đánh dấu shown).
   - Tới mốc mà `document.activeElement` nằm trong một `<form>` (không phải popup) → hoãn: nghe `focusout`/`focusin` và mở khi focus rời form.
   - Dialog: dùng `src/components/ui/dialog.tsx` (focus trap, Esc, bấm nền, trả focus, `aria-labelledby` tiêu đề). Nội dung: tiêu đề + mô tả ngắn + `<LeadForm source="popup" layout="compact" … />`, nút × có `aria-label`. Gửi thành công → `FormStatus` cảm ơn trong dialog. Kích thước responsive (390 full-width gần mép, 768/1440 max-w hợp lý, cuộn được nếu cao hơn màn), dark mode theo token (không màu raw — có test `no-raw-colors`).
   - Không đụng z-index chồng sai với CookieBanner / FloatingDock (dialog modal ở trên cùng).
   - `turnstileSiteKey` / `hotline`: lấy như trang Liên hệ đang lấy (truyền từ shell data nếu cần; không làm layout dynamic).
4. **i18n:** key mới vi/en (tiêu đề, mô tả, nhãn đóng).
5. **Doc as-built:** `docs/API_SPEC.md` §3.1 bảng `source` thêm `popup` + câu as-built (sourceId bỏ qua như `contact`); `docs/ERD.md` enum `leads.source` nếu có liệt kê.

## Acceptance
- [ ] Popup tự mở sau 30s trên site, đếm theo phiên (chuyển trang không reset)
- [ ] Tối đa 1 lần / phiên (sessionStorage); phiên mới → lại hiện sau 30s
- [ ] Không hiện ở `/admin`, `/lien-he` (vi + en)
- [ ] Focus đang trong form khác → hoãn tới khi rời form
- [ ] Lead gửi qua `POST /api/public/leads` với `source: "popup"` (consent, Turnstile, rate limit, dedupe, email như cũ); admin thấy nguồn "Popup tư vấn", lọc + xuất Excel được
- [ ] Đóng bằng ×, Esc, bấm nền; focus trap + trả focus; dialog có nhãn
- [ ] Song ngữ vi/en; responsive 390/768/1440; dark mode
- [ ] Layout công khai vẫn SSG/ISR (route table `pnpm build` không đổi `●` → `ƒ`)
- [ ] Migration additive, versioned, đã chạy dev; test (unit island: timer/phiên/shown/lien-he/hoãn form/storage lỗi; endpoint `popup`; zod) ; lint/typecheck/test/build PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
**Thiết kế chốt**
- `LEAD_SOURCES` thêm `popup`; helper `hasSourceRecord(source)` + kiểu `LeadSourceWithRecord` (`src/lib/leads/lead-values.ts`) thay mọi so sánh `=== "contact"` (zod refine/transform `src/shared/types/api.ts`, `dedupe.ts`, `create-or-merge.ts`, endpoint `isPublicSource`, `LeadForm.buildLeadExtra`) để `popup` đi như `contact`; `SOURCE_LABELS.popup = "Popup tư vấn"`. `assign.ts` không đổi (chỉ rental/property_post tự giao).
- Migration `migrations/20261023_020647_leads_source_popup.ts` (+ `.json` snapshot: chỉ thêm `"popup"` vào enum `enum_leads_source` + id/prevId), `ADD VALUE IF NOT EXISTS`, down no-op có comment; đăng ký `migrations/index.ts`; đã `pnpm payload migrate` trên DB dev (khởi động lại container `tami-postgres/redis/seaweedfs` đang tắt). `src/payload-types.ts` regen: chỉ thêm `'popup'`.
- `src/components/leads/ConsultPopup.tsx` (client island, gắn cuối `PublicShell`; `turnstileSiteKey` đọc bằng `readTurnstileSiteKey()` ở server trong `PublicShell`, `hotline` = `shell.contact.hotline`). `usePathname` của `next/navigation` (đường dẫn thật `/lien-he`, `/en/contact`; không `useSearchParams`). Mốc phiên `sessionStorage["tami.consultPopup.startedAt"]` ghi từ lần vào site đầu tiên KỂ CẢ khi đó là /lien-he; cờ `…shown` ghi ngay khi mở; mọi lỗi storage (get/set) → không hiện. Hoãn khi `activeElement` là ô nhập trong `<form>`: nghe `focusout` rồi kiểm lại sau `setTimeout 0`. Radix Dialog không có Trigger nên tự nhớ phần tử đang focus lúc mở và trả focus ở `onCloseAutoFocus`.
- i18n `form.consultPopup.{title,description,close}` vi/en.

**Test (viết trước, đều PASS)**: `ConsultPopup.test.tsx` (18: 30s/phiên/chuyển trang mount lại + đổi pathname/shown/phiên mới/lien-he vi+en+slash/không đánh dấu shown/hoãn form/storage get+set lỗi/Esc + trả focus/bấm nền/bẫy Tab/EN/gửi source=popup không sourceId + cảm ơn); `LeadForm.test.tsx` thêm `popup`; `leads.test.ts` (endpoint+zod: popup không cần sourceId, bỏ qua nếu có, không tra nguồn); `dedupe.test.ts`, `assign.test.ts`, `leads-form.test.ts` (nhãn + option select).

**Verify** (theo `.context/project-config.md`):
- `pnpm typecheck`: PASS. `pnpm test`: 427 file / 4469 test PASS (gồm integration leads-migration, no-raw-colors).
- `pnpm build`: PASS; route `[locale]` vẫn `●` (`/[locale]`, `/lien-he`, `/du-an`, `/du-an/[slug]`…); các `ƒ` còn lại (`danh-muc/[category]`…) là có sẵn, không đổi.
- `pnpm lint`: FAIL do 4 error `no-explicit-any` ở `.local-seed/seed-sample-project-blocks.ts` (file untracked có sẵn, ngoài scope) + 2 warning `tools/task-dashboard/server.mjs`; `eslint` trên các file đổi/mới: 0 lỗi.
- Dev server: popup mở thật ở `/du-an` (1440 và 390: dialog 16→374px, nằm trọn trong 800px cao, `scrollWidth` = 390), ảnh `.context/review-reports/assets/bl066-popup-1440.jpg`.

**File đổi**: `src/lib/leads/lead-values.ts`, `src/collections/Leads.ts`, `src/shared/types/api.ts`, `src/lib/leads/dedupe.ts`, `src/lib/leads/create-or-merge.ts`, `src/endpoints/public/leads.ts`, `src/components/leads/LeadForm.tsx`, `src/components/layout/PublicShell.tsx`, `src/i18n/messages/{vi,en}.json`, `migrations/index.ts`, `src/payload-types.ts`, `docs/API_SPEC.md`, `docs/ERD.md`, tests (`LeadForm.test.tsx`, `leads.test.ts`, `dedupe.test.ts`, `assign.test.ts`, `leads-form.test.ts`). **Mới**: `src/components/leads/ConsultPopup.tsx`, `ConsultPopup.test.tsx`, `migrations/20261023_020647_leads_source_popup.{ts,json}`, ảnh bl066.
**Gợi ý doc impact**: `docs/API_SPEC.md` §3.1 (đã sửa), `docs/ERD.md` enum `leads.source` (đã sửa); `docs/DESIGN.md` nếu có mục PublicShell/island; runbook deploy: migration additive, chạy trước/cùng deploy.

**Fix r1 (reviewer STRICT round 1)**
- M1: hoãn hiện nay nhớ `<form>` đang chứa ô nhập có focus (`formBeingTypedIn`) và chỉ mở khi `!form.contains(document.activeElement)`: Tab/click sang nút gửi hoặc Turnstile cùng form vẫn bị chặn. Thêm chặn khi đang nhấn chuột trong form (`pointerdown` trong form → tới `pointerup`/`pointercancel`) cho Safari không focus nút.
- m1: không mở chồng khi DOM có `[role="dialog"][aria-modal="true"]` hoặc `[role="dialog"][data-state="open"]`; hoãn tới khi đóng.
- Cách làm: một hàm `whenUnblocked(form, onClear)` kiểm ngay rồi poll 250ms (`RECHECK_MS`) thay cho `whenFormFocusLeft` (ít code hơn nghe nhiều sự kiện; trễ tối đa 250ms). Áp dụng cả khi tới mốc mà đang không ở form (chỉ còn điều kiện modal).
- Test mới (`ConsultPopup.test.tsx`, 21 test, test viết trước): Tab sang nút gửi cùng form vẫn đóng, blur hẳn mới mở; pointerdown trong form chặn tới pointerup; modal khác đang mở thì chờ; test hoãn cũ đổi sang chuyển focus ra nút ngoài form.
- Verify lại: `eslint src/components/leads` 0 lỗi, `pnpm typecheck` PASS, `pnpm test` 427 file / 4472 test PASS, `pnpm build` PASS.

## Doc impact / Reconcile
- Intent (qua change request BL-066, user duyệt): `SPECIFICATIONS.md` F9 khối Popup "Nhận tư vấn" (BL-066) — làm rõ thêm sau spec-validation G2/G3 (hoãn tới khi rời hẳn form / modal khác đóng; phiên theo tab; mốc 30s ở trang Liên hệ).
- As-built: `docs/API_SPEC.md` §3.1 (`source` thêm `popup`, `sourceId` bỏ qua như `contact`), `docs/ERD.md` (enum `leads.source`), `docs/DESIGN.md` bảng component (dòng Popup Nhận tư vấn).
- Migration: `migrations/20261023_020647_leads_source_popup` additive (`ADD VALUE IF NOT EXISTS`, down no-op) — không HIGH_RISK; phải chạy `pnpm payload migrate` trên staging/prod TRƯỚC khi deploy code.
- Spec publish: spec_version 1.54.0 → 1.55.0 (MINOR), `spec/updates/2026-10-23-consult-popup-30s.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` scopeVersion 71 (v70 → `spec/test-scope/archive/test-scope-1.54.0-70.json`).

## Review
- STRICT FAIL round 1 — `.context/review-reports/feature-consult-popup-30s-phase-1-task-01-round-1-review.md` (M1: hoãn chỉ theo ô text → popup mở khi Tab/click sang nút gửi cùng form, nuốt click; m1 chồng modal khác; m2 DESIGN.md).
- STRICT PASS round 2 — `.context/review-reports/feature-consult-popup-30s-phase-1-task-01-round-2-review.md` (0 CRITICAL/MAJOR; MINOR m3 thiếu test cleanup khi đang hoãn, m4 test lặp hằng RECHECK_MS, m5 pointerInForm có thể kẹt nếu nhả chuột ngoài cửa sổ — không sửa).
- Spec-validation phase 1 PASS — `.context/review-reports/spec-validation-feature-consult-popup-30s-phase-1.md` (G1 DESIGN.md đã thêm, G2/G3 spec đã làm rõ, G4 → residual).

## Residual risk
- Chưa kiểm trên browser thật ở 768 và dark mode (chỉ ảnh 1440 + đo 390 bằng getBoundingClientRect; màu theo token có test no-raw-colors); nhánh pointerdown Safari / cảm ứng chỉ test jsdom.
- `TURNSTILE_SITE_KEY` đọc lúc build/ISR ở `PublicShell` (giống trang Liên hệ) — build thiếu biến → form popup báo lỗi xác minh.
- Migration enum chưa chạy staging/prod: deploy code trước migrate → lead popup qua zod nhưng 500 khi ghi DB.
- `pnpm lint` toàn repo FAIL do file ngoài scope (`.local-seed/seed-sample-project-blocks.ts` no-explicit-any, `tools/task-dashboard/server.mjs` warnings); file thuộc task eslint 0 lỗi.
- MINOR m3/m4/m5 reviewer r2 chưa xử lý.
