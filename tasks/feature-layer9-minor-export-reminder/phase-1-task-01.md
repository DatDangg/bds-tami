# feature-layer9-minor-export-reminder · phase-1-task-01 — Xuất Excel lead: thông báo khoá nút rõ toán tử, so khoảng ngày bằng `Date.parse`, dò thùng rác phía server, ẩn nút trong list drawer

- Change doc: `spec/changes/2026-10-19-layer9-minor-export-reminder.md` (BACKLOG BL-009, mục 1–4)
- Nguồn: review L9-T05 round 3 (`.context/review-reports/build-tami-website-layer-9-task-05-round-3-review.md` MINOR-1, MINOR-2, mục "Dò trash bằng pathname", Residual risk list drawer) + spec-validation layer 9 G33
- Spec: `SPECIFICATIONS.md` F9 (dòng "xuất Excel …" — đã thêm: toán tử hỗ trợ, khoá nút kèm thông báo nêu toán tử, không hiện ở thùng rác / list drawer)

## Hiện trạng (change-request đã đọc code)
- `src/lib/leads/export-filters.ts`
  - `:94-95` `UNSUPPORTED_FILTER_MESSAGE`: "…toán tử khác \"bằng\"/khoảng ngày…" — admin chọn `greater_than`/`less_than` trên Ngày tạo (cũng là "khoảng ngày") bị khoá mà không rõ lý do.
  - `:72` so `filters.createdFrom > filters.createdTo` bằng chuỗi sau `toISOString()`; năm > 9999 (vd `9999-12-31T23:00-05:00` → `+010000-…`) đảo thứ tự → không trả 400 cho khoảng ngược.
  - Toán tử date WhereBuilder cho phép (`@payloadcms/ui/dist/elements/WhereBuilder/field-types.js:21-34,68-70`): equals, not_equals, in, not_in, exists, greater_than, less_than, greater_than_equal, less_than_equal. Hỗ trợ xuất: status/source/assignedTo `equals`; createdAt `greater_than_equal`/`less_than_equal`.
- `src/components/admin/LeadExportButton.tsx` (client, `beforeList` của `leads` — `src/collections/Leads.ts:180`): dò thùng rác bằng `usePathname()` + regex `TRASH_VIEW_PATH` (`:12,43`). Trong list drawer (quan hệ tới `leads` từ collection khác) nút vẫn hiện; `filterOptions` của drawer không nằm trong `query.where` → có thể xuất rộng hơn drawer.
- Payload 3.91 `@payloadcms/next/dist/views/List/index.js:274-301`: slot `beforeList` là server slot, nhận `serverProps` gồm `params` (segments), `searchParams`, `user`, `collectionConfig`… — trash view = `params.segments` `["collections","leads","trash"]` (`getRouteData.js:224-251`). `viewType` KHÔNG truyền vào slot. Drawer: `drawerSlug` → `isInDrawer` (`:302`); client có `useListDrawerContext().isInDrawer` (`@payloadcms/ui` export).
- Test hiện có: `src/lib/leads/export-filters.test.ts`, `src/components/admin/LeadExportButton.test.tsx`, integration `tests/integration/leads-export.test.ts`.

## Classification / Risk
- Type: **MODIFY** (UX thông báo + chặt hoá validate + đổi cách dò trash + ẩn nút trong drawer). Không đổi contract API `GET /api/admin/leads/export`.
- Risk: **MEDIUM** — component dùng chung list view `leads` (list/trash/drawer), luồng xuất PII (fail-closed phải giữ nguyên), importMap admin.
- Review level expected: **STRICT** (export PII + admin component dùng chung) — reviewer tự quyết.

