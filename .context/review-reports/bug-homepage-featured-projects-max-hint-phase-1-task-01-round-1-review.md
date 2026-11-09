Agent: reviewer

# Review — bug-homepage-featured-projects-max-hint · phase-1-task-01 · round 1 (BL-115)

- Task: `tasks/bug-homepage-featured-projects-max-hint/phase-1-task-01.md`
- Change doc: `spec/changes/2026-11-09-homepage-featured-projects-max-hint.md`
- Scope reviewed: `src/globals/Homepage.ts`, `src/globals/Homepage.test.ts`, `src/globals/homepage/blocks.ts` (chỉ chuỗi description `heroSearch.chipProjects`; `validateRentalCategories` thuộc BL-116 — không review).

## Review level
`FAST`

## Reason
Chỉ đổi chuỗi `admin.description` trong global `homepage` (không đổi schema DB, không migration, không đổi API/quyền/types). Builder có test PASS.

## Blast radius
- Admin UI `/admin/globals/homepage`: mô tả field "Dự án hiển thị" (`featuredProjects.projects`) và "Dự án gợi ý dưới ô tìm kiếm" (`heroSearch.chipProjects`).
- Không ảnh hưởng dữ liệu, API, frontend public, `payload-types.ts`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/globals/Homepage.test.ts` | PASS — 1 file, 7/7 tests |
| `npx eslint src/globals/Homepage.ts src/globals/Homepage.test.ts src/globals/homepage/blocks.ts` | PASS — exit 0, không cảnh báo |
| `pnpm typecheck` | PASS — `tsc --noEmit` không lỗi (lỗi ngoài scope builder nhắc tới hiện không còn) |

## Responsive Checklist Gate
N/A — chỉ đổi chuỗi mô tả field admin Payload, không đụng route/component/CSS.

## Skill gates
- aislop: skip, chỉ đổi 2 chuỗi + 1 test nhỏ (FAST); không thấy slop pattern khi đọc diff.
- oxlint (anti-slop): skip, oxlint not configured (eslint chạy PASS thay thế).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — 0 indicator mới (dùng hằng thay số cứng, helper test `findRelationship` ngắn, có JSDoc mục đích).
- ai-friendly-web: N/A — admin nội bộ.
- blitzstrike: N/A — không phải STRICT/nhạy cảm.

## Findings

### [MAJOR] Acceptance #2 chưa đạt + Repro Verification ghi sai: `hero.slides` có `maxRows` nhưng description không nêu giới hạn
- `src/globals/Homepage.ts:129-131` — array `hero.slides` có `minRows: HERO_SLIDES_MIN` / `maxRows: HERO_SLIDES_MAX` (8) nhưng `admin` chỉ có `components.RowLabel`, **không có `description`**. Grep `HERO_SLIDES_MAX` / "Tối đa 8" / "1–8" trong `src/globals` và `src/i18n` không thấy chỗ nào báo giới hạn cho admin.
- Task "Thiết kế fix" yêu cầu rà mọi relationship/array có `maxRows` trong cùng global; Acceptance #2 "Các field giới hạn khác trong global đã đồng bộ". Repro Verification lại ghi "rentals/news/strengths/hero.slides đã nêu giới hạn" — sai với hero.slides → evidence không chính xác.
- Fix đề xuất: thêm `description: \`Tối đa ${HERO_SLIDES_MAX} slide.\`` (có thể kèm tối thiểu `HERO_SLIDES_MIN`) vào `admin` của `slides` (giữ `components`); thêm case vào test BL-115 (field array `slides`: `maxRows` = hằng, description chứa `Tối đa ${HERO_SLIDES_MAX}`) — helper `findRelationship` hiện chỉ match `type === "relationship"`, cần nới cho array. Sửa lại dòng Repro Verification cho đúng.

### [MINOR] Mô tả rentals/news vẫn ghi số cứng thay vì hằng
- `src/globals/homepage/blocks.ts:153` — `posts`: "Tối đa 3. Để trống thì tự lấy 3 bài mới nhất." trong khi có `HOME_NEWS_POSTS_MAX = 3` (`blocks.ts:8`).
- `src/globals/homepage/blocks.ts:138` — `categories`: "Tối đa 4." trong khi có `RENTAL_CATEGORIES_MAX`.
- Hiện đúng giá trị nên không phải lỗi người dùng thấy; nhưng lệch nguyên tắc "dùng hằng, không hardcode" của task. Đề xuất đổi sang template string từ hằng (dòng 138 nằm cạnh vùng BL-116 → phối hợp tránh conflict, hoặc để task riêng). Không chặn PASS.

### [MINOR / ngoài scope] Hằng `FEATURED_PROJECTS_MAX` bị khai báo trùng
- `src/globals/Homepage.ts:24` và `src/lib/home/home-queries.ts:18` cùng `= 6` độc lập; đổi một chỗ thì mô tả admin / maxRows lệch với số phía hiển thị lấy. Có sẵn trước task → ngoài scope, đề xuất task riêng gộp về một nguồn (cùng hướng residual risk `FEATURED_OFFERS_MAX`).

### Ghi nhận OK
- `featuredProjects.projects` description dùng `FEATURED_PROJECTS_MAX` — đúng root cause, đúng chữ yêu cầu.
- `chipProjects` description dùng `HERO_CHIP_PROJECTS_MAX`; diff trong `blocks.ts` của task chỉ là chuỗi description.
- Test khẳng định cả `maxRows` = hằng và description chứa `Tối đa <hằng> dự án` → bám contract config thật.
- Residual risk "Tin ưu đãi hiển thị" (vòng import) hợp lý, đã ghi rõ.
- Doc impact `no doc impact` — đồng ý.

## Verdict
❌ FAIL — 1 MAJOR: `hero.slides` (`maxRows: HERO_SLIDES_MAX`) chưa có mô tả giới hạn, trái Acceptance #2, và Repro Verification ghi sai là đã nêu. Builder bổ sung description + test case + sửa evidence rồi review round 2.
