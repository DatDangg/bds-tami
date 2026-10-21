Agent: spec-validator

# Spec validation (pre-build plan) — feature/admin-form-non-tech-friendly (BL-042) — round 1

- Mode: **Spec validation** (before build), auto proceed (user instruction 2026-10-21), no questions asked.
- Inputs: `spec/changes/2026-10-20-admin-form-non-tech-friendly.md` (Acceptance L35-55, Bảng điểm sửa L64-89, Q1-Q5 L91-96);
  `SPECIFICATIONS.md:115` FR-ADM-19 sentence "**Form dễ dùng cho người không rành công nghệ (BL-042)**";
  `tasks/feature-admin-form-non-tech-friendly/phase-1-task-0{1..4}.md`; code `src/fields/*`, `src/collections/*`,
  `src/collections/_shared/content-defaults.ts`, `src/globals/SiteSettings.ts`, `src/payload.config.ts`, `src/lib/upload/validate-file.ts`;
  Payload 3.91 dist (`payload`, `@payloadcms/ui`, `@payloadcms/drizzle`, `@payloadcms/richtext-lexical`, `@payloadcms/translations`).

## Verdict: ❌ FAIL (by rule: >= 3 ⚠️ PARTIAL) — non-blocking in nature

No ❌ MISSING item, no HIGH conflict, no schema/DB/access risk found. FAIL is triggered only by 3 ⚠️ (G1-G3):
each is fixable by amending task text (no user decision, no schema change). Amend T01/T04 then re-validate (round 2) —
expected PASS.

## Feasibility checks (Payload 3.91, no schema change)

| Decision | Evidence | Result |
|---|---|---|
| Lexical admin options `hideGutter` / `hideAddBlockButton` / `hideDraggableBlockElement` / `placeholder` | `richtext-lexical/dist/types.d.ts:22-45` (`LexicalFieldAdminProps`; also `hideInsertParagraphAtEnd`) | ✅ names correct |
| `FixedToolbarFeature` export; upload/list/heading/link have `toolbarFixed` groups | `richtext-lexical/dist/index.d.ts`, `features/{upload,lists,heading,link}/client/index.js` | ✅ (bold/italic/heading/list/link/upload covered) |
| Undo/Redo client feature | `createClientFeature` exported (`exports/client/index.d.ts:54`); `HistoryPlugin` mounted (`lexical/LexicalEditor.js`) -> `UNDO_COMMAND`/`REDO_COMMAND` work | ✅ feasible (see G3) |
| richText `admin.className` (for `*` marker) | `richtext-lexical/dist/field/Field.js:100` adds `className` to wrapper | ✅ |
| Function `defaultValue` for `author` creates no DB default | `@payloadcms/drizzle/dist/schema/withDefault.js:2` skips `typeof defaultValue === 'function'` | ✅ no migration |
| Unnamed `collapsible` at root with `admin.position: "sidebar"` | `payload/dist/fields/config/types.d.ts:205-215` (`FieldAdmin.position`), `CollapsibleField.admin = {...} & FieldAdmin` (L607-631); `@payloadcms/ui/dist/elements/DocumentFields/index.js:24-33` splits by `fieldIsSidebar` on top-level fields | ✅ data path unchanged |
| `admin.hidden` on `translation.*` keeps value in form state (for `translationSummary` via `useFormFields`) and query on `translation.status` | `ui/dist/forms/fieldSchemasToFormState/addFieldStatePromise.js:90,754` (hidden skips render/permission branch, value kept); `src/lib/translation/admin-ui.ts:7-10` filter uses URL `where`; BL-039 already disables list column/filter for `translation.*` (`src/lib/admin/list-filter.ts:12`) | ✅ (builder still verify Lọc dịch + dashboard banner, as T01 D7 says) |
| `general:creatingNewLabel` / `general:untitled` / `fields:addNewLabel` keys exist | `@payloadcms/translations/dist/languages/vi.js` ("Đang tạo mới {{label}}", "Chưa có tiêu đề", "Thêm mới: {{label}}") | ✅ keys exist; but see G2 |
| `.localized` suffix hide by CSS | `ui/dist/fields/FieldLabel/index.js:49` `className: "localized"` | ✅ |
| Media alt fill in collection `beforeValidate` | `src/collections/Media.ts:49,79-82`; `src/lib/upload/validate-file.ts:86` renames `req.file.name` to UUID in `beforeOperation` (runs before `beforeValidate`) | ⚠️ G1 |

## Coverage matrix (acceptance -> task)

