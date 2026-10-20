Agent: spec-validator

# Phase review: feature-admin-vietnamese-wording, phase 1 (BL-040), round 1

- Mode: **Phase review**. This checks that what was built matches the spec and covers all of it.
- Inputs:
  - Change doc: `spec/changes/2026-10-20-admin-vietnamese-wording.md` (Acceptance section)
  - Task files: `tasks/feature-admin-vietnamese-wording/phase-1-task-01.md` and `phase-1-task-02.md`. Both record user approval of Q1–Q10 on 2026-10-20.
  - Spec delta: `SPECIFICATIONS.md:104` (FR-ADM-19, the "Ngữ nghĩa chữ admin (BL-040)" sentence and the 7 groups with "Dữ liệu nền")
  - Reviewer reports: T01 round 2 PASS and T02 round 2 PASS (STRICT)
- Verdict: **GAPS FOUND, none blocking.** Every Acceptance item in the change doc and every clause of the FR-ADM-19 delta is implemented. Two small items remain (G1 code, G2 docs), plus close-out items (G3) that must be done before the commit.

## Coverage matrix: change doc Acceptance

| # | Requirement | Source | Implementation evidence | Status | Note |
|---|---|---|---|---|---|
| A1 | Review every admin text and get a proposal table approved before coding | change doc:20 | T01 §1–§8 lists 102 Payload keys; T02 §1–§7 lists 100 rows. Approval is recorded at T01:7 and T02:5 ("ok theo đề xuất", Q1–Q10) | OK | |
| A2 | Default suggestions: Rác→Thùng rác; Đã Xóa Lúc→Ngày xoá; Collections→…; Tệp riêng tư (CV)→…; Lead→… | change doc:21 | `payload-vi-overrides.ts:56-57` ("Thùng rác", "Ngày xoá"); `:92` collections "Mục quản lý"; `collection-labels.ts:11` "Tệp CV ứng viên"/"Tệp CV"; `:28` leads "Lead"/"Lead" | OK | Two items differ from the original suggestion, and the user approved both: Q8 chose "Mục quản lý" over "Danh mục quản lý" (avoids clashing with the group/collection name), and Q4 chose "Tệp" over "File". Q1 option A keeps "Lead" and drops "Lead khách hàng". |
| A3 | Payload texts are overridden in ONE place (`i18n.translations.vi`) with a test that locks the strings; project labels live only in `collection-labels.ts` | change doc:22 | `payload.config.ts:94-99` → `translations: { vi: PAYLOAD_VI_OVERRIDES }`. Test `payload-vi-overrides.test.ts:129-147` checks values, that each key exists in the package, that placeholders/tags match, and that no English remains. Labels are only in `collection-labels.ts:8-40`, locked by `collection-labels.test.ts` | OK | |
| A4 | Slug, schema, URL and access unchanged; the failed-translation banner still shows the right labels | change doc:23 | `admin-ui.ts:3,71-75`: `COLLECTION_LABELS`/`GLOBAL_LABELS` are derived from `collection-labels.ts`. The `mimeType` redeclaration keeps the same name/type, checked by `admin-label-scan.test.ts:49`. Reviewer T02 r1/r2 (STRICT) confirmed that only label/description/message strings changed | OK | `payload-types.ts` was not regenerated, as agreed in T02. |
| A5 | Consistent capitalisation (first letter only), no stray English except the borrowed words the user approved to keep | change doc:24 | Overrides fix "Lưu Thay Đổi", "Phiên bản Trước", etc. The Q9 list of borrowed words is approved. `admin-label-scan.test.ts:30` blocks slug/noindex/canonical/OG/bucket/consentVersion/BR-/FR-/VI → EN | OK | Q10 accepted that the Payload strings left unchanged still spell "xóa/khóa" (older accent placement). |

## Coverage matrix: FR-ADM-19 delta (`SPECIFICATIONS.md:104`)

| Clause | Implementation evidence | Status |
|---|---|---|
| 7 groups: Khách hàng · Nội dung · Tuyển dụng · Thư viện · **Dữ liệu nền** · Website · Hệ thống | `admin-groups.ts:9-15`; tested in `admin-groups.test.ts` | OK |
| One name per concept: Thùng rác · Ngày … · Sale phụ trách · Tin bất động sản · tiếng Việt/tiếng Anh · Dịch tự động (AI) · Cấu hình chung · Tệp CV ứng viên · Lead | Overrides `:56`; label scan `:42` (no labels ending in " lúc"); `Leads.ts:130`, `LeadActivities.ts:35`, `leads-export.ts:31` "Sale phụ trách"; `collection-labels.ts:25` "Tin bất động sản"; `admin-ui.ts:8,11,92` | OK, with one exception (G1) |
| No dev jargon in labels/descriptions (slug, canonical, noindex, OG, hash, bucket, token on its own, BR-/FR- codes, "Collections"/"globals") | `admin-label-scan.test.ts:30`. My grep of `label:/description:` in `src` (excluding tests) found matches only in `src/jobs/*` (see residual risk) | OK |
| Payload overrides in ONE place, with tests for string values, key existence and matching placeholders | See A3 | OK |
| Filter operators read naturally (là · không phải · là một trong · có giá trị · Có/Không), and the Excel export error message quotes exactly these words | `payload-vi-overrides.ts:64-65,101-106`; `export-filters.ts:143` quotes "là", "là một trong", "có giá trị" = Không; drift test at `export-filters.test.ts:250-258` | OK |
| Collection/global labels only in `collection-labels.ts` | See A3 | OK |
| Overview: "Mục quản lý", hint "Mới, chưa giao sale" | `NavGroupCards.tsx:10`, `dashboard-queries.ts:81` | OK |

