Agent: spec-validator

# Spec validation — feature-consult-popup-30s (BL-066) · phase 1 (phase review, round 1)

- Chế độ: **Phase review** (sau task phase-1-task-01 reviewer round 2 STRICT PASS)
- Nguồn: `spec/changes/2026-10-23-consult-popup-30s.md` (Acceptance + Ghi chú user chốt 2026-10-23) · `SPECIFICATIONS.md:187` (F9 khối Popup "Nhận tư vấn") · `tasks/feature-consult-popup-30s/phase-1-task-01.md` · code working tree (chưa commit) · `docs/API_SPEC.md:73-74,90` · `docs/ERD.md:480` · `docs/DESIGN.md` · review reports round 1/2.
- Không sửa source/spec. Không chạy lại verify command (dựa vào verification summary trong task + reviewer round 2).

## Verdict

**PASS** (phase review: chức năng **COMPLETE**, không có requirement MISSING; còn 4 gap MINOR về doc/spec-wording/evidence — xử lý ở close-out, không cần quay lại builder).

## Ma trận coverage

| # | Requirement (change doc / spec) | Code | Test | Status | Note |
|---|---|---|---|---|---|
| 1 | Tự mở sau 30s, hằng số trong code, không cấu hình admin | `src/components/leads/ConsultPopup.tsx:10` `POPUP_DELAY_MS = 30_000`; `:125-127` | `ConsultPopup.test.tsx:68-77` | ✅ | Không có field admin / global mới |
| 2 | Đếm theo phiên, chuyển trang không reset | `ConsultPopup.tsx:37-48` (mốc `tami.consultPopup.startedAt`), effect theo `pathname` `:114-133` | `:79-100` (mount lại + đổi pathname client) | ✅ | Mốc ghi từ lần vào đầu tiên kể cả /lien-he (`:115-117`) |
| 3 | Tối đa 1 lần/phiên (hiện/đóng/gửi → không lại); phiên mới hiện lại | `markShown()` ghi ngay khi mở `:50-57,120-124` | `:102-126` | ✅ | Xem G3 về ngữ nghĩa "phiên" = per-tab |
| 4 | sessionStorage lỗi → không hiện, không crash | `:45-47`, `:121` | `:232-250` (get + set lỗi) | ✅ | |
| 5 | Không hiện ở `/lien-he` (vi + en) | `CONTACT_PATHS = {"/lien-he","/en/contact"}` `:17,28-31`; khớp `src/i18n/routing.ts:39` (`en: "/contact"`, `localePrefix: "as-needed"` `:49`) | `:129-147` (gồm trailing slash, không đánh dấu shown, sang trang khác hiện ngay) | ✅ | |
| 6 | Không hiện ở `/admin` | Island chỉ gắn trong `PublicShell.tsx:44`; `PublicShell` chỉ dùng qua `PublicDocument` ở `app/(frontend)/[locale]/layout.tsx:44` + `app/global-not-found.tsx:18` | (cấu trúc) | ✅ | Admin Payload có layout riêng; 404 công khai có popup = đúng "mọi trang công khai" |
| 7 | Focus trong form khác → hoãn tới khi rời form | `formBeingTypedIn()` `:60-64`, `whenUnblocked()` `:72-99` | `:167-215` | ✅ | Build còn hoãn thêm khi **modal khác mở** và **đang nhấn chuột trong form** — spec chưa ghi (G2) |
| 8 | Lead đi đúng luồng hiện có, nguồn `popup` | `LeadForm source="popup"` `ConsultPopup.tsx:147`; `lead-values.ts:2,6-9` `hasSourceRecord`; zod `shared/types/api.ts:79,99-100`; endpoint `endpoints/public/leads.ts:119`; `dedupe.ts:35`; `create-or-merge.ts:69`; `LeadForm.tsx:44` | `ConsultPopup.test.tsx:296-312`; `endpoints/public/leads.test.ts:206-216`; `dedupe.test.ts:33-35`; `assign.test.ts:17`; `LeadForm.test.tsx` | ✅ | Consent/Turnstile/rate limit/dedupe 7 ngày/email/UTM tái dùng nguyên `LeadForm` + endpoint |
| 9 | Admin thấy "Popup tư vấn", lọc + xuất Excel | `collections/Leads.ts:20,62`; `lib/leads/export-filters.ts:82` (LEAD_SOURCES); `endpoints/admin/leads-export.ts:79`; `admin/dashboard/RecentLists.tsx:18` | `leads-form.test.ts` (theo task) | ✅ | Một nguồn `LEAD_SOURCES` → filter/export tự có |
| 10 | Migration additive `ADD VALUE IF NOT EXISTS`, down no-op | `migrations/20261023_020647_leads_source_popup.ts:4-12`; `migrations/index.ts:42,251-253`; `payload-types.ts:210` | integration `leads-migration` PASS (task) | ✅ | Đã chạy dev (task). Deploy: chạy migrate trước/cùng deploy |
| 11 | Đóng bằng ×, Esc, bấm nền; focus trap; trả focus; dialog có nhãn | Radix `Dialog` + `DialogTitle`/`DialogDescription` `:136-149`; `closeLabel`; trả focus thủ công `:140-143` | `:265-288` (Esc + trả focus, overlay, Tab trap) | ✅ | Nút × có trong test `:74` |
| 12 | Song ngữ vi/en | `i18n/messages/{vi,en}.json:154-158` `form.consultPopup` | `:290-294` | ✅ | |
| 13 | Responsive 390/768/1440; dark mode | `DialogContent className="max-w-md p-5 md:p-6"`, token (no-raw-colors PASS) | ảnh `assets/bl066-popup-1440.jpg`; đo 390 trong task | ⚠️ PARTIAL (evidence) | Không có evidence 768 và dark mode (G4) |
| 14 | Layout công khai vẫn SSG/ISR | `usePathname` only, không `useSearchParams`; `readTurnstileSiteKey()` server ở `PublicShell.tsx:24` | `pnpm build` route `●` không đổi (task) | ✅ | |
| 15 | Gửi thành công → cảm ơn trong dialog | `LeadForm` FormStatus | `:307-308` | ✅ | |
| 16 | Doc as-built API/ERD | `docs/API_SPEC.md:73-74,90`; `docs/ERD.md:480` | — | ✅ | |
| 17 | Doc as-built DESIGN (bảng component) | `docs/DESIGN.md` không đổi (git diff trống); bảng component có hàng `Lead Form` (`:272`), `Floating Contact` (`:274`), `Announcement Bar` (`:265`) nhưng không có ConsultPopup | — | ⚠️ PARTIAL | G1 (reviewer m2 còn mở) |