| # | Acceptance item (change doc) | Task / decision | Status | Note |
|---|---|---|---|---|
| A0 | Checkpoint table before code | Change doc "Bảng điểm sửa" L64-89 + Q1-Q5 (auto proceed, mô tả thay ảnh) | ✅ | user instructed auto proceed |
| A1 | Remove "— vi/en"; editing locale shown in 1 place | T01 D1; Q1 | ✅ | "Đang sửa:" optional, residual if no key |
| A2 | RichText fixed toolbar (bold, italic, heading, list, link, image, **undo**) + border + VN placeholder + no "+"/handle | T01 D2 | ⚠️ | G3 (undo made optional), G6 |
| A3 | `*` on all required (incl. per-locale) + error under field | T01 D3 | ✅ | G8, G9 (LOW) |
| A4 | Placeholders on key fields | T01 D4, T02 D6 | ✅ | |
| A5 | "Người tạo" auto = logged-in user | T01 D5 | ✅ | access `create/update: isAdmin` kept (`src/fields/author.ts:20`) |
| A6 | Slug auto + into collapsed advanced section; translation system fields hidden + 1-line summary + "Dịch lại" | T01 D6, D7; Q2 | ✅ | G10 (LOW) |
| A7 | "Có bản tiếng Anh" 1-sentence explanation | T01 D7 | ✅ | |
| A8 | "+" has text/tooltip "Thêm mới"; create page title "Thêm <tên mục> mới" | T01 D8, D9 | ⚠️ | G2 (H1 stays "[Chưa đặt tên]") |
| A9 | Lead: UTM+URLs collapsible, consent bottom read-only, timestamps 1-line, hide `anonymizedAt`, Gọi/Zalo/Gửi email, locale read-only label | T03 D1-D6; Q4 | ✅ | G7 (LOW) |
| A10 | Category select filtered by scope; validator kept | T02 D1 (`src/fields/scoped-category.ts:46` already has `filterOptions`) | ✅ | verify-only |
| A11 | Mô tả ngắn counter 150-200 (collections with `summary`) | T02 D2 | ✅ | G4 (LOW: `excerpt` "Tóm tắt" in News/PropertyPosts) |
| A12 | Pháp lý / Chính sách placeholder only | T02 D3 | ✅ | field `legalInfo` (`Projects.ts:141`) |
| A13 | VND read-in-words (Dự án, Cho thuê, bảng giá, lương) | T02 D4 (+ Tin BĐS) | ✅ | all `*Vnd` fields + `priceTable.priceFrom/To` covered |
| A14 | "Hôm nay" button for price update date | T02 D5 | ✅ | |
| A15 | Rentals code `CT-…` big + copy | T04 D1 | ✅ | |
| A16 | Job posting "Đã quá hạn" badge form + list | T04 D2 | ✅ | same `startOfVietnamDay` as BL-039 chip |
| A17 | SiteSettings privacyPolicyVersion small label; GA hint; glossary example | T04 D3 | ✅ | |
| A18 | Media empty alt -> default alt (sanitized filename), editable, existing alt unchanged, a11y/SEO confirmation | T04 D4; Q3 | ⚠️ | G1 |
| A19 | No schema/slug/URL/access/data change; tests PASS | all tasks (Verify + generate:types) | ✅ | |

Counts: ✅ 16 · ⚠️ 3 · ❌ 0.

## Cross-doc consistency (spec delta vs change doc vs existing FR-ADM-19)

- Spec delta (`SPECIFICATIONS.md:115`) mirrors acceptance A1-A18 and closes with the "chỉ đổi cấu hình `admin`/thành phần hiển thị, không đổi schema/dữ liệu/access/URL" clause — consistent with the FR-ADM-19 constraint "không đổi schema/DB, access control, không thêm endpoint".
- No contradiction with BL-039 (list columns/filters: `translation.*`, `slug`, `hasEnglish` already hidden from list; locale picker "Tiếng Việt/English" reused per Q1; "Form: tab không tên / row / collapsible, trường phụ ở sidebar phải" compatible with the new sidebar collapsible), BL-040 (labels; tab rename kept), BL-041 (sidebar menu untouched), BL-043 (type-label cells untouched).
- Softening: spec delta says "hoàn tác/làm lại **nếu làm được**", acceptance A2 lists undo unconditionally -> intent softened without need (feasible) — G3.
- Spec "Ảnh … tự điền alt từ tên file đã làm sạch" is not achievable with T04 D4 as written — G1.

## Gaps

- **G1 [PARTIAL] MEDIUM — Media alt from original filename is lost** (A18, T04 D4). `createUploadGuard` (beforeOperation, `src/lib/upload/validate-file.ts:86`) overwrites `req.file.name` with a UUID before collection `beforeValidate`, so D4 falls back to "Hình ảnh" for every image — weak for a11y/SEO and fails the "tên file đã làm sạch" intent.
  Fix: in the guard (or a beforeOperation hook ordered before it) store the original name in `args.req.context` (e.g. `uploadOriginalName`) before renaming; the media `beforeValidate` reads that context. No schema change. Use "Hình ảnh" only when the sanitized name is empty or random-looking. Add unit tests for hook order.
