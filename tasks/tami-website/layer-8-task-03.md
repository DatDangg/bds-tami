# Task 03: Trang Danh sách Cho thuê (S04): bộ lọc trên URL, tìm không dấu, sắp xếp

## Layer
8 — Global trang chủ, dữ liệu lead, danh sách Cho thuê, trang Đăng tin BĐS, sitemap

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — trang chuyển đổi chính, bộ lọc/URL là contract chia sẻ, hiệu năng
- Blast radius: src/app/(frontend)/[locale]/cho-thue/page.tsx; src/components/rentals/RentalFilters.tsx (client), RentalCard.tsx, SortSelect.tsx; src/lib/search/url-params.ts (parse/serialize, dùng chung với API)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-04
- NFR-01
- design-spec S04, §3.5

## Description
`/cho-thue` · `/en/for-rent` render server qua `SearchService`, bộ lọc client cập nhật URL.

## Dependencies
- `layer-7-task-02` `SearchService` + `GET /api/public/rentals` + index trigram (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-03`, `layer-13-task-03`

## Acceptance Criteria
- [x] Mọi bộ lọc phản ánh trên URL; mở URL chia sẻ ra đúng kết quả; tham số lạ bị bỏ qua
- [x] `?q=` từ header search hoạt động (`?q=` rỗng → danh sách không lọc + focus ô từ khoá; `?q=abc` lọc + tiêu đề "Kết quả cho “abc”")
- [x] Lọc phường phụ thuộc tỉnh; danh mục gồm danh mục con
- [x] Không có kết quả → trạng thái trống + nút xoá bộ lọc (+ tối đa 3 gợi ý "Bỏ <điều kiện>")
- [x] Bộ lọc mobile dạng Sheet; desktop thanh lọc; không cuộn ngang 375px (đo `scrollWidth = 375` trên build thật)
- [x] Danh sách có trang `noindex` khi tổ hợp lọc sâu (tránh trùng lặp; trang gốc + lọc danh mục/tỉnh vẫn index)

## Tests cần viết
- Unit url-params: round-trip
- Integration render: URL có lọc → đúng tập kết quả
- RTL: đổi bộ lọc → URL đổi

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-8-task-03-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 1
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: STRICT round 1 PASS (`.context/review-reports/build-tami-website-layer-8-task-03-round-1-review.md`); 7 MINOR → follow-up dưới / L13-T03 / BL-006
- Chưa làm (ghi gap): skeleton 6 thẻ S04 lần tải đầu (trang là server component đọc `searchParams`, không có trạng thái loading client); job reindex nền khi vượt ngưỡng 500 (cần migration enum task) → BL-006
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-8): task-03 pubrentlist` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-8/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/cho-thue/page.tsx
- src/components/rentals/RentalFilters.tsx (client), RentalCard.tsx, SortSelect.tsx
- src/lib/search/url-params.ts (parse/serialize, dùng chung với API)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 6
- [x] G27 (LOW): route mới thêm rule vào `MISSING_PAGE_RULES` để slug lạ trả 404 có nội dung (G15), không quay lại 404 rỗng. Report: `.context/review-reports/spec-validation-build-tami-website-layer-6.md`.
  - Trang `/cho-thue` không có slug động nên không cần quy tắc mới; để G27 không tái diễn, thêm test `resolve-missing-page.test.ts` "MISSING_PAGE_RULES phủ mọi trang động": quét `app/(frontend)/[locale]/**/page.tsx` có đoạn `[x]` và đòi khoá `pathnames` tương ứng có trong `MISSING_PAGE_RULES` (L10-T03 thêm `/cho-thue/danh-muc/[category]` + `/khu-vuc/[province]` sẽ tự đỏ nếu quên).

## Follow-up từ review layer-7-task-02 (round 1, MINOR)
- [x] `src/lib/search/rental-search-sql.ts:50`: lọc `ward` chỉ theo slug — slug phường chỉ unique trong tỉnh → giới hạn ward theo province (hoặc bắt buộc gửi kèm `province`, ghi API_SPEC §3.3). **Làm cả hai:** schema API từ chối `ward` thiếu `province` (400), SQL lọc phường THUỘC tỉnh; URL trang bỏ `ward` không kèm `province`.
- [x] `rental-search-sql.ts:27`: danh mục cha đã xoá mềm vẫn khớp → thêm `t."deleted_at" IS NULL`.
- [x] `rental-search-sql.ts:36-41`: điều kiện công khai chép tay từ `publicWhere` → snapshot test `buildPublicWhere` để khi thêm hẹn giờ `publishedAt` (FR-ADM-16) test đỏ. (Inline snapshot `buildPublicWhere(rentals)` + `publicWhere(rentals, vi|en)` trong `rental-search-sql.test.ts`.)
- [x] `scripts/bench/rentals-search.ts`: chặn chạy khi `NODE_ENV=production` / `APP_ENV` staging|production hoặc host DB không phải dev (tránh chèn 100.000 tin giả published). (`scripts/bench/bench-guard.ts` + `tests/unit/bench-guard.test.ts`; host chỉ localhost/127.0.0.1/::1, không có cờ vòng.)
- [~] Hook reindex `src/hooks/{wards,projects}/reindex-rentals.ts` chạy đồng bộ trong transaction admin → đẩy sang job nền khi số tin vượt ngưỡng. **Làm một nửa:** ngưỡng `SYNC_REINDEX_LIMIT = 500` (`src/lib/search/reindex-in-hook.ts`) — vượt thì KHÔNG làm trong transaction, log lỗi chỉ lệnh bù `pnpm reindex:rentals-search`, lần lưu vẫn thành công. **Chưa làm:** job nền tự bù, vì task Payload Jobs mới cần thêm giá trị vào enum `task_slug` của `payload_jobs`/`payload_jobs_log` = MIGRATION (task này cấm tạo migration). Cần task riêng có migration (xem `20261018_075627_property_posts` làm mẫu).
- [x] Đổi tên tỉnh chưa có hook reindex (đang dựa `pnpm reindex:rentals-search`). (`src/hooks/provinces/reindex-rentals.ts`, chỉ chạy khi `name` đổi; test tích hợp trong `rental-search.test.ts`.)
- [x] Gộp `RentalCardData`/`RentalCard` cục bộ của trang chi tiết (L7-T03, `src/lib/rentals/rental-view.ts`, `SimilarRentals`) với DTO `RentalCard` của `GET /api/public/rentals` (`src/shared/types/api.ts`, L7-T02) — một component thẻ dùng chung. (`src/components/rentals/RentalCard.tsx` dùng cho danh sách S04 + tin tương tự S07; `searchCardToRentalCardData` map DTO → cùng view model.)

## Follow-up từ spec-validation layer 7 (G29)
- [x] (từ L7-T03) `src/lib/rentals/rental-queries.ts:71` thẻ tin tương tự: ảnh đầu gallery bị xoá → dùng ảnh kế tiếp; `:74` truyền `locale` khi đọc ảnh bìa.
- [x] (từ L7-T04) `POST /api/public/job-applications`: thêm `code: "postingClosed"` máy đọc được cho tin hết hạn, `ApplyForm` dựa vào code thay cho quy ước "400 không details"; sửa comment `job-applications.ts:58`, `ApplyForm.tsx:39`, API_SPEC §3.2.
- [x] (từ L7-T01) test migration `property_posts` chèn thêm dòng `payload_jobs_log` của `expire-offers` để bắt trường hợp bỏ `DELETE FROM payload_jobs_log` trong `down`.
- [x] D2 (user duyệt 2026-10-18): tin tương tự của trang chi tiết cho thuê lọc thêm giá ±30% (design-spec S07); nếu ra dưới 4 tin thì bỏ điều kiện giá, giữ cùng danh mục + tỉnh. Có test.

## Builder notes (quyết định thiết kế, chờ reviewer)
- **Doc impact:** `docs/API_SPEC.md` (§2 `code` máy đọc được, §3.2 `postingClosed`, §3.3 `ward` cần `province` + tham số `available` + as-built L8-T03), `docs/ARCHITECTURE.md` (cây thư mục `lib/search`, `lib/rentals`). Không đụng schema/ERD, không migration.
- **API thêm `available=true`** (chỉ tin `published`): S04 không liệt kê tin `rented` nhưng API L7-T02 trả cả hai; thay vì tham số "ngầm" chỉ trang dùng được, đưa thành tham số công khai để Sheet đếm "Xem n tin" qua chính endpoint này khớp số trên trang.
- **URL trang khoan dung hơn API:** `parseRentalFilters` kiểm từng khoá bằng chính schema của API, giá trị sai/rỗng/khoá lạ bị bỏ (API vẫn 400); `ward` không `province` bị bỏ; min > max đảo lại; slug danh mục/tỉnh/phường không tồn tại bị bỏ ở `dropUnknownSlugs` (như `/du-an`), không 404.
- **noindex:** `hasNarrowingParams` — trang gốc, một danh mục hoặc một tỉnh (kèm `page`) index, canonical là chính nó, không khai hreflang (slug khác nhau theo ngôn ngữ). Mọi tổ hợp sâu hơn (từ khoá, phường, giá, diện tích, phòng ngủ, nội thất, danh mục + tỉnh) hoặc đổi sắp xếp → `noindex, follow`, canonical về `/cho-thue` sạch.
- **Chip loại hình = `?category=` (không phải trang S05)**: route `/cho-thue/danh-muc/[category]` + `/khu-vuc/[province]` chưa tồn tại (L10-T03), link tới đó hiện sẽ 404. L10-T03 đổi chip sang URL S05 (và thêm quy tắc `MISSING_PAGE_RULES`; test G27 bắt nếu quên).
- **Bộ lọc client:** một bản nháp (`useLiveDraft`) dùng chung thanh desktop + thanh dính mobile; URL là nguồn sự thật (đổi từ ngoài thì nạp lại, đổi do chính lần commit thì không nuốt chữ đang gõ — có test); gõ chờ 300ms, chọn/chip đổi ngay, luôn về trang 1, `router.replace(..., { scroll: false })`. Sheet mobile có bản nháp riêng, đếm sống bằng `limit=1`, phường tải qua REST `/api/wards` khi đổi tỉnh trong Sheet.
- **Trạng thái:** đổi bộ lọc → `PendingRegion` mờ 50% + `aria-busy`; lỗi truy vấn → khung `role="alert"` + "Thử lại" (log lỗi, không sập trang); trống khi lọc → `EmptyState` + tối đa 3 link "Bỏ <điều kiện>".
- **Chưa làm / ghi nhận:** (1) job nền reindex (cần migration, xem follow-up). (2) Skeleton "loading lần đầu 6 thẻ" của S04: trang là Server Component đọc `searchParams` nên không có trạng thái loading lần đầu phía client (bỏ). (3) Tên tỉnh trên thẻ từ `SearchService` là `provinces.name` (đầy đủ), trong khi thẻ tin tương tự dùng `shortName` — lệch nhãn nhỏ giữa hai nơi, sửa cần đổi DTO API (ngoài phạm vi).
- **Verify (worktree `D:\prj\bds-wt8-t03`):** `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS (162 file; một lần chạy dưới tải có 4 file timeout hạ tầng, chạy lại riêng đều PASS) · `pnpm build` PASS · kiểm tay build thật `/cho-thue` ở 375px (không cuộn ngang, Sheet mở được, đếm sống) và 1280px.

## Follow-up từ review layer-8-task-03 round 1 (MINOR) → layer-13-task-03
- MINOR-1, 3, 4, 5, 7 chuyển sang `layer-13-task-03.md` (trang khu vực cho thuê dùng chung code danh sách). MINOR-6 (ARCHITECTURE cây component) primary reconcile lúc merge. MINOR-2 → BACKLOG BL-006.
