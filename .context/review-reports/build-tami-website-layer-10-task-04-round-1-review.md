Agent: reviewer

# Review: build-tami-website, layer-10-task-04, round 1 (trạng thái chờ phía client cho các trang danh sách, D5)

- **Review level:** STRICT
- **Reason:** đổi `Pagination` và `CategoryListTemplate`, hai component dùng chung cho mọi trang danh sách công khai; đổi `<form method="get">` sang `next/form`; có risk soft-404/HTTP 404 và ISR (task file yêu cầu STRICT).
- **Worktree:** `D:/prj/bds-wt10-t04` (branch `wt/l10-t04`, base `ef39df4`, chưa commit). Bỏ qua `src/payload-types.ts` (chỉ đổi EOL).
- **Blast radius:** `src/components/layout/{Pagination,PendingRegion}.tsx`, `src/components/templates/CategoryListTemplate.tsx`. Các trang dùng chúng: `/du-an`, `/tin-tuc` (+ danh mục), `/tin-bds` (+ danh mục), `/tuyen-dung`. `/cho-thue` (+ danh mục) qua `RentalListNavigation.tsx` + `RentalListPage.tsx`. Filter: `ProjectFilters.tsx`, `JobFilters.tsx`. Test chặn: `list-no-loading.test.ts`. Diff không đụng API, DB, auth hay route config.

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ, 2 lần) | exit 1, **do môi trường**: Postgres dùng chung báo `the database system is in recovery mode`, nên ~44 file `tests/integration/*` lỗi lúc connect và `health.test.ts` trả 503. Ngoài ra có `src/lib/contrast.test.ts` (lỗi CRLF đã biết) và `Header.test.tsx` timeout 5000ms khi máy tải nặng; file này không nằm trong diff và PASS khi chạy riêng. Không có lỗi nào liên quan tới diff. |
| `pnpm test src/components/layout src/app/(frontend) src/components/{projects,rentals,careers,templates,news,posts}` | **PASS**: 30 file, 283 test (có `PendingRegion.test.tsx`, `list-no-loading.test.ts`, `project-components.test.tsx`, `Header.test.tsx`) |
| `pnpm build` | **PASS** (exit 0). Route danh sách build bình thường, không có lỗi client/server boundary. |

Residual risk: các integration test không chạy được vì DB đang recovery. Diff không đụng server/data nên rủi ro thấp, nhưng nên chạy lại `pnpm test` khi DB đã ổn, trước khi commit.

## Acceptance criteria
| AC | Kết quả | Bằng chứng |
|---|---|---|
| Trang danh sách có trạng thái chờ khi bấm phân trang/chip/tab/bộ lọc: vùng kết quả mờ + `aria-busy`, link chờ có chỉ báo, không chặn thao tác | **Một phần** | Phân trang (`Pagination.tsx:58,99`), chip/tab (`CategoryListTemplate.tsx:68`, `RentalListPage.tsx:126`) và form lọc `/du-an`, `/tuyen-dung` (`FormPendingMarker`) đều báo lên `ListPendingProvider` → `PendingRegion` (`CategoryListTemplate.tsx:97-111`). Không có `pointer-events:none`. **Thiếu:** chip xoá bộ lọc và "Xoá tất cả" ở `/cho-thue`, cùng link "Xoá bộ lọc" trong EmptyState (xem MAJOR-1). |
| Không thêm `loading.tsx`; `?page=` vượt vẫn 404 | OK | Diff không thêm `loading.tsx` và không thêm `Suspense` trên đường render; `notFound()` vẫn được gọi trong page trước khi render. Provider/Region chỉ là client context, không stream khung chờ. Test chặn nay đi ngược từ từng `page.tsx` lên `src/app`, có cả `(frontend)` và `app` (`list-no-loading.test.ts:24-48`), có sanity check đường dẫn và kiểm `page.tsx` tồn tại. |
| Reduced motion, không CLS, JS client tối thiểu | OK | Hiệu ứng chỉ là `opacity` và `transition-opacity` + `motion-reduce:transition-none` (`PendingRegion.tsx:49`). Wrapper `PendingRegion` dùng `flex flex-col gap-8`, khớp với container cha nên spacing không đổi. Lưới và thẻ vẫn là Server Component, chỉ được truyền qua dưới dạng `children`. Mỗi link thêm một marker `useLinkStatus`, rất nhẹ. |
| Ghi gap design-spec §3.5, không sửa intent doc | OK | Gap ghi ở `tasks/tami-website/layer-10-task-04.md` Notes; `.context/design-spec.md` không bị sửa. Primary cần đưa gap vào BACKLOG khi close-out. |
| Test: RTL link chờ → `aria-busy`; mở rộng test chặn | OK | `PendingRegion.test.tsx:40-47`; `list-no-loading.test.ts`; L13-T03 đã đánh dấu xong mục follow-up. |

