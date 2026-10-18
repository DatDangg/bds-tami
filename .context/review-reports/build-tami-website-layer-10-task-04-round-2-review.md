Agent: reviewer

# Review: build-tami-website, layer-10-task-04, round 2 (trạng thái chờ phía client cho trang danh sách, D5)

- **Review level:** STRICT
- **Reason:** diff đổi các component dùng chung cho mọi trang danh sách công khai: `Pagination`, `CategoryListTemplate`, `EmptyState`, `PendingRegion` mới. Đổi `<form method="get">` sang `next/form`. Có risk soft-404/404 và ISR. Task file yêu cầu STRICT.
- **Worktree:** `D:/prj/bds-wt10-t04` (branch `wt/l10-t04`, base `ef39df4`, chưa commit). Bỏ qua `src/payload-types.ts` (chỉ đổi EOL).
- **Blast radius:**
  - Component: `src/components/layout/{PendingRegion,Pagination,EmptyState}.tsx`, `src/components/templates/CategoryListTemplate.tsx`, `src/components/rentals/{ActiveFilters,RentalListNavigation,RentalListPage}.tsx`, `src/components/{projects/ProjectFilters,careers/JobFilters}.tsx`.
  - Trang bị ảnh hưởng: `/du-an`, `/tin-tuc`, `/tin-bds`, `/tuyen-dung`, `/cho-thue` (gồm cả các trang danh mục), cùng mọi chỗ dùng `EmptyState`.
  - Export `PendingRegion` của rentals đổi tên thành `RentalPendingRegion`. Typecheck PASS nên không còn chỗ nào import tên cũ.
  - Không đụng API, DB, auth hay route config.

## Finding round 1: đã đóng hết
| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1: ActiveFilters/EmptyState chưa báo trạng thái chờ | **Đã đóng** | `ActiveFilters.tsx:67,79` dùng `PendingLink`, giữ `scroll={false}`, `aria-label` và class. `EmptyState.tsx:33` ("Xoá bộ lọc") dùng `PendingLink` bên trong `Button asChild`. Thêm nữa: `RentalListPage.tsx` đổi cả `Suggestions` (gợi ý bỏ điều kiện) và link thử lại của `ListError`. `RentalListNavigationProvider` nay bọc thêm `ListPendingProvider` nên link ở `/cho-thue` cũng báo được lên vùng kết quả. Có test RTL: `PendingRegionSources.test.tsx:32-56`. |
| MINOR-1: comment cũ | **Đã đóng** | `ProjectFilters.tsx:28` nay mô tả `<Form>` (next/form, GET). |
| MINOR-2: assertion quá lỏng | **Đã đóng** | `project-components.test.tsx:76` nay là `expect(form.getAttribute("method")).toBeNull()`. |
| MINOR-3: `FormPendingMarker` chưa có test | **Đã đóng** | `PendingRegionSources.test.tsx:58-85` mock `useFormStatus`: khi pending thì `aria-busy=true`, hết pending thì `false`. |
| MINOR-4: hai component cùng tên `PendingRegion` | **Đã đóng** | Bản rentals đổi thành `RentalPendingRegion` (`RentalListNavigation.tsx:42`). `RentalListPage.tsx` và `RentalFilters.test.tsx` đã cập nhật theo. |

## Kiểm hồi quy
- `RentalPendingRegion` bọc `ListPendingRegion` với `forcePending={pending}`, nên vùng kết quả mờ khi một trong hai điều kiện đúng:
  - transition của bộ lọc client đang chạy;
  - link đang chờ.

  Class `transition-opacity`, `opacity-50` và `aria-busy` giữ nguyên như cũ, và có thêm `motion-reduce:transition-none`.