- **G2 [PARTIAL] MEDIUM — H1 on create view does not become "Thêm <tên mục> mới"** (A8, T01 D8). `general:creatingNewLabel` is only used in DocumentControls (`ui/dist/elements/DocumentControls/index.js:174`). The H1 comes from `formatDocTitle` (`ui/dist/utilities/formatDocTitle/index.js:48`), falling back to `[${general:untitled}]`, so with D8 it reads "[Chưa đặt tên]". `general:untitled` is also used by relationship/upload cells ("… - ID: x").
  Fix: T01 must render "Thêm <singular label> mới" as the visible heading on create, e.g. a root `ui` field or `beforeDocumentControls`/edit-view component that shows the heading when there is no `id`, plus CSS that hides the bracketed fallback H1 only on create. If it cannot be done without replacing a Payload view, mark an explicit residual and accept the DocumentControls text. Note BL-040 sentence case: "Thêm dự án mới" (lowercase the label) — G11.
- **G3 [PARTIAL] LOW-MEDIUM — Undo/redo made optional** (A2, T01 D2; spec delta "nếu làm được"). It is feasible: `createClientFeature` + the `HistoryPlugin` that is already mounted + `UNDO_COMMAND`/`REDO_COMMAND` from `lexical`, with no new node.
  Fix: make it required in T01 (2 toolbar buttons, `canUndo`/`canRedo` state) and drop "nếu làm được" from the spec delta once built (or keep a residual only on a proven blocker).
- **G4 LOW — "Mô tả ngắn" equivalents named `excerpt`** ("Tóm tắt", `News.ts:40`, `PropertyPosts.ts:75`). Only Projects and Services have `summary`. Same purpose (card + Google).
  Fix: T02 D2 should state explicitly whether `excerpt` gets the counter and the T01 placeholder. Recommendation: include it (UI only). `AuditLogs.summary` (text, system) must be excluded.
- **G5 LOW — Task dependency header**: T04 changes `Rentals.ts`/`JobPostings.ts`, which T02 also changes (price read-out). T04 lists "Phụ thuộc: T01" only.
  Fix: T04 depends on T02 (Q5 already orders tasks sequentially; make the task header match). T03 is independent of T02.
- **G6 LOW — Stray "+" at the end of an empty editor**: also set `hideInsertParagraphAtEnd: true` (`types.d.ts`) in the T01 editor factory.
- **G7 LOW — Lead `locale` "dạng nhãn chỉ đọc"**: `admin.readOnly` on a select still renders a disabled dropdown.
  Fix: a small read-only Field component that shows the "Tiếng Việt/English" text, or accept and note it.
- **G8 LOW — "lỗi hiện ngay dưới ô"**: Payload 3 shows field errors as a tooltip above the input. T01 D3 assumes it is already under the field.
  Fix: builder verifies; if it is a tooltip, reposition it with CSS or record a residual.
- **G9 LOW — `*` shown on the en locale** for `requiredByLocale` fields even when `hasEnglish=false` (not required). Accept and document it in the field description, or scope the CSS marker to the vi locale if the admin exposes the locale in the DOM.
- **G10 LOW — `fieldAccess` override vs collapsible**: `withFieldAccess` (`content-defaults.ts:104-111`) only patches named top-level fields. If `slug` is wrapped in `buildSharedFields`, overrides such as `{ slug: … }` silently stop applying.
  Fix: wrap in `placeSharedFields` (after `resolveSharedFields`), or make `withFieldAccess` recurse. Also update `src/lib/admin/form-layout.test.ts:49,55` (name order).
- **G11 LOW — Casing**: "Thêm {{label}} mới" with singular label "Dự án" gives "Thêm Dự án mới". BL-040 asks for capitalizing only the first letter. Lowercasing the label in the override, if done, needs a test.
- **G12 LOW — Doc impact**: tasks do not mention the `docs/DESIGN.md` admin-form reconcile listed in the change doc's "Doc impact dự kiến". Ensure the phase close-out covers it.

## Residual risk (not gaps)

- Q3: alt from the parent post title is not done (upload drawer lacks a reliable parent). Accepted as residual.
- `admin.hidden` on `translation.*` / Lead timestamps: builder must manually confirm Lọc dịch, StatusBadge, dashboard banner, Lead sort/quick filters (T01 D7, T03 D3 already require this).
- Shared CSS file is touched by all 4 tasks, so sequential execution (Q5) is required. Do not parallelize.

## Required to reach PASS (round 2)

Amend T04 D4 (G1), T01 D8 (G2), T01 D2 + spec delta wording (G3). The LOW gaps can be folded into the task texts at the same time.
