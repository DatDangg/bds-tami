# bug-news-consult-form-layout · phase-1-task-01 — Tin tức: form "Tư vấn nhu cầu" lệch trái, bên phải trống lớn (BL-098)

- Change doc: `spec/changes/2026-10-28-news-consult-form-layout.md` (BACKLOG BL-098, QA sheet 28/10 dòng 14, Thấp).
- Phụ thuộc: không. Batch BL-095→BL-100 user duyệt "auto proceed".
- Trạng thái: `done` — Reviewer FAST PASS r1 (`.context/review-reports/bug-news-consult-form-layout-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.61.0), test-scope v102. Doc impact: `.context/design-spec.md` S10 (1 dòng as-built).

## Classification / Risk
- Type: **BUG** (UI layout; không đổi API/schema/requirement, không đổi hành vi gửi form).
- Risk: **LOW** — chỉ `ConsultSection` cục bộ trong `src/components/news/NewsListPage.tsx` (không shared component, `LeadForm` không đổi).
- Expected review level: **FAST/NORMAL** (reviewer tự chọn).
- Doc impact dự kiến: `.context/design-spec.md` S10 (1 dòng as-built: thẻ canh giữa khung nội dung).

## Repro
- `/tin-tuc` (VI, Khách), dữ liệu dev local. Playwright (Edge) trước fix — `.context/review-reports/assets/bl098-before-{1920,1440,768,390}.png`:
  - 1920: section (khung nội dung) x=320 w=1280; thẻ form x=352 **w=672**, mép phải thẻ cách mép phải khung **576px** trống.
  - 1440: như trên (khung 1280, thẻ 672, trống phải 576).
  - 768: thẻ 672 bám trái (x=23), trống phải 73 ≠ trống trái 23 → lệch.
  - 390: thẻ 358 = full khung (OK).
  - Không tràn ngang trang ở mọi cỡ.

## Root cause (change-request, từ code + đo)
- `src/components/news/NewsListPage.tsx` `ConsultSection` (~dòng 156): thẻ là `flex max-w-2xl flex-col …` (giới hạn 42rem = 672px theo design-spec S10 "thẻ … rộng tối đa 42rem") nhưng **không canh giữa** (`mx-auto` thiếu) trong khung `max-w-container` (80rem = 1280px), và khung không có cột thứ hai → thẻ dính trái, phần phải trống 576px ở ≥ 1280.
- Design: `docs/specs/listing-detail-redesign/tin-tuc.webp` không vẽ khối này (chỉ chốt danh sách → banner tư vấn); design-spec S10 (as-built BL-020) chỉ nói "thẻ trắng bo 20px viền nhạt rộng tối đa 42rem", không nói vị trí ngang. Khối form tương tự ở `/lien-he` (`lien-he.webp`) là thẻ ~nửa khung (lưới 2 cột với bản đồ).

## Thiết kế fix (quyết định của change-request)
- **Giữ rộng tối đa 42rem (đúng design-spec), canh giữa thẻ trong khung nội dung** (`mx-auto w-full max-w-2xl`). Lý do: design-spec có ràng buộc rộng 42rem — kéo full 1280 sẽ trái spec và làm ô nhập dài ~1200px khó đọc; chia 2 cột (giới thiệu | form) cần copy/nội dung mới (đổi intent, không thuộc bug). Canh giữa vừa hết khoảng trống lệch một bên ở 1920/1440, vừa sửa lệch 23/73 ở 768; 390 không đổi.
- Không đổi `LeadForm` (giữ `layout` mặc định, `source="contact"`), không đổi `id="lead-form"` / scroll-margin / heading.

## Files
- `src/components/news/NewsListPage.tsx` (class thẻ `ConsultSection`), `src/components/news/NewsListPage.test.tsx` (test BL-098), `.context/design-spec.md` S10 (1 dòng).
- KHÔNG đụng file dirty ngoài batch: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `tools/agent-live.mjs`, `tools/vibe-studio/src/live-state.ts`, `.claude/hooks/live-studio.mjs`, `.context/review-reports/assets/bl054-*`, `spec/changes/*`.

## Acceptance
- [x] 1920/1440: thẻ form canh giữa khung (|trống trái − trống phải| ≤ 2px), rộng 672.
- [x] 768: thẻ canh giữa (không lệch 23/73); 390: full khung như cũ; không tràn ngang.
- [x] Gửi form không đổi (LeadForm `source="contact"`, test cũ PASS).
- [x] Ảnh Playwright trước/sau `.context/review-reports/assets/bl098-{before,after}-{1920,1440,768,390}.png` (script `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\252b8873-425c-4c6a-966c-b60b663a3c53\scratchpad\bl098-shot.mjs <before|after>`, chạy bằng `node` từ `D:\prj\bds`). Dev server `http://localhost:3000` đang chạy — KHÔNG dừng/khởi động bản khác.
- [x] Test BL-098 (FAIL trước / PASS sau) + `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-29 (change-request): root cause từ code + đo Playwright (không spawn Explore). Chọn canh giữa 42rem (bám design-spec), lý do ở "Thiết kế fix".
- 2026-10-29 (builder): test BL-098 viết trước (FAIL: card class `flex max-w-2xl flex-col …`, thiếu `mx-auto`) → thêm `mx-auto w-full` vào thẻ `ConsultSection` (giữ `max-w-2xl`, LeadForm/id/heading không đổi) + sửa JSDoc + 1 câu as-built ở design-spec S10 → test PASS.

## Repro Verification
- **Original repro**: `/tin-tuc` (VI, Khách) ở 1920/1440/768 — thẻ "Tư vấn nhu cầu" dính trái khung, trống phải lớn.
- **Expected**: thẻ rộng 672 canh giữa khung nội dung (trống trái ≈ trống phải); 390 full khung; không tràn ngang.
- **Actual before fix**: 1920/1440 thẻ x=352 w=672 trong khung 1280 → trống phải 576; 768 thẻ x=23, trống trái 23 / phải 73.
- **Actual after fix** (Playwright): 1920 thẻ x=624 w=672, khung x=320 w=1280 → trống trái 304 = phải 304; 1440 thẻ x=384 w=672, khung x=80 w=1280 → 304/304; 768 thẻ x=48 w=672 → 48/48; 390 thẻ w=358 (x=16, rightGap 16) không đổi; `pageHScroll=false` mọi cỡ. EN `/en/news` cùng số đo.
- **Evidence**: ảnh `.context/review-reports/assets/bl098-{before,after}-{1920,1440,768,390}.png`; test `NewsListPage.test.tsx` "BL-098" FAIL trước / PASS sau; `pnpm typecheck` OK, `pnpm lint` OK, `pnpm test` 456 files / 4816 tests PASS.
- **Status**: PASS (chờ Reviewer)

## Close-out (change-request)
- r1 FAST PASS, 1 MINOR chấp nhận (test BL-098 chỉ kiểm class `mx-auto`/`max-w-2xl` vì jsdom không đo layout; canh giữa chứng minh bằng Playwright).
- Follow-up (không chặn): ảnh QA gốc không có; design `tin-tuc.webp` không vẽ khối form — nếu chủ đầu tư muốn bố cục 2 cột (giới thiệu | form) thì là change request mới (cần copy).
- Spec: no spec change (1.61.0); test-scope v102 (v101 archive). Doc impact: design-spec S10 1 dòng.
