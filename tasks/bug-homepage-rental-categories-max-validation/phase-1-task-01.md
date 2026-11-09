# bug-homepage-rental-categories-max-validation · phase-1-task-01 — "Danh mục cho thuê hiển thị" chọn được quá 4, không viền đỏ (BL-116, QA 33)

- Change doc: `spec/changes/2026-11-09-homepage-rental-categories-max-validation.md` (BACKLOG BL-116).
- Phụ thuộc: không.
- Trạng thái: `done` — NORMAL PASS round 1 (`.context/review-reports/bug-homepage-rental-categories-max-validation-phase-1-task-01-round-1-review.md`); 2 MINOR không chặn

## Classification / Risk
- Type: **BUG** (validate admin; schema/DB không đổi).
- Severity: medium.
- Risk: **LOW-MEDIUM** — chỉ validate 1 field của global `homepage`.
- Expected review level: NORMAL.
- Doc impact dự kiến: `no doc impact`.

## Root cause (đã chứng minh)
`validateRentalCategories` (`src/globals/homepage/blocks.ts:51`) `return true` ngay khi `options.event === "onChange"` → bỏ cả kiểm `maxRows` mặc định (validate tuỳ biến thay validate mặc định; `relationship(value, options)` chỉ được gọi lúc lưu). Khi đang chọn: không lỗi tại trường, không viền đỏ; lúc lưu chỉ toast chung "Trường sau chưa hợp lệ: …".

## Thiết kế fix
- onChange: kiểm đồng bộ, rẻ — số lượng > `RENTAL_CATEGORIES_MAX` (4) → trả **"Tối đa 4 danh mục."** (dùng hằng) → lỗi tại trường + viền đỏ ngay khi chọn mục thứ 5. Các kiểm khác của validate mặc định (`relationship(value, options)` gồm maxRows/required…) — builder xem có gọi được ở onChange mà không truy vấn DB không; truy vấn DB scope `rental` giữ ở lúc lưu (event khác onChange).
- Lúc lưu: >4 → chặn lưu với cùng câu tiếng Việt tại trường (đảm bảo không phải chỉ thông điệp tiếng Anh mặc định của Payload maxRows; nếu `relationship()` trả chuỗi tiếng Anh cho maxRows → kiểm số lượng của mình TRƯỚC).
- Không viết component khoá chọn (ngoài scope).
- Lưu ý: task BL-115 chạy song song có thể sửa CHUỖI description trong `blocks.ts` — chỉ sửa hàm `validateRentalCategories` + test; trước khi Edit đọc lại file.

## Files
- Sửa: `src/globals/homepage/blocks.ts` (hàm `validateRentalCategories`), test (vd `src/globals/homepage/blocks.test.ts` hoặc test hiện có — builder tìm).

## Acceptance
- [ ] onChange 5 danh mục → trả "Tối đa 4 danh mục." (không truy vấn DB).
- [ ] Lưu 5 danh mục → bị chặn, lỗi tiếng Việt tại trường.
- [ ] 1–4 danh mục scope rental vẫn hợp lệ; danh mục khác scope vẫn báo 'Chỉ chọn danh mục thuộc loại "Cho thuê".' lúc lưu.
- [ ] Test hồi quy fail trước / pass sau.
- [ ] `pnpm typecheck`, `pnpm lint`, vitest liên quan PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: /admin/globals/homepage → Cho thuê → chọn 5 danh mục → không đỏ, vẫn chọn tiếp, lưu chỉ toast chung.
- Expected: chọn mục thứ 5 → lỗi "Tối đa 4 danh mục." tại trường (viền đỏ); lưu 5 → chặn bằng cùng câu tiếng Việt.
- Actual before fix: `validateRentalCategories` trả `true` ở onChange → không lỗi/viền đỏ; lúc lưu `relationship()` trả thông điệp maxRows mặc định (i18n).
- Actual after fix: kiểm số lượng đồng bộ đứng TRƯỚC nhánh onChange và TRƯỚC `relationship()` → cả onChange lẫn lưu trả "Tối đa 4 danh mục." (dùng `RENTAL_CATEGORIES_MAX`); onChange không truy vấn DB; kiểm scope rental giữ ở lúc lưu.
- Evidence: `src/globals/homepage/blocks.test.ts` 5 test PASS (onChange 5 → thông điệp + `find` không được gọi; lưu 5 → thông điệp; onChange 4 → true; lưu 4 rental → true; khác scope → câu scope). Trước fix, test onChange 5 fail (trả true).
- Status: PASS (mức unit; chưa kiểm viền đỏ trên trình duyệt)

## Residual risk
Chưa kiểm viền đỏ trên trình duyệt thật (admin UI hiển thị lỗi validate onChange theo cơ chế chuẩn Payload). Test dùng mock `req`/`payload`, không chạy `relationship()` với DB thật.

## Doc impact
`no doc impact` (chỉ validate admin, không đổi contract/schema/behavior tài liệu hoá).
