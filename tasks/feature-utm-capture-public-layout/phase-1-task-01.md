# feature-utm-capture-public-layout · phase-1-task-01 — ghi UTM ở mọi trang công khai (island client ở khung trang)

- Change doc: `spec/changes/2026-10-19-utm-capture-public-layout.md` (BACKLOG BL-010)
- Nguồn: review L10-T01 round 1 MINOR-2
- Spec: `SPECIFICATIONS.md` F9 (câu UTM mới), `.context/design-spec.md` §3.3 "Gửi kèm ẩn", BR-10

## Classification / Risk
- Type: **MODIFY** (đổi nơi ghi UTM: từ LeadForm mount → mọi trang công khai)
- Risk: **LOW-MEDIUM** — chạm khung trang dùng chung (`PublicShell`, mọi trang công khai VI/EN + 404) nhưng chỉ thêm 1 client island không render gì; không đổi API/schema; không được làm layout thành dynamic (không đọc `searchParams`/`headers` ở server, không `useSearchParams` gây CSR bailout).

## Hiện trạng (đọc code)
- `src/lib/leads/utm.ts`: `parseUtmFromSearch`, `captureUtm(search)` (URL có UTM → ghi đè `sessionStorage["tami.utm"]`, storage lỗi → bỏ qua), `readUtm(search)` (ưu tiên URL, rồi bản lưu; lỗi → undefined).
- `src/components/leads/LeadForm.tsx:49` `useEffect(() => captureUtm(), [])` — chỉ chạy khi trang có form.
- `src/components/layout/PublicShell.tsx` (server component; BL-001 vừa sửa ở be33577/28e7190 — header/footer props) được `PublicDocument` dùng cho `[locale]/layout.tsx` + `app/not-found.tsx`.
- Form khác: `ApplyForm` (tuyển dụng) và `usePublicForm` KHÔNG dùng UTM (job application không có trường utm — API_SPEC); chỉ LeadForm → nguồn thống nhất là `src/lib/leads/utm.ts`.

## Thiết kế (gợi ý — builder chốt theo code thật)
- Component client mới (vd `src/components/leads/UtmCapture.tsx`, `"use client"`, `return null`): gọi `captureUtm()` khi mount và khi `usePathname()` đổi (soft navigation tới URL có `utm_*`); KHÔNG dùng `useSearchParams` (bắt Suspense/CSR bailout). Đọc `window.location.search` trong effect.
- Gắn vào `PublicShell` (1 dòng, giữ nguyên thay đổi BL-001).
- LeadForm: bỏ `captureUtm` khi mount (đã có island) hoặc giữ — builder chọn; `readUtm()` lúc gửi giữ nguyên (ưu tiên URL hiện tại → bản lưu).
- Test: unit component island (URL có/không UTM, storage throw không crash, đổi pathname), test PublicShell render có island, test LeadForm: UTM lưu từ trang không có form rồi gửi ở trang có form.

## Acceptance
- [ ] Vào bất kỳ trang công khai (VI/EN) có `utm_*` → lưu vào sessionStorage (giữ quy tắc ghi đè hiện có)
- [ ] Sang trang khác có LeadForm → lead gửi kèm UTM đã lưu
- [ ] URL không có `utm_*` → không ghi; không phá static/caching của layout (island client nhỏ)
- [ ] sessionStorage không khả dụng → không crash
- [ ] Test; `pnpm test`/lint/typecheck/build PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary

**Thiết kế chốt (builder):**
- Mới `src/components/leads/UtmCapture.tsx` (`"use client"`, `return null`): `usePathname()` + `useEffect(() => captureUtm(window.location.search), [pathname])`. Không `useSearchParams`, không đọc `searchParams`/`headers` ở server → layout giữ nguyên static/ISR.
- `src/components/layout/PublicShell.tsx`: thêm `<UtmCapture />` (đặt đầu fragment, trước `SkipLink`; render `null` nên skip link vẫn là phần tử tương tác đầu tiên) + 1 dòng doc comment. Không đụng thay đổi BL-001 (header/footer props).
- `src/components/leads/LeadForm.tsx`: **bỏ** `useEffect(() => captureUtm(), [])` (và import `useEffect`/`captureUtm`). Lý do: mọi chỗ dùng `LeadForm` (lien-he, ProjectDetail, PostDetail, SaleContactBox) đều nằm trong `PublicShell` nên island đã ghi; giữ lại chỉ là ghi 2 lần cùng giá trị. `readUtm()` lúc gửi giữ nguyên (ưu tiên URL hiện tại → bản lưu) nên form trên trang có UTM vẫn gửi đúng.
- `src/lib/leads/utm.ts`: chỉ sửa doc comment của `captureUtm` ("gọi khi form hiện" → "gọi ở mọi trang công khai"). Logic giữ nguyên — `window.sessionStorage` getter nằm trong `try` nên getter throw cũng được nuốt (có test).

