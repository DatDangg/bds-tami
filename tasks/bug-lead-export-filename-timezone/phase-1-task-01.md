# bug-lead-export-filename-timezone · phase-1-task-01 — Tên file xuất Excel lead theo giờ UTC (BL-129)

- Change doc: `spec/changes/2026-11-26-lead-export-filename-timezone.md` (BACKLOG BL-129, QA 45, Thấp).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — STRICT PASS round 1 (`.context/review-reports/bug-lead-export-filename-timezone-phase-1-task-01-round-1-review.md`); 1 MINOR có sẵn từ trước (`vietnamTime` hardcode múi giờ thay `TIME_ZONE`, `leads-export.ts:58` — không đổi trong task này). API_SPEC §4.1/§4.2 ghi giờ VN lúc close-out. Spec 1.64.7 / scope v128.

## Classification / Risk
- Type: **BUG** (batch BL-125→129 user duyệt + auto proceed 2026-11-26).
- Severity: low.
- Risk: **LOW-MEDIUM** — endpoint export admin (import/export → reviewer STRICT theo luật), chỉ đổi chuỗi tên file trong `Content-Disposition`; không đổi nội dung file, quyền, rate limit, audit.
- Expected review level: STRICT (import/export) — diff nhỏ.
- Doc impact dự kiến: `docs/API_SPEC.md` §4.1/§4.2 nếu mô tả tên file (đang bẩn sẵn — chỉ sửa đúng dòng lúc close-out). SPECIFICATIONS as-built PATCH.

## Root cause (đã xác định từ code)
- `src/endpoints/admin/leads-export.ts:148-151` — `exportFileName(now)` dùng `now.toISOString().slice(0, 16)` → luôn là giờ **UTC** → 00:23 ngày 20/11 giờ VN (= 17:23 UTC ngày 19/11) ra `tami-leads-202611191723.xlsx`.
- Cùng lỗi: `src/endpoints/admin/newsletter-export.ts:78-81` (`tami-ban-tin-<stamp>.xlsx`) dùng y hệt `toISOString`.
- Nội dung file: cột thời gian lead (`createdAt`, `assignedAt`, `lastActivityAt`) đã format giờ VN qua `vietnamTime` (`leads-export.ts:57-63`, `Intl.DateTimeFormat` `timeZone: "Asia/Ho_Chi_Minh"`) → **không cùng lỗi**. Builder kiểm cột thời gian trong newsletter export tương tự.
- Client `src/components/admin/LeadExportButton.tsx:33-34` chỉ đọc `filename="…"` từ header → không cần sửa.

## Thiết kế fix
- Một helper chung (vd `src/lib/format.ts` đã có `TIME_ZONE = "Asia/Ho_Chi_Minh"` `:3`, hoặc file nhỏ mới `src/lib/export/file-stamp.ts`) trả `yyyyMMddHHmm` theo Asia/Ho_Chi_Minh bằng `Intl.DateTimeFormat(...).formatToParts` (`hourCycle: "h23"`), độc lập TZ server.
- `leads-export.ts` + `newsletter-export.ts` dùng helper (export `exportFileName` hoặc test qua helper).
- Không đổi định dạng tên file (vẫn `tami-leads-<12 chữ số>.xlsx`, `tami-ban-tin-<12 chữ số>.xlsx`).

## Files
- Sửa: `src/endpoints/admin/leads-export.ts`, `src/endpoints/admin/newsletter-export.ts`, `src/lib/format.ts` (export `TIME_ZONE`); mới: `src/lib/export/file-stamp.ts` (`exportFileStamp`).
- Test: `src/endpoints/admin/leads-export.test.ts`, `src/endpoints/admin/newsletter-export.test.ts`, mới `src/lib/export/file-stamp.test.ts`.
- KHÔNG đụng: file bẩn có sẵn ngoài scope (`src/endpoints/admin/lead-assign.ts`, `retranslate.ts`, `src/endpoints/public/newsletter.ts`, docs/*…), `.context/runs/*`.

## Acceptance
- [ ] Timestamp tên file theo Asia/Ho_Chi_Minh, độc lập TZ server (test chạy với TZ khác, vd đặt `process.env.TZ` hoặc chỉ dùng thời điểm cố định UTC).
- [ ] Qua nửa đêm: `2026-11-19T17:23:00Z` → `tami-leads-202611200023.xlsx`.
- [ ] Newsletter export cùng sửa: `tami-ban-tin-202611200023.xlsx`.
- [ ] Cột thời gian trong nội dung file đã đúng giờ VN — ghi kết luận (lead + newsletter).
- [ ] Test FAIL trước / PASS sau; `pnpm vitest run src/endpoints/admin src/lib`, `pnpm typecheck`, eslint file đổi PASS.

## Verification Plan
- Test-first với thời điểm cố định qua nửa đêm (UTC 17:23 → VN 00:23 hôm sau), cả cuối tháng/năm (vd `2026-12-31T17:30:00Z` → `202701010030`).

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: Admin › Lead › Xuất Excel lúc 00:23 20/11 giờ VN → `tami-leads-202611191723.xlsx`.
- Expected: `tami-leads-202611200023.xlsx`.
- Actual before fix: `toISOString().slice(0,16)` với 2026-11-19T17:23:00Z → `202611191723` (UTC; 00:23 ngày 20 giờ VN).
- Actual after fix: `tami-leads-202611200023.xlsx` / `tami-ban-tin-202611200023.xlsx`; 2026-12-31T17:30:00Z → `202701010030`.
- Evidence: `src/lib/export/file-stamp.test.ts` (3 ca) + test handler lead/newsletter với fake Date; `TZ=America/New_York pnpm vitest run src/endpoints/admin src/lib` 153 file / 1711 test PASS; typecheck + eslint sạch. Nội dung: `formatTime` (Intl Asia/Ho_Chi_Minh) đã là giờ VN cho cả lead (createdAt/assignedAt/lastActivityAt) lẫn newsletter (createdAt/consentAt, dùng chung `formatTime`) → không lỗi.
- Status: PASS

## Residual risk
- Thấp. Đổi duy nhất chuỗi tên file; `TIME_ZONE` trong `src/lib/format.ts` nay `export` (không đổi hành vi). Phụ thuộc ICU/Intl có tzdata Asia/Ho_Chi_Minh (Node chuẩn có sẵn; nội dung file đã dựa vào cùng điều này). Test "fail trước" chứng minh bằng biểu thức cũ cho `202611191723`, không chạy lại code cũ.

## Doc / Decision Impact
- `docs/API_SPEC.md` §4.1/§4.2 nếu ghi tên file (bẩn sẵn — KHÔNG sửa, close-out xử lý đúng dòng). SPECIFICATIONS as-built PATCH qua spec-publisher.
