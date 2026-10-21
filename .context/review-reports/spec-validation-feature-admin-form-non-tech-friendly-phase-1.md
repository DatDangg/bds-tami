Agent: spec-validator

# Phase review — feature/admin-form-non-tech-friendly (BL-042) — phase 1 — round 1

- Mode: **Phase review** (after T01–T04 committed: 865ee10, a0aaa2c, f4437c3, bfa5d5f; base f532f08).
- Inputs: `git diff f532f08..HEAD -- src`; `spec/changes/2026-10-20-admin-form-non-tech-friendly.md` (Acceptance L35-55, Bảng điểm sửa L64-89, Q1-Q5 L91-96); `SPECIFICATIONS.md:115` (FR-ADM-19, sentence "Form dễ dùng cho người không rành công nghệ (BL-042)"); `tasks/feature-admin-form-non-tech-friendly/phase-1-task-0{1..4}.md`; plan report `.context/review-reports/spec-validation-feature-admin-form-non-tech-friendly-plan.md` (G1-G12).

## Verdict: ❌ FAIL (test regression — fix is small, no design change)

Implementation covers every acceptance item (some partially, as accepted residuals). But the acceptance item "test hiện có PASS" (change doc L55) is **not met**: the full `pnpm test` has 16 failures caused by BL-042. Each task's verify ran only `pnpm vitest run src/...` subsets, so `tests/unit/**` and `tests/integration/**` were never run.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | **FAIL**: 333 files (2 failed) · 3422 tests (**16 failed**, 3406 passed). DB/S3 was available, so the integration tests ran. |
| `git diff --stat f532f08..HEAD -- migrations src/migrations docs` | empty: no migration, no docs touched |
| `git diff f532f08..HEAD -- src/payload-types.ts` (lines that are not comments) | only `consentAt`/`consentVersion` moved inside `Lead` / `LeadsSelect` (field order). No field/type added or removed |

### Failures (BL-042 regressions)

1. **R1 — `tests/unit/admin-labels.test.ts:99` (14 tests)**. The new `ui` fields have no `label`, and the label scanner (FR-ADM-19 "mọi field hiển thị có `label`… test quét config chặn thiếu nhãn") rejects them:
   - `translation.translationSummary` (`src/fields/translation.ts`, T01). It appears in every collection/global that has the translation group: categories, developers, job-postings, news, pages, projects, property-posts, rentals, services, footer, header, homepage, site-settings.
   - `leads.activitySummary` (`src/collections/Leads.ts`, T03).
   - `rentals.codeBanner` (`src/collections/Rentals.ts`, T04).
   - Fix: add a Vietnamese `label` to these 3 `ui` fields (e.g. "Tóm tắt bản dịch", "Tóm tắt hoạt động", "Mã tin"). The custom Field components do not render the label. The other option is a narrowly-scoped scanner exemption, but that weakens the gate, so prefer the label.
