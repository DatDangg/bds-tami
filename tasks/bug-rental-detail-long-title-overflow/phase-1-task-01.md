# bug-rental-detail-long-title-overflow · phase-1-task-01 — Chi tiết tin cho thuê 390px: tiêu đề chuỗi dài liền bị cắt + trang tràn ngang (BL-125)

- Change doc: `spec/changes/2026-11-26-rental-detail-long-title-overflow.md` (BACKLOG BL-125, QA 42, Trung bình).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — STRICT PASS round 1 (`.context/review-reports/bug-rental-detail-long-title-overflow-phase-1-task-01-round-1-review.md`); 3 MINOR không chặn (test chỉ kiểm class; class trùng tác dụng theo quy ước RichText; ghi chú pháp lý `RentalDetail.tsx:151` ngoài phạm vi). Spec 1.64.3 / scope v124.

## Classification / Risk
- Type: **BUG** (batch BL-125→129 user duyệt thứ tự + auto proceed 2026-11-26).
- Severity: medium (mobile cuộn ngang, cắt chữ tiêu đề).
- Risk: **MEDIUM** — component dùng chung `DetailHeroMosaic` (chi tiết Dự án, Cho thuê, Tin BĐS) + `DetailSection` (mọi khối chi tiết). Chỉ thêm class ngắt từ → không đổi bố cục với tiêu đề bình thường.
- Expected review level: STRICT (shared component) hoặc NORMAL nếu reviewer thấy diff chỉ thêm class.
- Doc impact dự kiến: không API/ERD/schema. SPECIFICATIONS as-built PATCH (spec-publisher).

## Root cause (đã xác định từ code)
Chuỗi liền không khoảng trắng (vd "test thu sale2546456565456000…") không có điểm ngắt dòng; các nơi in tiêu đề không có `overflow-wrap`:
1. `src/components/detail/DetailHeroMosaic.tsx:58` — `<h1 className="max-w-[40rem] font-display text-h1 text-balance">` không `break-words`/`[overflow-wrap:anywhere]` → chữ tràn khỏi cột; `section` hero (`:157`) có `overflow-hidden` nên phần tràn bị **cắt chữ** (đúng triệu chứng "tiêu đề bị cắt").
2. `src/components/detail/DetailSection.tsx:45` — `description` `<p>` không ngắt từ. Chi tiết Cho thuê truyền `description={t("v2.galleryDescription", { name: view.title })}` (`src/components/rentals/RentalDetail.tsx:143`, "Hình ảnh của {name}.") → chuỗi liền tràn khỏi thẻ trắng; dưới `lg` `DetailLayout` là block (`src/components/detail/DetailLayout.tsx:42`), không có `overflow-hidden` → phần tràn cộng vào `document.documentElement.scrollWidth` (587px trên màn 390 = trang cuộn ngang).
Quy ước dự án đã có cho chuỗi dài: `break-words [overflow-wrap:anywhere]` (`src/components/content/RichText.tsx:276-277`).

Builder phải rà thêm (cùng root cause, cùng diff): các chỗ khác in `view.title`/tên tin trên trang chi tiết Cho thuê + Tin BĐS (`src/components/posts/PostDetail.tsx`) + Dự án (`src/components/projects/ProjectDetail.tsx`) dưới dạng text thường (vd địa chỉ `HeroText` `:62`, `SaleContactBox`, sticky CTA, overview) — nếu có thể tràn ngang thì thêm cùng class. Không sửa ngoài trang chi tiết.

## Thiết kế fix
- `DetailHeroMosaic` `h1`: thêm `break-words [overflow-wrap:anywhere]` (giữ `text-balance`, `max-w-[40rem]`). Cân nhắc cả `<p>` địa chỉ (`:62`) — địa chỉ người nhập cũng có thể là chuỗi dài.
- `DetailSection` `description` `<p>`: thêm `break-words [overflow-wrap:anywhere]`. Cân nhắc `h2` tiêu đề khối (title đến từ i18n, không cần).
- Không đổi bố cục/khoảng cách; tiêu đề có khoảng trắng bình thường hiển thị y hệt (overflow-wrap chỉ tác động khi một từ dài hơn dòng).