**Test (TDD — viết trước, chạy FAIL rồi mới code):**
- Mới `src/components/leads/UtmCapture.test.tsx` (6 case): render rỗng; URL có UTM → lưu; không UTM → không ghi/không xoá bản cũ; đổi pathname tới URL có UTM mới → ghi đè, sang trang không UTM giữ bản mới nhất; `setItem` throw không crash; `window.sessionStorage` getter throw không crash.
- `src/components/layout/PublicShell.test.tsx`: +1 case "có island ghi UTM" (render shell ở `/?utm_source=...` → `sessionStorage['tami.utm']` đúng).
- `src/components/leads/LeadForm.test.tsx`: case cũ "UTM trong URL được gửi kèm; vào trang khác vẫn còn" (dựa vào LeadForm tự capture) tách thành 3 case phản ánh luồng mới: (a) UTM trên URL trang có form được gửi, ưu tiên hơn bản lưu; (b) UTM lưu từ trang KHÔNG có form qua `UtmCapture` → LeadForm ở trang khác gửi kèm; (c) LeadForm mount ở URL có UTM không tự ghi sessionStorage.
- Trước fix: `UtmCapture.test.tsx` + `LeadForm.test.tsx` fail import (module chưa có), PublicShell case mới FAIL (`null` ≠ utm). Sau fix: 3 file / 29 test PASS.

**Verify commands (`.context/project-config.md`):**
- `pnpm lint` → PASS (exit 0)
- `pnpm typecheck` → PASS (exit 0)
- `pnpm test` → 230/231 file, 2456/2457 test PASS; 1 FAIL duy nhất là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" — fail sẵn, phụ thuộc ngày, không liên quan task.
- `pnpm build` → PASS (exit 0). Route table: `/[locale]` và mọi trang con (`cho-thue`, `du-an`, `lien-he`, `tin-tuc`, `tuyen-dung`, `[slug]`…) vẫn `●` SSG/ISR. 3 route `ƒ` (`cho-thue|tin-bds|tin-tuc/danh-muc/[category]`) là pre-existing `export const dynamic = "force-dynamic"` (phân trang `searchParams`), không do thay đổi này.
- `npx oxlint`: skip — repo không có oxlint config (lint = eslint).

**Responsive/UI:** không đổi DOM/CSS (island render `null`) → checklist responsive không áp dụng.
**Doc impact (gợi ý cho close-out):** không đổi API/schema; behavior "UTM ghi ở mọi trang công khai" đã mô tả trong spec delta (`SPECIFICATIONS.md` F9, design-spec §3.3) do change-request cập nhật — builder không sửa thêm doc.

## Doc impact / Reconcile
- Intent (qua change request BL-010): `SPECIFICATIONS.md` F9 (câu UTM ghi ở mọi trang công khai), `.context/design-spec.md` §3.3 "Gửi kèm ẩn".
- As-built: no doc impact — không đổi API contract (`docs/API_SPEC.md` §3.1 `utm` giữ nguyên), schema/ERD, kiến trúc.
- Spec publish: spec_version 1.4.1 → 1.5.0 (MINOR), `spec/updates/2026-10-19-utm-capture-public-layout.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` scopeVersion 5 (trigger feature-update).

## Review
- STRICT PASS round 1 — `.context/review-reports/feature-utm-capture-public-layout-phase-1-task-01-round-1-review.md` (0 CRITICAL/MAJOR, 2 MINOR: #1 đổi query cùng pathname không capture lại — đánh đổi có chủ đích, ghi residual risk; #2 test LeadForm dựa `usePathname` trả null ngoài router — tuỳ chọn, chưa sửa).
- Reviewer: lint/typecheck PASS, `pnpm test` 2456/1 fail pre-existing; build theo builder (route `[locale]` vẫn ISR).

## Residual risk
- Soft navigation chỉ đổi query (cùng pathname) sang URL có `utm_*` không được island ghi lại; lúc gửi form vẫn đọc UTM của URL hiện tại nên chỉ mất nếu khách rời trang đó trước khi gửi (hiếm: link quảng cáo luôn là lượt tải cứng).
- Test LeadForm "UTM lưu từ trang không có form" render island ngoài router (dựa `usePathname` = null) — có thể cần mock nếu nâng Next.
- Chưa thử trên browser thật (dựa jsdom + build).