## Thiết kế (gợi ý — builder chốt theo code thật, đơn giản nhất)
1. **Thông báo**: viết lại `UNSUPPORTED_FILTER_MESSAGE` liệt kê rõ điều kiện hỗ trợ, vd: "Chỉ xuất được khi bộ lọc dùng: Trạng thái / Nguồn / Sale phụ trách với \"bằng\"; Ngày tạo với \"lớn hơn hoặc bằng\" / \"nhỏ hơn hoặc bằng\" (mỗi phía một lần). Không hỗ trợ ô tìm kiếm, nhiều nhóm điều kiện \"hoặc\" và các toán tử khác. Hãy đổi bộ lọc rồi xuất lại." Nhãn toán tử khớp nhãn tiếng Việt Payload admin hiển thị (kiểm `@payloadcms/translations` vi: `isGreaterThanOrEqualTo` …) để admin nhận ra. Test assert thông báo chứa tên toán tử.
2. **Date.parse**: `:72` so `Date.parse(createdFrom) > Date.parse(createdTo)`. Test ca biên: khoảng ngược khác múi giờ (`+07:00` vs `Z` cùng/khác thời điểm), bằng nhau → OK, năm 9999 vượt sang `+010000` → 400.
3. **Trash phía server**: bọc nút bằng server component (vd `LeadExportSlot` server, file riêng không `"use client"`) đăng ký làm `beforeList`, nhận server props (`params`), kiểm `params.segments` (vd phần tử cuối/thứ 3 === `"trash"`) → không render; còn lại render `<LeadExportButton />` client. Có thể kiểm luôn `user.role === "admin"` phía server (giữ check client hay không — builder quyết, ghi decision). Bỏ `usePathname` + `TRASH_VIEW_PATH` khỏi client nếu không còn cần. `pnpm generate:importmap` sau khi đổi đường dẫn component; `src/collections/Leads.ts` đổi `beforeList`.
4. **Ẩn trong list drawer**: client `useListDrawerContext().isInDrawer` → `return null` (hook gọi trước mọi return sớm, đúng rules-of-hooks). Kiểm hook không throw khi ngoài drawer (context mặc định). Nếu server props có tín hiệu drawer chắc chắn hơn thì dùng, ghi decision.
- Test: unit `export-filters.test.ts` (thông báo + Date.parse ca biên), `LeadExportButton.test.tsx` (drawer → null), unit cho server slot (trash segments → null, list → render nút). Cập nhật doc comment.
- Doc impact: `docs/API_SPEC.md` §4 nếu có mô tả 400 khoảng ngược/nút (as-built); `docs/ARCHITECTURE.md` nếu có liệt kê component admin.

