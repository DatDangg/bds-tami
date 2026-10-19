Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-3-task-02 · round 1

## Review level
**STRICT**

## Reason
Đổi code dùng chung: `CategoryListTemplate`, `ListSearchBar`, `PostCard`/`ProjectCard` (nhiều trang), bộ lọc `/du-an` (URL params), context draft cho thuê, type `PostPage` của `listPublicPosts`.

## Blast radius
- Trang danh sách: `/du-an`, `/tin-bds` (+ danh mục), `/tuyen-dung`, `/tin-tuc` (giữ banner mặc định), `/cho-thue` (qua `RentalFilterSheet`, `RentalListNavigation`).
- Trang dùng lại thẻ: `OffersSlider` trang chủ (PostCard), "Dự án khác" chi tiết dự án (ProjectCard), bài liên quan `PostDetail`.
- i18n VI/EN.

## Verify commands + result (worktree `D:/prj/bds/.claude/worktrees/bl020-p3p5`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS — 0 error, 2 warning cũ `tools/task-dashboard/server.mjs` |
| `pnpm typecheck` | PASS |
| `pnpm test` projects, posts, templates, rentals, listing, careers, lib | PASS 107 files / 1206 tests |
| full `pnpm test`, `pnpm build` | builder: 283 files / 2986 PASS, build PASS |

## Điểm kiểm theo brief
- Không hồi quy trang khác: OffersSlider nền `bg-bg-alt` sáng — thẻ trắng viền nhạt ổn, `h-full` cao đều; shadow hover nằm trong `py-2` (suy luận CSS). ProjectCard "Dự án khác", PostCard bài liên quan nhận kiểu thẻ trắng + tiêu đề h4, khớp trang danh sách.
- `totalDocs`: `active + ended` (đã trừ bài nổi bật) + 1 nếu có bài nổi bật; đúng và ổn định qua các trang; danh mục không cộng; `isEmpty` vẫn đúng; `post-queries.test` cập nhật.
- Pending `/du-an`: `useTransition` → `useReportPending`; thanh nằm trong `ListPendingProvider`.
- `key=` `province|status`: select nạp lại khi chip/"Xoá bộ lọc"/back đổi URL; `category` qua prop + hidden input.
- Không JS: form GET thật, `<select name>` gốc trước hydrate, `category` hidden; `projectQueryString` chỉ import type.
- URL params không đổi (`province`, `status`, `category`); "Xoá bộ lọc" → `listPath` như cũ.
- A11y: nhãn sr-only + option rỗng riêng ("Tất cả tỉnh/thành" / "Mọi trạng thái"); form `role="search"` có tên; số kết quả `role="status"` `aria-live`.
- i18n: VI "Có {count, number} kết quả", EN plural; giữ `allProvinces`/`allStatuses` (HeroSearch, JobFilters dùng).
- Carry-over P3-T01: Sheet seed từ draft chung, áp qua `update(..., "now")` (huỷ debounce, có test); `useMemo` context.
- Quyết định E1–E7 tương thích yêu cầu; E3 (`/tin-bds` không có lọc → không có băng tìm kiếm) khớp "giữ bộ lọc hiện có".

## Responsive Checklist Gate (375/768/1280, suy luận CSS)
Không cuộn ngang OK · mobile-first OK · lưới 1/2/3/4 (1280 ~280px/thẻ) OK · container OK · typography token OK · ảnh aspect cố định + sizes 4 cột OK · vùng chạm ≥ 44px OK · banner `h-60` OK · reduced motion OK · overflow chỉ bo góc ảnh OK. **Gate: PASS**

## Skill gates
aislop/oxlint/ocr: skip. AI-readable OK. ai-friendly-web/blitzstrike: N/A.

## Findings
### MINOR
1. `src/components/templates/CategoryListTemplate.tsx:795` — `searchBar` render với `-mt-12` cả khi `compactBanner` false; chỉ comment ràng buộc → render khi cả hai (`{compactBanner && searchBar && …}`) hoặc union type props.
2. `/tin-bds`, `/tuyen-dung`: banner compact giữ 3rem đệm đáy cho thanh tìm kiếm không có → khoảng trống thừa (chưa kiểm trình duyệt). Tuỳ chọn: biến thể PageBanner không đệm đáy khi không có `searchBar`.
3. `ProjectListPage.test.tsx:485-495`, `CategoryListTemplate.test.tsx:723-757` assert chuỗi class Tailwind chính xác → giòn; dùng `data-*` hoặc assert thứ tự/role.

## Residual risk
Chưa kiểm trình duyệt 375/768/1280, shadow hover slider trang chủ; full test/build theo builder.

## Verdict
**PASS** — không CRITICAL/MAJOR; MINOR-1/2 chuyển sang P3-T03 (cùng đụng `CategoryListTemplate`).