## As-built docs reconciled

| Doc | Check | Status |
|---|---|---|
| `docs/API_SPEC.md:202` (lead export) | The column is named "sale phụ trách". The operator message points to `payload-vi-overrides.ts` (BL-040) with "là", "là một trong", "có giá trị" = Không, "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng". This matches `export-filters.ts:143` | OK |
| `docs/ARCHITECTURE.md:129` | Mentions only "admin-groups (7 nhóm nav…)" and no group names | OK, no change needed |
| `docs/ERD.md`, `docs/PERMISSION.md` | No schema/access change. PERMISSION:92,121 says "người phụ trách" in business prose, not as a UI label | no doc impact |
| `spec/test-scope/*` | No old texts found ("Lead khách hàng", "Tệp riêng tư", "bằng", "tồn tại", "Rác", …) | OK |

## Gaps

- **G1 [PARTIAL] [LOW]: one audit summary still says "Xoá hẳn".**
  - Requirement: FR-ADM-19 "một khái niệm một tên", and the approved T02 §6 rows that changed "Xoá hẳn" to "Xoá vĩnh viễn" (`AuditLogs.ts` option, `audit-content-delete.ts:44`).
  - Problem: `src/hooks/job-applications/delete-cv-and-audit.ts:33` still writes `` summary: `Xoá hẳn job-applications ${doc.id}` ``.
  - Why it shows: `summary` is the `useAsTitle` field and a default column of the activity log (`AuditLogs.ts:37-38`).
  - Effect: deleting a job application permanently shows "Xoá hẳn" in the activity log, while other content shows "Xoá vĩnh viễn".
  - The raw slug `job-applications` in that summary is part of BL-043 (raw slugs) and does not need to be fixed here.
  - Related task: T02 (follow-up). Suggested fix: change the wording to "Xoá vĩnh viễn" and keep the rest of the summary.

- **G2 [PARTIAL / doc] [LOW]: the BL-015 design doc still uses the old names.**
  - File: `docs/specs/2026-10-19-admin-ui-saas-design.md`.
  - §2 table, lines 160-166: group 5 is called "**Danh mục**", and items are named "Khách hàng tiềm năng (`leads`)", "Tệp riêng tư", "Thống kê lượt bấm theo ngày", "Chi phí dịch AI", "Chuyển hướng 301".
  - §3.1, lines 190-191, and the "As-built (T04)" note at line 214 say "Danh mục quản lý" and "người phụ trách".
  - Classification: this is a design doc (intent/historical) with **as-built notes** mixed in. The intent tables must not be rewritten to match the code. Recommendation: add one short line "As-built (BL-040): nhóm 5 = "Dữ liệu nền"; card Tổng quan "Mục quản lý"; nhãn hiện hành ở `collection-labels.ts`/FR-ADM-19" after line 168 and next to line 214, so readers are not misled.
  - `docs/specs/2026-10-19-admin-ui-saas-mock.html` is a historical mock and needs no action.

- **G3 [process / close-out] [MEDIUM]: Spec Publisher has not run, and progress is stale.**
  - Spec Publisher has not run for the FR-ADM-19 delta: `SPECIFICATIONS.md:9` still says `spec_version: 1.32.0` (the BL-037 version), there is no `spec/updates/2026-10-20-admin-vietnamese-wording.md`, no row in `spec/CHANGELOG.md`, and `scopeVersion` is not bumped. This is required by AGENTS.md feature rule 3b.
  - `.context/progress.json:1170-1185` still shows T01/T02 at `round: 0`, with the note "chờ user duyệt". Reviewer PASS and the report paths are not recorded.
  - The change doc is still `status: in_progress` with Acceptance unchecked.
  - These must be completed before the commit-first step.

- **G4 [intent doc] [LOW]: FR-ADM-19 is inconsistent with itself.**
  - The BL-040 sentence fixes "Tin bất động sản" as the admin name.
  - But the BL-021 and BL-022 sentences in the same FR still name the admin list "Đăng tin BĐS": "Thêm bộ lọc của Cho thuê / Dự án / Đăng tin BĐS / …" and "không áp cho Dự án / Đăng tin BĐS".
  - This is intent text, so it can only be changed through change-request with the user's approval. It can be tidied in the same BL-040 delta before spec-publish. It is not a code gap.

## Residual risk / out of scope (not gaps)

- `src/jobs/translate-content.ts:210` ("VI → EN … (Claude API)") and `src/jobs/expire-offers.ts:62` ("Đăng tin BĐS") still use the old wording. T02 recorded these as out of scope (reviewer T02 MINOR-2). I did not check whether the `payload-jobs` collection is visible in admin.
- The Excel export and anonymised lead cells still contain the data value "Đã ẩn danh" (`ANONYMIZED_PLACEHOLDER`). This is a data value, not a label, and is not in the approved table.
- `src/i18n/messages/vi.json:602` `saleTitle: "Người phụ trách"` belongs to the public website, not admin. It is outside BL-040 (Q2/Q3 apply to admin only).
- Neither the reviewer nor I checked the admin UI in a browser. The conclusions rely on the sanitized-config tests and the diff.

## Verify commands

None were run in this validation; the evidence comes from reading the code. The reviewer reports from round 2 record: vitest 64 files / 583 tests PASS (including access and admin-dashboard integration), typecheck PASS, lint 0 errors.

## Verdict

**GAPS FOUND, non-blocking.** Every requirement is implemented.
- G1 is a one-line wording fix.
- G2 needs as-built notes added to the design doc.
- G3 must be done before the commit: spec-publisher, `progress.json`, and the change doc.
- G4 should be tidied in the same spec delta.
