# feature-site-redesign-homepage-style · phase-1-task-00 — `/du-an`: từ khoá + Chủ đầu tư + sắp xếp (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045). Spec: khối BL-045 mục "Trang danh sách" (đoạn **Dự án (Q1 — lọc thật, ADDITIVE)**) — thay câu "không ô từ khoá" của F2.
- Mockup: `docs/specs/site-redesign-mockup/index.html` view `list-project` (ô "Nhập tên dự án, khu vực…", "Chủ đầu tư", "Sắp xếp: Mới nhất").
- Phụ thuộc: không. **Song song được với T01 + T02** (wave A; chỉ đụng lib/query/url-params/metadata, không đụng UI). T03 phụ thuộc task này.
- Trạng thái: `done` — STRICT PASS round 1, commit `389a816` (close-out BL-045 2026-10-21); trước đó `built — chờ review` (builder xong 2026-10-21); trước đó `pending` — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Classification / Risk
- Type: **ADDITIVE** (tham số URL mới cho `/du-an`) — sửa câu F2.
- Risk: **MEDIUM** — truy vấn danh sách dự án công khai (`src/lib/projects/project-queries.ts`), canonical/noindex khi lọc, URL contract mới.
- Expected review level: **STRICT** (query/URL contract, SEO noindex).
- Blast radius: `/du-an`, `/en/projects`, metadata; không đổi API REST công khai (danh sách dự án render server, không có endpoint public).
- Doc impact: `SPECIFICATIONS.md` F2 (publisher), `docs/API_SPEC.md` mục URL params nếu có, design-spec S02.

## Scope / files
1. `src/lib/projects/project-filter-params.ts` (hoặc nơi `parseProjectFilters`/`projectQueryString`/`hasFilterParams` đang ở): thêm `q` (≤ 100 ký tự, trim), `developer` (id hợp lệ, lạ → bỏ qua), `sort` (`newest` mặc định | `price_asc` | `price_desc`; lạ → mặc định). Tham số mặc định không lên URL.
2. `src/lib/projects/project-queries.ts` `listPublicProjects`: `q` khớp không dấu tên dự án + địa chỉ / tỉnh / phường (tái dùng chuẩn hoá không dấu đang dùng cho `searchText` cho thuê nếu có; không thì `like` trên trường đã có — **không thêm cột/migration**; cần cột mới → dừng hỏi); `developer` lọc quan hệ; `sort` theo `publishedAt`/`createdAt` hoặc `priceFromVnd` (null cuối). Truy vấn p95 ≤ 500ms (NFR).
3. `listDevelopersWithPublicProjects(locale)` cho ô Chủ đầu tư (chỉ chủ đầu tư có dự án công khai).
4. `buildProjectListMetadata`: có `q`/`developer`/`sort` khác mặc định → `noindex, follow` + canonical `/du-an` như lọc hiện tại.
5. Tests: `project-filter-params.test.tsx` (**file dirty EOL — chỉ thêm phần của mình**), `project-queries` test (q không dấu, developer, sort, kết hợp với category/province/status, phân trang), metadata noindex.

## Acceptance
- [ ] `/du-an?q=crown`, `?developer=<id>`, `?sort=price_asc` lọc / sắp đúng; kết hợp tham số cũ; `page` giữ; lạ → bỏ qua không 500.
- [ ] Có tham số mới → `noindex, follow`, canonical `/du-an`.
- [ ] Không migration; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify
`pnpm vitest run src/lib/projects src/components/projects` → `pnpm typecheck` → `pnpm lint` → mở http://localhost:3000/du-an?q=... (không chạy thêm `pnpm dev`).

## Retry / Escalation
Như T01.

## Verification summary (builder điền)
- Acceptance criteria: PASS (q / developer / sort lọc + sắp đúng ở tầng truy vấn, kết hợp tham số cũ, page giữ, id/sort lạ bỏ qua; noindex+canonical /du-an; không migration)
- Verify commands + result: `pnpm vitest run src/lib/projects src/components/projects` 122/122 PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs); `pnpm test` toàn bộ: 3101 pass, 3 file integration fail (access / jobs-email / media-upload — cần DB+SMTP+S3 thật, không liên quan task, beforeAll hỏng nên skip toàn bộ)
- Reviewer verdict: **STRICT PASS** (round 1) — report `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-00-round-1-review.md`; commit `389a816` trên `staging`.

## Quyết định builder tự chọn
- File tham số thật là `src/lib/projects/project-filters.ts` (không phải `project-filter-params.ts`); test params ở `src/components/projects/project-filter-params.test.tsx`.
- Không có cột `searchText` cho dự án và cấm migration → `q` / sort theo giá chạy ở bộ nhớ: quét dự án công khai (≤ 20 trang x 50, select tối thiểu: title/address/province/ward/priceFromVnd) → `normalizeSearchText` khớp tên + địa chỉ + phường + tỉnh → xếp → cắt trang → lấy lại thẻ theo `id in`. Sort theo giá cũng đi đường này vì Postgres đặt NULL đầu khi DESC, SQL không "trống cuối" được qua Payload. Không q và sort newest → một truy vấn SQL như cũ. Số dự án công khai chỉ vài chục nên p95 ổn; nếu lên hàng trăm thì cân nhắc cột `searchText` + migration (cần user duyệt).
- `developer` là id thô; trang chỉ áp khi id có trong `listDevelopersWithPublicProjects` (id lạ bị bỏ, không 500, không lọc rỗng). Chỉ gọi hàm đó khi URL có `?developer=`.
- `q` > 100 ký tự bị bỏ (cùng quy tắc `firstValue` các tham số khác). `sort=newest`/lạ → mặc định, không noindex.
- Nối tối thiểu vào `ProjectListPage.tsx` (truy vấn + carry link chip/phân trang + `filtersActive`) để URL hoạt động; ô nhập UI (q, Chủ đầu tư, sort) để T03.
- Thứ tự URL: category, province, status, q, developer, sort, page (golden cũ không đổi).

## Residual risk
- Form `ProjectFilters` hiện tại chưa mang q/developer/sort qua lần submit (UI do T03).
- Đường quét bộ nhớ cắt ở 1000 dự án công khai.
