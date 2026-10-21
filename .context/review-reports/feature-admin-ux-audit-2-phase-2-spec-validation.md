Agent: spec-validator

# Spec validation (pre-plan): feature-admin-ux-audit-2, phase 2 (BL-051 GĐ2: A6, A8, A9, A10, A11, A12, A14), round 1

- Mode: Spec validation (before builder)
- Inputs: `spec/changes/2026-10-21-admin-ux-audit-2.md`, `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.1.4–5, §2.3.6, §2.4, §2.5, §2.6, §3.1, `SPECIFICATIONS.md:134` (GĐ2 paragraph) against `:130` (FR-ADM-19), `:132` (GĐ1), `:75` (homepage blocks), `tasks/feature-admin-ux-audit-2/phase-2-task-01..06.md`, and the code facts cited below.
- Verdict: **FAIL** (3 rows are ⚠️, which meets the ≥3 ⚠️ trigger; no ❌, no HIGH conflict). Every gap can be fixed by rewording the spec/task. No re-scope needed.

## Coverage matrix

| Req | Source | Spec (`SPECIFICATIONS.md:134`) | Task | Status | Note |
|---|---|---|---|---|---|
| A6 bulk bar pinned to the bottom | change doc A6; report §2.1.5, §3.1 | covered | P2-T01 §1 | ✅ | Matches the user's wording. Report §3.1 also suggests new actions ("Đổi trạng thái", "Xuất Excel đã chọn"). Spec keeps Payload's actions only. That narrows scope and is allowed by the change doc ("không đổi API/quyền"). INFO |
| A8 dashboard cards | change doc A8; report §2.4 | covered | P2-T03 | ✅ | Consistent with BL-041 (`:130`): "Tạo loại khác" still exists, "Sửa website" is still admin-only. No contradiction |
| A9 media grid + drawer | change doc A9 + acceptance; report §2.5 | covered | P2-T02 | ✅ | Drawer requirement is explicit. Minor: "chip" in the A9 text. Media has no chip group in FR-ADM-19, so read it as "if present". The FR-ADM-19 rule "thumbnail 40px, dòng 48px" is implicitly overridden for Media list only. INFO |
| A10 nav link dropdown | change doc A10 + acceptance; report §2.6.2 | covered | P2-T04 | ⚠️ | Value format and `validateNavLink` kept (`src/lib/content/nav-link.ts:40-45`). Testability conflict, see F4 |
| A11 AI translation in one block | change doc A11; report §2.3.6 | covered | P2-T05 | ⚠️ | "Công tắc" wording vs a read-only field, Pages approve button not addressed, "collection nội dung" scope unclear. See F5–F7 |
| A12 row actions column | change doc A12; report §2.1.4, §3.1 | covered | P2-T01 §2 | ⚠️ | Pages has `disableDuplicate`, row-level access, and the sale column picker is hidden by A13. See F1–F3 |
| A14 homepage 5 tabs | change doc Q3 | covered | P2-T06 | ✅ (minor) | Tabs in `src/globals/Homepage.ts:272-285` have no `name`, so data paths stay. `enabledField` (`src/globals/homepage/blocks.ts:46`) is used only by Homepage. Grouping matches Q3 exactly (Banner tab also holds `heroSearchBlock`). See F8, F9 |
| Change doc acceptance: no API/permission change, A2 n/a, A4/A5/A6/A8 light/dark 375+1280, A9 drawer, A10 format, tests green + 3.91 gap | change doc §Acceptance | covered | all tasks share the acceptance block | ✅ | Verify commands `pnpm typecheck/lint/test` match `.context/project-config.md:30-33` |
| Constraints: no schema/DB/access/API/migration | `:134` last sentence | covered | all | ✅ (realistic) | A12 `ui` field, A11 relocating `translation` out of an unnamed tab, A14 unnamed tabs/collapsible: none of these change data paths. The one exception is the JSDoc diff in F4 |

## Findings

### F1 — MEDIUM — A12 "Nhân bản" on Trang pháp lý contradicts `disableDuplicate`
`src/collections/Pages.ts:35-36` sets `disableDuplicate: true` because `kind` is UNIQUE and there are 2 fixed seeded records. Spec A12 lists Trang pháp lý in the 7 collections and promises Nhân bản without exception. P2-T01 also has no exception.
**Fix:** add "Nhân bản chỉ hiện khi collection cho nhân bản (không `disableDuplicate`)" to the spec and to P2-T01.

### F2 — MEDIUM — A12 "chỉ hiện khi có quyền" is ambiguous for row-level access
Content `update` is `isAuthorOrAdmin` (`src/access/isAuthorOrAdmin.ts:4` → `ownedByUserOrAdmin("author")`, returns a `where`). `delete` is `deleteAccess` (`content-defaults.ts:190-192`). For a returned `where`, Payload's collection-level `permissions` is `true`. So a sale would see Sửa/Xoá on other authors' rows, and Xoá would then fail server-side. The spec says "theo quyền Payload trả về", which does not decide this.
**Fix:** choose one rule.
- (a) Collection-level permission plus a per-row check using `rowData.author` for sale (no extra fetch).
- (b) Show the buttons by collection permission and turn a server rejection into a friendly Vietnamese message with no data change.

Then add a test row "sale, other author's row".

### F3 — MEDIUM — A12 "người đã lưu cột riêng phải tự bật" conflicts with A13 (GĐ1, `:132`) for sale
A13 hides "Hiển thị cột" from role `sale`. A sale with saved column preferences therefore can never turn on the new "Thao tác" column. The same applies to the BL-039 columns. The new paragraph silently assumes the column picker is available to everyone.
**Fix:** state the accepted consequence (admin can reset that user's preferences), or require the column to show regardless of saved preferences (if Payload 3.91 allows; otherwise record a gap). Also state explicitly in the spec that the column is a **default** column. Today that is only in P2-T01 (`defaultColumns`). FR-ADM-19 `:130` says "cột mặc định đang hiện giữ nguyên (trừ cột thêm dưới đây)", so the new paragraph should say that it adds to defaults.

### F4 — LOW-MEDIUM — A10 removing the "Mã trang có sẵn" description changes `src/payload-types.ts`
The description is emitted as JSDoc into `src/payload-types.ts` (lines 2775, 2795, 2912, 2979, 2992, 3062, 3069, 3081, 3123). P2-T04 scope removes it. Its acceptance, and P2-T06 step 3 ("regen rồi diff, không đổi"), require `payload-types.ts` unchanged.
**Fix:** allow a comment-only diff in `payload-types.ts` from the description change (types and shape unchanged), or keep `admin.description` and let the custom component render a different text. Make sure P2-T06's "types unchanged" baseline is taken after P2-T04.

### F5 — MEDIUM — A11 calls "Có bản tiếng Anh" a "công tắc", but the field is system-controlled and read-only
`src/fields/translation.ts:29,32` sets `access: readOnlyForEveryone` and `admin.readOnly: true`. It is turned on by the job/hook (`require-english-fields`), and for Pages via `approveEnglish`. Both spec `:134` and the change doc say "công tắc/checkbox". A builder could make it editable, which would be an access change and violate the constraint.
**Fix:** reword to "ô trạng thái 'Có bản tiếng Anh' (chỉ đọc, hệ thống bật)" and explicitly state "không đổi access/readOnly của `hasEnglish`". P2-T05 says "Quyền/readOnly … giữ", which is fine, but the spec text should match.

### F6 — LOW-MEDIUM — A11 ignores the Pages "Duyệt bản tiếng Anh" button
Pages has `approveEnglishAction` (`ui`, sidebar, `src/collections/Pages.ts:62`). This is the third control in the same English-version flow. The spec does not say whether it joins the A11 block. Leaving it separate partly defeats "Dịch AI một chỗ".
**Fix:** state "Trang pháp lý: nút Duyệt bản tiếng Anh nằm trong cùng khối", or state that it stays where it is.

### F7 — LOW — A11 scope "collection nội dung" is unclear
`withContentDefaults` moves `translation` into a "Bản dịch" tab (`src/collections/_shared/content-defaults.ts:150-159`) for every collection that does not omit translation. That includes Categories and Developers (`omit` lists at `Categories.ts:74`, `Developers.ts:55` do not omit translation). The shared helper will change them all.
**Fix:** state "mọi collection dùng `withContentDefaults` có nhóm bản dịch".

### F8 — LOW — Stale reference after A14
`SPECIFICATIONS.md:75` says "ghi hướng dẫn ở mô tả tab 'Thứ tự khối'". After A14 that tab no longer exists (merged into "Chuyển đổi & Bố cục"). The new paragraph does not say where that guidance goes.
**Fix:** add "mô tả hướng dẫn của tab Thứ tự khối chuyển sang khối thu gọn Thứ tự khối" to A14 / P2-T06.

### F9 — LOW (documented deviation) — A14 drops the change doc's "add field → migration additive" option
The change doc Q3 allowed adding an on/off flag with an additive migration. The spec forbids new fields, so the Banner (hero), "Thứ tự khối", SEO and Bản dịch blocks have no "Hiện khối này trên web" switch. This is more conservative and is stated explicitly ("khối không có cờ bật/tắt — vd Banner — giữ như cũ"). Acceptable under "tự làm tự quyết". Only note it in the task decision log.

### F10 — INFO — A12 hidden in Trash view; A6 inside drawers
These are only in P2-T01, not in the spec. Not contradictory. Optionally lift them into the spec for testability.

## Conflict check against the remaining FR-ADM-19 text (`:130`)
- **BL-039** "trường `ui` không có ô hiển thị … ẩn": A12 column has a Cell, so it stays selectable. P2-T01 explicitly protects it from `hideTechnicalListFields`. OK.
- **BL-039** "cột mặc định đang hiện giữ nguyên": A12 adds a default column without saying it supersedes this (F3).
- **BL-042** "nhóm bản dịch chỉ hiện 1 dòng tóm tắt + nút Dịch lại" and "'Có bản tiếng Anh' có câu giải thích": compatible with A11. Hidden system fields are kept.
- **BL-041** dashboard: compatible with A8.
- **BL-015** "ô chọn admin cùng một style": A10 select must follow it. Present in P2-T04, implicit in the spec. OK.
- **FR-ADM-20** (`:136`): not touched by GĐ2 (it is `site-settings`, not `homepage`). OK.
- **GĐ1 A7** (`:132`): A12 "Xem trên web" reuses the A7 condition (`public-doc-url.ts`). Consistent.
- **GĐ1 A13**: conflict F3.

## Required before builder (FAIL → back to the coordinator)
1. F1: exclude Nhân bản when `disableDuplicate` (Pages).
2. F2: define the per-row rule for Sửa/Xoá under `isAuthorOrAdmin`.
3. F3: decide how sale gets the "Thao tác" column given A13; mark the column as a default.
4. F4: allow a comment-only diff in `payload-types.ts` for A10, or keep the description.
5. F5: reword "công tắc" for `hasEnglish` as read-only, with no access change.
6. F6–F8: one-line clarifications (Pages approve button, A11 collection scope, "Thứ tự khối" guidance).

Residual risk: Payload 3.91 internals (`ListSelection` placement, list view for upload collections in drawers) were not verified in a browser. The spec's "ghi gap nếu 3.91 không cho" clause covers this.