- `Button asChild` + `PendingLink`: Radix Slot gộp className của button vào props của `PendingLink`, sau đó `PendingLink` nối thêm class chờ qua `cn`. Bố cục button không đổi.
- Dùng `PendingLink` ngoài provider (ví dụ `EmptyState` ở trang khác) thì không làm gì cả (`useReportPending` dùng optional chaining), nên không lỗi.
- Không thêm `loading.tsx` hay `Suspense`. `notFound()` vẫn được gọi trong page. Test chặn `list-no-loading.test.ts` PASS.

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm build` | PASS (exit 0) |
| `pnpm test` (toàn bộ) | exit 1, **do môi trường**: lúc chạy, Postgres báo `the database system is in recovery mode`. Tất cả `tests/integration/*` lỗi ngay khi connect. Cùng lần chạy đó có `health` 503, `unaccent` và focus-trap `Header` timeout 5079ms khi máy tải nặng. |
| `pnpm test src/components src/app src/lib` | 134/135 file PASS, 1344/1344 test PASS. File fail duy nhất là `src/lib/contrast.test.ts` (lỗi CRLF worktree đã biết, ngoài diff). |
| `pnpm test tests/integration/{jobs-email,media-upload,projects,access}.test.ts` (chạy riêng, sau khi DB hết recovery) | **4/4 file PASS, 78/78 test** |
| `pnpm test tests/integration` (chạy lại cả thư mục, sau khi DB hết recovery) | **49/49 file PASS, 650/650 test** |

Residual risk: test focus-trap của `Header` chỉ timeout khi cả suite chạy song song. Nó nằm ngoài diff, và PASS ở lần chạy `src/components` riêng. Chưa kiểm bằng browser thật.

## Responsive Checklist Gate (diff chỉ đổi class trạng thái, không đổi bố cục)
- Layout không cuộn ngang: **OK**. Không thêm width cố định. `RentalPendingRegion` chỉ là wrapper `div` mang className như cũ (`flex flex-col gap-6`).
- Mobile-first / grid auto-fit: **N/A**, diff không đổi grid.
- Typography/spacing: **OK**, không đổi font-size hay khoảng cách.
- Media: **N/A**.
- Touch target ≥ 44px: **OK**. Mọi `PendingLink` mới giữ `min-h-11` của link cũ. Nút trong EmptyState vẫn lấy kích thước từ `Button`.
- Nav mobile / table: **N/A**.
- `100vh`: **N/A**. Reduced motion: **OK** (`motion-reduce:transition-none`). Không dùng `overflow:hidden` để che lỗi: **OK**.
- Residual risk: chưa kiểm bằng browser ở 375/768/1280. Kết luận dựa trên phân tích class CSS.

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, oxlint chưa cấu hình. ESLint PASS.
- ocr (open-code-review): skip, chưa cài `ocr`.
- AI-readable: **OK**. Hai indicator của round 1 (comment cũ, trùng tên) đã gỡ; không phát sinh indicator mới.
- ai-friendly-web: N/A, task không đổi robots/sitemap/llms.
- blitzstrike: N/A, task không đụng auth hay input phía server.
- Surgical diff: **OK**, mọi thay đổi đều trace về task D5 hoặc finding round 1.

## Findings
Không còn CRITICAL hay MAJOR.

### [MINOR-1] Task file chưa ghi lại attempt 2
`tasks/tami-website/layer-10-task-04.md:49` vẫn ghi `Attempt: 0`. Mục "Đã làm" (dòng 85) chưa nhắc tới ActiveFilters, EmptyState, Suggestions/ListError và việc đổi tên `RentalPendingRegion`. Fix: primary/builder cập nhật lúc close-out.

### [MINOR-2] Link "Quay lại danh sách" trong EmptyState vẫn dùng `next/link` (không chặn)
`EmptyState.tsx:43` (`backHref`, variant `empty`) chưa có chỉ báo chờ. Link này rời sang danh sách cha chứ không phải thao tác lọc, nên AC1 không yêu cầu. Có thể đổi sang `PendingLink` cho đồng nhất nếu muốn.

## Verdict: ✅ PASS
MAJOR-1 và MINOR-1..4 của round 1 đã đóng, có test. Lint, typecheck và build PASS. Toàn bộ test unit liên quan và 49/49 file integration PASS. Phần fail còn lại chỉ do môi trường (DB recovery lúc chạy song song) hoặc lỗi CRLF đã biết, không liên quan tới diff.