## Acceptance
- [ ] Nút xuất bị khoá → thông báo liệt kê toán tử/field hỗ trợ
- [ ] `createdFrom > createdTo` so bằng `Date.parse`; test ca biên (múi giờ khác, năm > 9999)
- [ ] Trạng thái thùng rác xác định phía server (server component đọc `params`), không còn regex pathname client
- [ ] Nút xuất không hiện trong list drawer
- [ ] Fail-closed giữ nguyên (mọi toán tử khác vẫn khoá); test cũ PASS
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` PASS

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`. Integration liên quan: `pnpm vitest run --project integration tests/integration/leads-export.test.ts`.
- Test fail sẵn không tính: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400".
- Report: `.context/review-reports/feature-layer9-minor-export-reminder-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Decision log
- (change-request) Tách 2 task: T01 xuất Excel (mục 1–4), T02 index job nhắc lead (mục 5). Mỗi task 1 commit.
- (change-request) Spec delta F9: liệt kê toán tử hỗ trợ + không hiện ở thùng rác/list drawer. Không đổi API.
- (builder) Trash phía server: `LeadExportSlot` (server, không `"use client"`) nhận `params` từ serverProps (`RenderServerComponent` chỉ truyền serverProps cho RSC), kiểm `segments[2] === "trash"` → null; prop type `Partial<Pick<BeforeListServerProps, "params">>` để test render không cần đủ serverProps. Drawer truyền `segments: ["collections", "leads"]` (`handleServerFunction.js:115`) nên slot vẫn render, client ẩn.
- (builder) Không lặp check `user.role === "admin"` ở server: client đã kiểm qua `useAuth`, endpoint kiểm lại (401/403); thêm check server chỉ là lớp thứ 3 không đổi hành vi → bỏ (ponytail).
- (builder) Drawer: dùng `useListDrawerContext().isInDrawer` (client). Ngoài drawer context mặc định là `{}` (`ListDrawer/Provider.js:3`) nên không throw, `isInDrawer` undefined → falsy. Hook gọi trước mọi return sớm.
- (builder) Bỏ `usePathname` + `TRASH_VIEW_PATH` khỏi client (orphan do task này); test client bỏ mock `next/navigation`.
- (builder) Nhãn toán tử trong thông báo lấy đúng `@payloadcms/translations` vi (`equals: 'bằng'`, `isGreaterThanOrEqualTo: 'lớn hơn hoặc bằng'`, `isLessThanOrEqualTo: 'nhỏ hơn hoặc bằng'`); tên field dùng tên nghiệp vụ tiếng Việt (Leads không khai `label`, Payload tự humanize tên field).
- (builder) `Date.parse` so trực tiếp trên chuỗi ISO đã chuẩn hoá (JS hỗ trợ năm mở rộng `+010000`), không đổi shape `LeadExportFilters`.

## Verification summary (builder)
- Files mới: `src/components/admin/LeadExportSlot.tsx`, `src/components/admin/LeadExportSlot.test.tsx`.
- Files sửa: `src/lib/leads/export-filters.ts` (message + `Date.parse`), `src/lib/leads/export-filters.test.ts`, `src/components/admin/LeadExportButton.tsx` (drawer, bỏ pathname), `src/components/admin/LeadExportButton.test.tsx`, `src/collections/Leads.ts` (`beforeList` → `LeadExportSlot`), `src/app/(payload)/admin/importMap.js` (`pnpm generate:importmap`, chỉ 2 dòng thật), `docs/API_SPEC.md` §4 as-built (slot server/trash/drawer/thông báo/Date.parse). `src/payload-types.ts` không đổi.
- TDD: RED 6 test fail trước fix (message, 9999 → +010000 lọt, drawer không ẩn, slot chưa có) → GREEN 40/40 ở 3 file.
- `pnpm lint` PASS (exit 0) · `pnpm typecheck` PASS (exit 0) · `pnpm test` 2529 passed / 1 failed — fail duy nhất là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" (fail sẵn, ngoài scope); `src/lib/contrast.test.ts` PASS · `pnpm build` PASS (exit 0) · `pnpm vitest run --project integration tests/integration/leads-export.test.ts` 12/12 PASS.
- oxlint: repo không có config oxlint → skip. Responsive: chỉ ẩn/hiện nút, không đổi layout → không ảnh hưởng checklist.
- Residual risk: chưa bấm tay trong admin thật (trash view / drawer) — xác minh bằng unit test với shape `params`/context đọc từ source Payload 3.91.

## Close-out (change-request)
- Review round 1: **STRICT PASS** — `.context/review-reports/feature-layer9-minor-export-reminder-phase-1-task-01-round-1-review.md`.
- MINOR-2 (dòng `docs/API_SPEC.md` chỉ đổi EOL ngoài task): change-request khôi phục EOL gốc 2 dòng, diff còn đúng 1 dòng as-built T05.
- MINOR-1 (field `status`/`source`/`assignedTo` của `leads` không khai `label` → bộ lọc admin có thể hiện tên tự sinh tiếng Anh, khác tên tiếng Việt trong thông báo): không sửa trong task này (ngoài scope, đổi nhãn admin cả cột danh sách); ghi residual risk + đề xuất follow-up trong report change.
- Doc impact: `docs/API_SPEC.md` §4 as-built T05 (slot server / trash / drawer / thông báo / `Date.parse`). ERD/ARCHITECTURE: no doc impact.
- Acceptance: [x] thông báo liệt kê toán tử · [x] `Date.parse` + ca biên · [x] trash phía server · [x] ẩn trong drawer · [x] fail-closed giữ · [x] lint/typecheck/test/build PASS.