## Gap list

### [PARTIAL] G1 — `docs/DESIGN.md` thiếu hàng component Consult Popup — MINOR
- Requirement: Doc Impact & Reconcile (AGENTS.md) — kiến trúc/flow/current behavior → `docs/DESIGN.md`. Reviewer round 1/2 m2 vẫn để close-out.
- Hiện trạng: bảng component (`docs/DESIGN.md:265-274`) đã có Announcement Bar / Lead Form / Floating Contact; island mới gắn vào mọi trang công khai chưa có hàng.
- Đề xuất (close-out, as-built): thêm hàng "Consult Popup" — island client trong `PublicShell`, 30s/phiên sessionStorage, loại trừ `/lien-he` + `/en/contact`, hoãn khi đang nhập form / modal khác mở, `LeadForm` compact nguồn `popup`, dialog `max-w-md`, trả focus thủ công.

### [PARTIAL] G2 — Spec F9 chưa ghi đủ hành vi hoãn đã build — MINOR
- `SPECIFICATIONS.md:187` chỉ nêu "focus đang ở trong một form khác (ô nhập trong `<form>`) → hoãn tới khi focus rời form".
- Code còn hoãn khi: (a) có `[role=dialog][aria-modal=true]` hoặc `[role=dialog][data-state=open]` đang mở (lightbox, menu mobile, Radix Popover) — `ConsultPopup.tsx:18,81`; (b) đang nhấn chuột trong form đó — `:73-79`; (c) "rời form" = focus ra khỏi **toàn bộ** form (Tab sang nút gửi/Turnstile cùng form vẫn tính là trong form) — `:81`; (d) tới mốc lúc đang ở `/lien-he` → không đánh dấu shown, sang trang khác hiện ngay — `:115-117`, test `:138-147`.
- Không mâu thuẫn intent (chỉ chặt hơn, hợp với acceptance a11y/"không chồng modal"), nhưng test-scope sinh từ spec sẽ thiếu các case này.
- Đề xuất: change-request bổ sung 1-2 câu vào khối BL-066 trước khi chạy spec-publisher (cùng change đã được user duyệt, chỉ làm rõ hành vi).

