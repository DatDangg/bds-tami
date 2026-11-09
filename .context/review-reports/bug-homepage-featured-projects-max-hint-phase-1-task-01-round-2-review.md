Agent: reviewer

# Review — bug-homepage-featured-projects-max-hint · phase-1-task-01 · round 2 (BL-115)

- Task: `tasks/bug-homepage-featured-projects-max-hint/phase-1-task-01.md`
- Round 1: `.context/review-reports/bug-homepage-featured-projects-max-hint-phase-1-task-01-round-1-review.md` (FAIL: thiếu description cho `hero.slides`)
- Phạm vi: `src/globals/Homepage.ts`, `src/globals/Homepage.test.ts`, và trong `src/globals/homepage/blocks.ts` chỉ 3 chuỗi description (`chipProjects`, rentals `categories`, news `posts`). `validateRentalCategories` và `blocks.test.ts` thuộc BL-116, không review ở đây.

## Review level
`FAST`

## Reason
Task chỉ đổi chuỗi `admin.description` của global `homepage`. Không đổi schema, migration, API, quyền hay types. Builder đã chạy test PASS và reviewer chạy lại cũng PASS.

## Blast radius
- Phần mô tả field trong admin `/admin/globals/homepage`: hero slides, featured projects, hero-search chips, rentals categories, news posts.
- Không ảnh hưởng dữ liệu, API, web public hay `payload-types.ts`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/globals/Homepage.test.ts src/globals/homepage` | PASS: 2 files, 13/13 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS: không có lỗi |
| `npx eslint src/globals/Homepage.ts src/globals/Homepage.test.ts src/globals/homepage/blocks.ts` | PASS: exit 0 |

## Responsive Checklist Gate
N/A. Task chỉ đổi chuỗi mô tả field trong admin Payload, không đụng route, component hay CSS.

## Skill gates
- aislop: skip. Diff chỉ gồm chuỗi và test nhỏ (FAST); đọc diff không thấy slop pattern.
- oxlint (anti-slop): skip, oxlint not configured. Đã chạy eslint thay thế và PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK, 0 indicator mới. Giá trị lấy từ hằng, không có magic number mới; helper test ngắn và có JSDoc.
- ai-friendly-web: N/A, đây là admin nội bộ.
- blitzstrike: N/A, task không phải STRICT và không thuộc nhóm nhạy cảm.

## Finding round 1: đã đóng chưa
- [MAJOR] `hero.slides` thiếu mô tả giới hạn: **ĐÃ ĐÓNG**. `src/globals/Homepage.ts:131-134` có `description: \`Tối đa ${HERO_SLIDES_MAX} slide.\`` và vẫn giữ `components.RowLabel`. Test `Homepage.test.ts:200-204` kiểm `maxRows === HERO_SLIDES_MAX` và description có chứa `Tối đa ${HERO_SLIDES_MAX} slide`. Dòng Repro Verification trong task đã sửa đúng.
- [MINOR] rentals/news ghi số cứng: **ĐÃ ĐÓNG**. `blocks.ts:138` và `blocks.ts:153` nay lấy từ `RENTAL_CATEGORIES_MAX` / `HOME_NEWS_POSTS_MAX`. Diff hai dòng này chỉ đổi chuỗi.
- [MINOR, ngoài scope] `FEATURED_PROJECTS_MAX` khai báo ở hai nơi: vẫn còn, đã ghi trong Residual risk của task.

## Rà các field có giới hạn trong global (grep `maxRows|minRows` ở `src/globals/Homepage.ts` + `src/globals/homepage/`)
| Field | Giới hạn | Description nêu giới hạn |
|---|---|---|
| `hero.slides` (Homepage.ts:129-130) | min/max hằng | Có: "Tối đa ${HERO_SLIDES_MAX} slide." |
| `featuredProjects.projects` (Homepage.ts:202) | `FEATURED_PROJECTS_MAX` | Có, lấy từ hằng |
| `heroSearch.chipProjects` (blocks.ts:91) | `HERO_CHIP_PROJECTS_MAX` | Có, lấy từ hằng |
| strengths `items` (blocks.ts:108-110) | `STRENGTH_ITEMS_MIN/MAX` | Có: "2–6 mục" (số cứng, có từ trước task) |
| rentals `categories` (blocks.ts:135-138) | `RENTAL_CATEGORIES_MAX` | Có, lấy từ hằng |
| news `posts` (blocks.ts:153) | `HOME_NEWS_POSTS_MAX` | Có, lấy từ hằng |
| "Tin ưu đãi hiển thị" | phía hiển thị cắt theo `FEATURED_OFFERS_MAX`, field không có `maxRows` | Chưa nêu. Residual được chấp nhận vì `home-view.ts` import `globals/Homepage`, nên import ngược sẽ tạo vòng phụ thuộc. Task đã cấm thêm `maxRows` mới |

Acceptance #1–#4 đều đạt.

## Findings
### [MINOR] Mô tả strengths `items` vẫn ghi số cứng "2–6"
- `src/globals/homepage/blocks.ts:110`: chuỗi `"2–6 mục; ..."` trong khi đã có `STRENGTH_ITEMS_MIN/MAX`. Hiện số vẫn đúng và dòng này có từ trước, không nằm trong diff. Đề xuất đổi sang template string từ hằng khi có dịp (task riêng). Không chặn PASS.

Không có CRITICAL hay MAJOR.

## Bug repro closure
Repro Verification ghi Status `PASS`. Evidence là test đọc config thật (`createHomepage`), kiểm `maxRows` bằng hằng và description có chứa "Tối đa N"; reviewer chạy lại PASS. Repro thuộc loại "chữ mô tả admin", nên test schema đủ để kiểm chứng.

## Verdict
✅ PASS. Finding MAJOR của round 1 đã đóng, mọi field có giới hạn trong global đã nêu giới hạn (trừ "Tin ưu đãi", là residual có lý do), verify đều PASS.