2. **R2 — `tests/integration/media-upload.test.ts:171` "ảnh thiếu alt bị từ chối; PDF không cần alt"**: expects 400, gets 201. This is the **intended** new behaviour (#16, `fillImageAlt`), so the test is stale.
   - Fix: rewrite it as "ảnh mới trống alt → 201, alt = tên file làm sạch (`a.jpg` → "a")". Add "sửa metadata ảnh cũ để trống alt → 400" (validator still the safety net) and keep the PDF part.
3. **R3 — `tests/integration/media-upload.test.ts:145` "khách đọc được danh sách và file media"**: `GET /media/file/<latest>` returns 404 instead of 200.
   - The test picks `sort: -createdAt` (the latest media doc). The root cause is unproven. It is probably linked to R2: no-alt uploads now succeed and create media docs, so "latest" may not be the jpeg this test expects, or it may be shared DB/S3 state left by earlier runs.
   - Fix: builder confirms after the R2 fix (pin the expected doc id instead of "latest"). If it still fails → systematic-debugging, no symptom patch.

## Coverage matrix (acceptance → task → implementation)

| # | Requirement (change doc) | Task | Implementation evidence | Status | Note |
|---|---|---|---|---|---|
| A0 | Checkpoint table before code | — | change doc L64-96 (auto proceed) | ✅ | |
| A1 | Remove "— vi"; editing locale shown in 1 place | T01 D1, Q1 | `_forms.scss:5` `.field-label .localized` hidden | ✅ | No "Đang sửa:" prefix (Q1/D1 residual) — spec wording already matches this |
| A2 | RichText fixed toolbar incl. undo/redo, border, VN placeholder, no "+"/handle | T01 D2 | `src/lib/admin/rich-text-editor.ts` (FixedToolbarFeature + `tamiHistory`, hide* options, placeholder); `HistoryFeatureClient.tsx`; `payload.config.ts` editor; `_forms.scss:17` | ✅ | G3/G6 resolved. Not checked in a browser (residual) |
| A3 | `*` on all required (incl. per-locale) + error at field | T01 D3 | `markRequired` (`src/fields/required-by-locale.ts`) on title, all 11 `requiredByLocale` callers, `scopedCategoryField` when required; `_forms.scss:11` | ⚠️ PARTIAL (accepted) | `*` also shows on the en locale (G9); the error is Payload's red tooltip, not text under the field (G8) |
| A4 | Placeholders on key fields | T01 D4, T02 D6 | `titleField({placeholder})` in 7 collections; `SUMMARY_PLACEHOLDER`; Projects address/handover/amenity | ✅ | Chủ đầu tư/Danh mục keep default "Nhập tiêu đề"/none |
| A5 | "Người tạo" auto = logged-in user | T01 D5 | `src/fields/author.ts` `defaultValue: ({user}) => user?.id` (function → no DB default); access isAdmin kept | ✅ | |
| A6 | Slug auto + collapsed advanced block; translation system fields hidden + 1-line summary + "Dịch lại" | T01 D6/D7, Q2 | `content-defaults.ts` `advancedSidebarBlock` (unnamed collapsible, sidebar, initCollapsed, wrapped after access — G10 resolved); `translation.ts` 7 fields `admin.hidden` + `translationSummary` ui | ✅ | **R1** (label) |
| A7 | "Có bản tiếng Anh" 1-sentence explanation | T01 D7 | `translation.ts` hasEnglish description | ✅ | |
| A8 | "+" text "Thêm mới"; create page title "Thêm <tên mục> mới" | T01 D8/D9 | `_forms.scss:61-89` `::after "Thêm mới"`; `payload-vi-overrides.ts` `creatingNewLabel`/`untitled` | ⚠️ PARTIAL (accepted residual G2/G11) | H1 on the create view is still "[Chưa đặt tên]". Only the controls bar shows "Thêm Dự án mới" (label keeps its capital letter) |
| A9 | Lead: marketing collapsible, consent bottom read-only, timestamps 1 line, hide anonymizedAt, Gọi/Zalo/Gửi email, locale label | T03, Q4 | `Leads.ts` collapsible "Dữ liệu chiến dịch marketing" initCollapsed (utm+pageUrl+referrer via `LeadLinkField`, http(s) only); `consentFields` row at end of tab Nguồn; 5 timestamps `Field` = `LeadHiddenField` (null) + `activitySummary`; `LeadContactButtons.tsx`; `LeadLocaleField` | ✅ | `assignedAt` keeps its own field (D3). **R1** (activitySummary label). Field access unchanged (diff shows no `access` edits) |
| A10 | Category select filtered by scope | T02 D1 | already present, `scoped-category.ts` `filterOptions` (+ config test) | ✅ | |
| A11 | Summary counter 150–200 | T02 D2, G4 | `withSummaryCounter` on Projects/Services `summary`, News/PropertyPosts `excerpt` | ✅ | |
| A12 | Pháp lý / Chính sách placeholder only | T02 D3 | `Projects.ts` field-level `createRichTextEditor(placeholder)` for overview/legalInfo/salesPolicy | ✅ | |
| A13 | VND read in words | T02 D4 | `withPriceInWords` on Projects price, Rentals priceMonthlyVnd, PropertyPosts priceVnd, priceTable from/to, salary min/max; `formatPriceInWords` in `list-summary.ts` | ✅ | |
| A14 | "Hôm nay" button | T02 D5 | `withTodayButton(priceUpdatedAtField)` in `market-blocks.ts`; `TodayButton.tsx` | ✅ | |
| A15 | Rentals code big + copy | T04 D1 | `codeBanner` ui + `RentalCodeDisplay.tsx`, `lib/admin/clipboard.ts`; `code` Field → null (data/column/search kept) | ✅ | **R1** (codeBanner label) |
| A16 | Job "Đã quá hạn" badge form + list | T04 D2 | `JobPostings.ts` deadline Cell + afterInput; `lib/admin/job-deadline.ts` (startOfVietnamDay) | ✅ | |
| A17 | SiteSettings small version label, GA hint, glossary example | T04 D3 | `SiteSettings.ts` + `SiteSettingsDisplay.tsx` | ✅ | |
| A18 | Media empty alt → default alt, editable, existing unchanged, a11y/SEO confirmed | T04 D4, Q3 | `createUploadGuard` stores `req.context.originalUploadName` before the UUID rename (G1 resolved); `fillImageAlt` beforeValidate; `altFromFilename` (UUID/digits → "Hình ảnh"); a11y note in T04 | ✅ | **R2/R3** stale integration test |
| A19 | No schema/slug/URL/access/data change; **existing tests PASS** | all | no migration; payload-types only comments/order | ❌ | **R1, R2, R3** |

Counts: ✅ 16 · ⚠️ 2 (accepted residuals) · ❌ 1.

## Plan gaps G1–G12 (from the plan validation report)

| Gap | Resolved? | Evidence |
|---|---|---|
| G1 alt from the original filename | ✅ | `src/lib/upload/validate-file.ts` writes `ORIGINAL_UPLOAD_NAME_KEY` before the rename; `src/hooks/media/default-alt.ts` |
| G2 H1 "Thêm … mới" | ⚠️ residual (accepted) | T01 residual: H1 "[Chưa đặt tên]" |
| G3 undo/redo required | ✅ | `HistoryFeatureClient.tsx`, `tamiHistory`; spec no longer says "nếu làm được" |
| G4 excerpt counter | ✅ | News/PropertyPosts `withSummaryCounter` |
| G5 T04 depends on T02 | ✅ | T04 note + commit order |
| G6 hideInsertParagraphAtEnd | ✅ | `rich-text-editor.ts` |
| G7 Lead locale as a label | ✅ | `LeadLocaleField` |
| G8 error position | ⚠️ residual (tooltip) | spec says "hiện ngay tại ô" — acceptable |
| G9 `*` on en | ⚠️ residual | not stated in spec (see wording fix W2) |
| G10 fieldAccess vs collapsible | ✅ | wrapped after `withFieldAccess` |
| G11 casing | ⚠️ residual | "Thêm Dự án mới" |
| G12 doc impact | ❌ open | `docs/` untouched (see Doc reconcile) |

## Spec as-built accuracy (SPECIFICATIONS.md:115, BL-042 sentence) — suggested wording fixes

The intent doc may only change via the change request. The FR-ADM-19 BL-042 clause was written as a spec delta for this change, so align it with the as-built behaviour at close-out:

- **W1 (over-promise, MEDIUM)** — "tiêu đề trang tạo mới "Thêm <tên mục> mới"" → "màn tạo mới: thanh nút hiện "Thêm <tên mục> mới" (giữ hoa chữ đầu tên mục, vd "Thêm Dự án mới"); tiêu đề lớn khi chưa nhập tiêu đề hiện "[Chưa đặt tên]" (không thay view Payload)".
- **W2 (LOW)** — after "…có dấu `*`" add "(dấu `*` hiện cả khi sửa bản tiếng Anh; ở đó chỉ bắt buộc khi đã bật "Có bản tiếng Anh")"; "lỗi hiện ngay tại ô" → "lỗi hiện ngay tại ô (khung báo đỏ của Payload) bằng câu tiếng Việt".
- **W3 (LOW)** — "Mô tả ngắn có bộ đếm ký tự" → "Mô tả ngắn / Tóm tắt (Dự án, Dịch vụ, Tin tức, Tin bất động sản) có bộ đếm ký tự…".
- **W4 (LOW)** — Lead "các mốc thời gian gom 1 dòng tóm tắt" → "các mốc liên hệ đầu / hoạt động gần nhất / số lần khách gửi lại gom 1 dòng tóm tắt ở cột phải (Ngày phân công giữ ô riêng); các trường mốc và `anonymizedAt` không hiện ở form nhưng vẫn chọn được làm cột/bộ lọc".
- **W5 (LOW)** — Ảnh: "…tự điền alt từ tên file đã làm sạch" → "…khi tải file mới, tự điền alt từ tên file gốc đã làm sạch (tên vô nghĩa như UUID/toàn số → "Hình ảnh") thay vì chặn lưu; sửa ảnh cũ để trống alt vẫn bị báo lỗi; vẫn sửa được; ảnh đã có alt không đổi".
- Already accurate: the locale sentence ("ngôn ngữ đang sửa chỉ thể hiện ở ô chọn ngôn ngữ thanh trên" — no "Đang sửa:" claim).

## Doc reconcile needed (as-built; G12)

1. **`docs/specs/2026-10-19-admin-ui-saas-design.md` §5 Form sửa** (the right place for form content; §4 covers lists):
   - §5.1 table: Sidebar row → "Trạng thái · Ngày xuất bản · Tác giả (tự điền người đăng nhập) · Nổi bật · Có bản tiếng Anh · khối thu gọn **Nâng cao** (Đường dẫn trang)". Tab Bản dịch row → "group `translation`: trường hệ thống ẩn, chỉ 1 dòng tóm tắt (`TranslationSummary`) + "Dịch lại bằng AI" / "Duyệt bản EN"".
   - Add bullet **"As-built (BL-042, 2026-10-21):"** — "Editor toàn cục `createRichTextEditor()` (`src/lib/admin/rich-text-editor.ts`): FixedToolbar + Hoàn tác/Làm lại (`tamiHistory`), ẩn gutter/+/tay kéo, placeholder tiếng Việt; Dự án có placeholder riêng cho Tổng quan/Pháp lý/Chính sách. Nhãn ẩn đuôi `.localized`; `*` qua `markRequired` (`admin.className: tami-required`) cho trường validate bắt buộc (hiện cả ở en). `afterInput` dùng chung (`src/fields/form-hints.ts`): bộ đếm Mô tả ngắn/Tóm tắt, "≈ … đồng" cho ô VNĐ, nút "Hôm nay" (Ngày cập nhật bảng giá). Nút "+" quan hệ có chữ "Thêm mới"; thanh nút tạo mới "Thêm {{label}} mới", H1 khi trống "[Chưa đặt tên]". Cho thuê: khối mã tin to + Sao chép (`codeBanner`). Tuyển dụng: "Đã quá hạn" dưới ô Hạn nộp. CSS ở `src/components/admin/styles/_forms.scss`."
   - §5.2 Leads → "Tab Khách hàng (họ tên, SĐT + nút Gọi/Zalo, email + Gửi email, lời nhắn, ngôn ngữ khách dạng nhãn) · Tab Nguồn (source, bài liên quan, khối thu gọn "Dữ liệu chiến dịch marketing" = UTM + link rút gọn Trang gửi/đến, cuối tab: ngày/phiên bản đồng ý chính sách chỉ đọc) · Tab Lịch sử chăm sóc. Sidebar: Trạng thái · Lý do · Người phụ trách + cảnh báo · Ngày phân công · 1 dòng tóm tắt hoạt động (các mốc + `anonymizedAt` không vẽ ở form, vẫn là cột/bộ lọc)".
   - §5.3 Globals → site-settings: "phiên bản chính sách hiện dạng chữ nhỏ chỉ đọc; GA có chỉ dẫn lấy mã + placeholder; thuật ngữ dịch có ví dụ".
   - §4 (list): add a line "Tuyển dụng: ô Hạn nộp `dd/MM/yyyy` + badge "Đã quá hạn" (BL-042, cùng mốc `startOfVietnamDay`)".
2. **`docs/DESIGN.md`**: no admin section exists (it covers the public site; admin current-state lives in the design doc above). Either record **no doc impact**, or add one pointer line in the overview: "Giao diện/form admin: xem `docs/specs/2026-10-19-admin-ui-saas-design.md` §2–§5 (As-built)".
3. **`docs/ERD.md:512`** (`media.alt`, "R với ảnh") — the note becomes: "Accessibility + SEO. Ảnh mới tải lên trống alt được hook `fillImageAlt` điền từ tên file gốc đã làm sạch (fallback "Hình ảnh", BL-042); validator vẫn chặn alt trống khi sửa ảnh cũ". There is no other schema impact: the `consentAt`/`consentVersion` move is only the order of the type declaration, and the leads ERD table needs no change.

## Gaps for the builder/loop

- **[MISSING] A19 / all tasks — existing tests PASS**: R1 (labels for `translationSummary`, `activitySummary`, `codeBanner`), R2 (update the media integration test to the new alt behaviour), R3 (re-check after R2; root cause first).
- **[PARTIAL] G12 — Doc reconcile** not done (list above) + spec wording W1–W5.
- Process: the task Verify sections should include `pnpm test` (or at least `tests/unit`) for shared-field changes, not only `vitest run src/...`.

## Residual risk

- Nothing was checked in a browser across T01–T04 (toolbar, `*`, Nâng cao block, banners, ≤ 767px). Manual QA is recommended before deploy.
- R3 root cause is unproven (possible shared DB/S3 state).