### [PARTIAL] G3 — Ngữ nghĩa "phiên trình duyệt" thực tế là theo tab — MINOR (cần làm rõ trong spec)
- Change doc (Ghi chú) + spec: "đóng hết tab rồi vào lại → hiện lại". `sessionStorage` là **theo tab**: mở site ở tab mới (không phải duplicate tab) = phiên mới → popup có thể hiện thêm lần nữa trong cùng "lượt truy cập" nhiều tab. Reviewer round 1 đã ghi residual "sessionStorage theo tab".
- User đã chốt rõ cơ chế `sessionStorage` nên build đúng quyết định; chỉ cần spec ghi đúng ("mỗi tab/phiên `sessionStorage`; mở tab mới đếm lại") để QA/test-scope không coi là bug. Nếu user muốn "1 lần cho mọi tab" thì là change mới (cookie phiên/localStorage) — không tự thêm.

### [PARTIAL] G4 — Thiếu evidence 768px và dark mode — MINOR
- Acceptance "responsive 390 / 768 / 1440; dark mode". Có ảnh 1440 (`.context/review-reports/assets/bl066-popup-1440.jpg`) + số đo 390 (task); không có ảnh/đo 768 và dark mode. Token-only được bảo đảm bởi test `no-raw-colors`, nên rủi ro thấp.
- Đề xuất: close-out chụp bổ sung 768 + dark (hoặc ghi `Residual risk` trong task).

## Ghi chú quy trình (không tính gap)
- `spec_version`/`spec/updates/`/`spec/CHANGELOG.md`/`spec/test-scope/current.json` chưa có BL-066 (grep `spec/` chỉ thấy `BACKLOG.md`). Theo tiền lệ BL-064, spec-publisher chạy ở close-out — nhớ chạy **sau** khi sửa G2/G3 để test-scope đủ case.
- Reviewer round 2 MINOR m3 (test cleanup khi đang hoãn), m4 (export `RECHECK_MS`), m5 (`pointerInForm` kẹt) — tuỳ chọn, không ảnh hưởng spec.
- `pnpm lint` FAIL do file untracked ngoài scope (`.local-seed/seed-sample-project-blocks.ts`) — ghi residual ở close-out; file đổi của task lint 0 lỗi.
- Template email `new-lead` không hiển thị nhãn nguồn (`src/lib/email/templates` không tham chiếu `source`) → không cần nhãn `popup` ở email.

## Residual risk
- Chưa kiểm browser thật (Safari pointer, Turnstile iframe trong dialog, chồng z-index với CookieBanner/FloatingDock ở 390) ngoài ảnh 1440 + đo 390.
- `TURNSTILE_SITE_KEY` được đọc lúc dựng trang (SSG) — đổi key cần rebuild (giống trang Liên hệ).
- Migration enum phải chạy trên staging/prod trước khi deploy code nhận `source: "popup"` (không thì zod nhận nhưng insert lỗi 500).