`next/form` thay form GET: không JS thì render ra `<form action=...>` không có `method`, tức GET mặc định. Input ẩn `category` và `name` của các select giữ nguyên nên tham số URL như cũ. Khi có JS, app router (`next/dist/client/app-dir/form.js:137-144`) tự dựng URL từ FormData rồi gọi `router.push`. Vì vậy hành vi URL và không-JS không đổi. Còn `useFormStatus` báo pending được là nhờ React bật form status khi `onSubmit` vừa `preventDefault` vừa lên lịch một transition. Điểm này chưa có test (MINOR-3).

## Responsive Checklist Gate (diff chỉ đổi class trạng thái, không đổi bố cục)
- Layout, không cuộn ngang: OK. Chỉ thêm wrapper `div` flex-col gap-8, không có width cố định. Chip cuộn ngang vẫn dùng class như cũ.
- Mobile-first / grid auto-fit: N/A, diff không đổi grid.
- Typography/spacing: OK, không đổi font-size; spacing giữ `gap-8`.
- Media: N/A.
- Touch target ≥ 44px: OK, `PendingLink` giữ nguyên class `min-h-11`/`min-w-11` của link cũ.
- Nav mobile / table: N/A.
- `100vh`: N/A. Reduced motion: OK (`motion-reduce:transition-none`). Không dùng `overflow:hidden` để che lỗi: OK.
- Residual risk: chưa kiểm bằng browser ở 375/768/1280; kết luận trên dựa vào phân tích class CSS.

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, oxlint chưa cấu hình (không có `.oxlintrc*`). ESLint PASS.
- ocr (open-code-review): skip, chưa cài `ocr`.
- AI-readable: OK. Có 2 indicator: trùng tên `PendingRegion` (MINOR-4) và comment cũ (MINOR-1). Dưới ngưỡng 3 nên không FAIL.
- ai-friendly-web: N/A, task không đổi robots/sitemap/llms.
- blitzstrike: N/A, task không đụng auth hay input server.
- Surgical diff: OK, mọi thay đổi đều trace về task.

## Findings

### [MAJOR-1] Link bộ lọc ở `/cho-thue` và trong EmptyState chưa báo trạng thái chờ
- `src/components/rentals/ActiveFilters.tsx:67` (chip "Đang lọc", bấm để xoá một điều kiện) và `:79` ("Xoá tất cả") vẫn dùng `next/link`.
- `src/components/layout/EmptyState.tsx:32` (`clearFiltersHref`, "Xoá bộ lọc") cũng vẫn là `next/link`. Link này hiện trên `/du-an`, `/tuyen-dung` và `/cho-thue` khi kết quả trống.
- Hậu quả: bấm các link này thì vùng kết quả không mờ, không có `aria-busy`, link cũng không có chỉ báo. Đây đúng là phàn nàn gốc của D5, và AC1 ghi rõ "chip/bộ lọc".
- Fix: đổi ba chỗ trên sang `PendingLink` từ `@/components/layout/PendingRegion`, giữ nguyên `scroll={false}`, `aria-label` và class. Cả ba đều nằm trong `ListPendingProvider` (RentalListNavigationProvider / CategoryListTemplate) nên không cần nối dây thêm. Nên cân nhắc đổi cả `backHref` trong EmptyState cho đồng nhất. Thêm một assertion RTL cho chip xoá bộ lọc.

### [MINOR-1] Comment cũ
`src/components/projects/ProjectFilters.tsx:28` vẫn viết "`<form method="get">` thuần HTML", trong khi code đã dùng `next/form`. Sửa lại cho giống `JobFilters.tsx:26`.

### [MINOR-2] Assertion test quá lỏng
`src/components/projects/project-components.test.tsx:76`: `not.toHaveAttribute("method", "post")` vẫn PASS khi `method="POST"` hoặc một giá trị bất kỳ khác. Nên dùng `expect(form.getAttribute("method")).toBeNull()` (hoặc `expect((form as HTMLFormElement).method).toBe("get")`).

### [MINOR-3] `FormPendingMarker` chưa có test
`FormPendingMarker` (`PendingRegion.tsx:73-77`) chưa có test nào cho luồng submit bộ lọc → `aria-busy`. `JobFilters` cũng không có test form. Nên thêm RTL test, mock `useFormStatus` trả `pending: true` rồi kiểm vùng kết quả `aria-busy=true`, để khoá contract này.

### [MINOR-4] Hai component cùng tên `PendingRegion`
`src/components/rentals/RentalListNavigation.tsx:42` export `PendingRegion` trùng tên với `src/components/layout/PendingRegion.tsx:46`; file rentals phải import lại với alias `ListPendingRegion`. Đổi bản rentals thành `RentalPendingRegion` để grep và AI đọc không nhầm.

## Verdict: ❌ FAIL
Còn 1 MAJOR (MAJOR-1: link xoá bộ lọc chưa báo trạng thái chờ). Các phần còn lại ổn: không có `loading.tsx`, 404 không bị ảnh hưởng, `next/form` giữ được hành vi không-JS, reduced motion, CLS, JS client tối thiểu, gap doc. Builder sửa MAJOR-1; các MINOR nên sửa cùng lượt. Round 2 nên chạy lại `pnpm test` toàn bộ khi Postgres đã hết recovery mode.
