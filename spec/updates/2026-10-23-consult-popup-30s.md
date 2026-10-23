# Spec Update — 2026-10-23 consult-popup-30s

**spec_version:** 1.54.0 → 1.55.0 (MINOR — thêm popup "Nhận tư vấn" tự hiện sau 30 giây; thêm nguồn lead `popup`)
**Trigger:** feature-update (BL-066, change-request class ADDITIVE)
**Work item:** `feature/consult-popup-30s` phase 1 · T01 STRICT FAIL r1 (M1: hoãn khi focus trong form) → PASS r2 · spec-validator phase 1 PASS · commit: chưa (primary commit sau)
**Change doc:** `spec/changes/2026-10-23-consult-popup-30s.md` (archive khi close-out) · review `.context/review-reports/feature-consult-popup-30s-phase-1-task-01-round-2-review.md` · validation `.context/review-reports/spec-validation-feature-consult-popup-30s-phase-1.md`

## Requirements
- **THÊM — F9 "Popup 'Nhận tư vấn' (BL-066)":** ở mọi trang công khai VI/EN (trừ `/lien-he` và `/en/contact`; không có ở `/admin`) popup dialog form lead tự mở khi khách ở trên site 30 giây (hằng số trong code, không cấu hình admin). Đếm theo phiên trình duyệt (`sessionStorage`): chuyển trang không reset, mỗi phiên tối đa 1 lần (đã hiện dù đóng hay gửi thì không hiện lại), tab mới = phiên mới, `sessionStorage` lỗi → không hiện, không crash. Tới mốc ở trang Liên hệ → chưa tính đã hiện, sang trang khác thì hiện.
- **Hoãn:** focus đang trong ô nhập của form khác → hoãn tới khi focus rời hẳn form đó (Tab sang nút gửi / Turnstile cùng form vẫn hoãn; đang nhấn chuột trong form hoãn tới khi nhả); đang có dialog/modal khác mở → hoãn tới khi đóng.
- **Form:** tái dùng `LeadForm` (cùng trường, consent, Turnstile, rate limit, chống trùng 7 ngày, email thông báo) với nguồn lead mới `popup` ("Popup tư vấn" trong admin, lọc / xuất Excel được; không có bản ghi nguồn → không gửi `sourceId`, giao sale như `contact`).
- **A11y / UI:** `aria-labelledby` tiêu đề; đóng bằng ×, Esc, bấm nền; focus trap + trả focus; song ngữ; 390 / 768 / 1440; dark mode theo token. Gửi thành công hiện lời cảm ơn trong dialog.
- **Dữ liệu:** thêm giá trị `popup` vào enum `leads.source` bằng migration additive (`20261023_020647_leads_source_popup`, `ADD VALUE IF NOT EXISTS`, down no-op). Không có cấu hình admin nên không có migration cấu hình.

## Ảnh hưởng
- Module: `src/components/leads/ConsultPopup.tsx` (mới) + test, `src/components/layout/PublicShell.tsx`, `src/components/leads/LeadForm.tsx`, `src/lib/leads/{lead-values,dedupe,create-or-merge}.ts` (helper `hasSourceRecord`), `src/collections/Leads.ts`, `src/shared/types/api.ts`, `src/endpoints/public/leads.ts`, `src/i18n/messages/{vi,en}.json`, `migrations/20261023_020647_leads_source_popup.{ts,json}`, `migrations/index.ts`, `src/payload-types.ts`, `docs/API_SPEC.md`, `docs/ERD.md`, `docs/DESIGN.md`.
- Verify: typecheck PASS; `pnpm test` 427 file / 4472 test PASS; build PASS (route `[locale]` vẫn SSG `●`); eslint file đổi 0 lỗi (`pnpm lint` toàn repo fail do file ngoài scope `.local-seed/…`, có sẵn).
- **Rủi ro triển khai:** migration enum additive — phải chạy migrate trên staging / prod TRƯỚC khi deploy code (không thì gửi lead nguồn `popup` lỗi enum).
- Test: mọi trang công khai (island trong khung trang chung); regression mọi form lead (contact / rental / property_post / project), admin lọc / xuất Excel theo nguồn, CookieBanner / FloatingDock / BackToTop, trang Liên hệ.
- Scope: `spec/test-scope/current.json` v71 (bản cũ v70 → `spec/test-scope/archive/test-scope-1.54.0-70.json`).