## Files
- Sửa: `src/components/detail/DetailHeroMosaic.tsx`, `src/components/detail/DetailSection.tsx` (+ file chi tiết khác nếu rà ra cùng lỗi).
- Test: `src/components/detail/DetailHeroMosaic.test.tsx`, test `DetailSection` (có sẵn hoặc tạo `src/components/detail/DetailSection.test.tsx`), có thể `src/components/rentals/rental-detail.test.tsx`.
- KHÔNG đụng: file bẩn có sẵn ngoài scope (docs/*, src/endpoints/*, src/jobs/*, package.json, tools/*…), `.context/runs/*`.

## Acceptance
- [ ] 390: `document.documentElement.scrollWidth <= 390` ở `/cho-thue/<slug>` có tiêu đề chuỗi dài liền (đo trình duyệt nếu có môi trường; không thì dựa test class + lập luận CSS, ghi residual).
- [ ] H1 xuống dòng, không cắt chữ; mô tả khối "Hình ảnh của {tiêu đề}" xuống dòng.
- [ ] Chi tiết Tin BĐS + Dự án (dùng chung `DetailHeroMosaic`/`DetailSection`) cũng được sửa.
- [ ] Desktop không đổi ngoài ý muốn (chỉ thêm class ngắt từ).
- [ ] Test hồi quy FAIL trước / PASS sau (h1 + description có `[overflow-wrap:anywhere]`).
- [ ] `pnpm typecheck`, eslint file đổi, `pnpm vitest run src/components/detail src/components/rentals src/components/posts src/components/projects` PASS.
- [ ] Ảnh 390/1440: không có dev server (Docker/DB không chạy) → ghi "chưa chụp ảnh".

## Verification Plan
- Test-first: thêm assertion class cho `h1` và `description`, chạy FAIL → sửa → PASS.
- Chạy `pnpm vitest run` các thư mục liên quan + `pnpm typecheck` + `pnpm exec eslint <files>`.

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: `/cho-thue/test-thu-sale2` ở 390px, tiêu đề chuỗi liền bị cắt, document rộng 587px.
- Expected: tiêu đề xuống dòng, không cuộn ngang.
- Actual before fix: h1 hero (`DetailHeroMosaic.tsx:58`) và mô tả `DetailSection.tsx:45` không có overflow-wrap; test hồi quy mới FAIL 2/2 (thiếu `[overflow-wrap:anywhere]`).
- Actual after fix: h1, địa chỉ hero và mô tả khối có `break-words [overflow-wrap:anywhere]` → chuỗi liền xuống dòng; test hồi quy PASS.
- Evidence: `DetailBlocks.test.tsx` + `DetailHeroMosaic.test.tsx` (BL-125) FAIL trước / PASS sau; vitest detail+rentals+posts+projects 26 file / 312 test PASS; typecheck + eslint sạch. Chưa chụp ảnh 390/1440 (không có dev server/Docker). Rà: PostDetail/ProjectDetail/RentalDetail đều đi qua DetailHeroMosaic + DetailSection (sửa chung); Breadcrumb overlay đã `truncate`; không file chi tiết nào khác cần sửa.
- Status: PASS (đo scrollWidth thực tế chưa làm — xem residual)

## Residual risk
- Chưa đo `scrollWidth <= 390` trên trình duyệt (không có môi trường); dựa test class + CSS (`overflow-wrap:anywhere` ảnh hưởng min-content nên không còn tràn). Chuỗi liền khác ở khối ngoài DetailSection/Hero (vd SaleContactBox, sticky CTA) không rà bằng đo thật.

## Doc / Decision Impact
- Không đổi API/ERD/schema/DESIGN. SPECIFICATIONS as-built PATCH qua spec-publisher.
