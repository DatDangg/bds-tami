# feature-legal-en-edit-requires-reapproval · phase-1-task-01 — sửa tay bản EN pháp lý đã duyệt → bỏ duyệt, ẩn /en

- Change doc: `spec/changes/archive/2026-10-19-legal-en-edit-requires-reapproval.md` (BACKLOG BL-013)
- Nguồn: review L10-T02 round 4; user quyết BR-08 ngày 2026-10-19 (bắt duyệt lại)
- Spec: BRD v1.6 BR-08 (bullet mới), `SPECIFICATIONS.md` F12

## Classification / Risk
- Type: **MODIFY** (đổi hành vi luồng duyệt EN trang pháp lý đã có ở L10-T02, commit 6321020)
- Risk: **MEDIUM-HIGH** — ẩn/hiện nội dung công khai (`/en`), hook ghi `hasEnglish` của `pages` (chỉ admin), tương tác với `guardEnglishApproval`, `approveEnglish`, `detectManualEnglish`, job dịch, cache `/en`. Không đổi schema (không migration), không đổi API shape.

## Hiện trạng (đọc code)
- `src/hooks/translation/detect-manual-en.ts` — beforeChange chung (`content-defaults.ts:166`) chạy TRƯỚC hook riêng của collection: request ghi locale `en`, không phải job, có trường dịch được khác bản `en` đã lưu (`hasManualEnglishEdit`) → `translation.enSource = manual`. Không đụng `hasEnglish`.
- `src/hooks/pages/approve-english.ts` — `guardEnglishApproval` (beforeChange Pages) chỉ chặn bật `hasEnglish` false→true khi thiếu cờ `req.context.approveEnglish`; `approveEnglish` (afterChange) audit + `translation.status = done`.
- Job dịch ghi bản AI cho `pages` → `hasEnglish = false` + `pending_review` + làm mới `/en` + `/vi` (`src/jobs/translate-content-save.ts`).
- Lỗ hổng: admin sửa tay `title`/`content` locale `en` của trang đã duyệt (`hasEnglish = true`) → nội dung mới lên `/en` ngay.

## Thiết kế (gợi ý — builder chốt theo code thật)
- Pages `beforeChange`: khi `originalDoc.hasEnglish === true`, không phải job dịch (`TRANSLATION_JOB_CONTEXT_KEY`), không phải lệnh duyệt (`APPROVE_ENGLISH_CONTEXT_KEY`), request ghi locale `en` (hoặc `all` có nhánh `en`) và nội dung EN dịch được thật sự đổi (dùng lại `hasManualEnglishEdit` + `leavesOfDoc`, cùng tiêu chí của `detectManualEnglish`; `isFilled` từ BL-012 giữ nguyên) → `data.hasEnglish = false` và `translation.status = pending_review` (giữ `enSource = manual` do `detectManualEnglish` đặt).
- Làm mới cache `/en` (+ `/vi` nếu cần cho hreflang/counterpart) của trang khi bị hạ duyệt — kiểm `revalidatePage.afterChange` đã đủ chưa (trang có thể không `published`?).
- Không đổi: lệnh duyệt `POST /api/admin/translations/pages/:id/approve` (409 khi đã bật, 422 khi thiếu trường), `guardEnglishApproval` (form cũ không tự duyệt lại).
- Audit (tuỳ chọn, chỉ nếu đơn giản): không bắt buộc theo acceptance.

## Acceptance
- [ ] Sửa trường nội dung EN (title/content) của trang pháp lý đã duyệt qua admin form/REST/Local API (không phải lệnh duyệt) → `hasEnglish = false`, `translation.status = pending_review`; `/en` của trang ẩn (404, không có trong sitemap EN, locale-counterpart không trỏ /en) như luồng AI dịch lại
- [ ] Lưu không đổi nội dung EN (chỉ sửa VI / `version` / `effectiveDate` / lưu lại form EN y nguyên) → giữ `hasEnglish = true`
- [ ] Lệnh duyệt rõ ràng duyệt lại được → `hasEnglish = true`, status `done`, `/en` hiện lại; form cũ còn `hasEnglish = true` không tự duyệt (giữ chặn hiện có)
- [ ] Job dịch / lệnh duyệt không bị hook mới hạ duyệt nhầm
- [ ] Test hồi quy (integration `tests/integration/retranslate.test.ts` hoặc file mới) + unit nếu tách hàm
- [ ] `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` PASS; integration `pnpm vitest run --project integration` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
- Thiết kế chốt: hook `revokeEnglishOnManualEdit` (beforeChange `pages`, `src/hooks/pages/approve-english.ts`), gắn trước `guardEnglishApproval` (`src/collections/Pages.ts`). Điều kiện hạ: `originalDoc.hasEnglish === true`, không có cờ `translationJob`/`approveEnglish`, request ghi locale `en` (hoặc `all` → nhánh `en` + đọc bản `en` đã lưu), và `hasManualEnglishEdit(leavesOfDoc(before), leavesOfDoc(after), after)` = true (cùng tiêu chí `detectManualEnglish`, `isFilled` không đổi) → `hasEnglish = false`, `translation.status = pending_review` (giữ `enSource = manual` do `detectManualEnglish` đặt). Trường không dịch (`version`, `effectiveDate`) không vào leaves nên không hạ. Cache `/en` + `/vi`: `revalidatePage.afterChange` sẵn có làm mới khi trang `published` (không đổi). Không đổi schema/API shape.
- TDD: 4 test integration mới trong `tests/integration/retranslate.test.ts` (sửa tay EN Local API; REST `PATCH ?locale=en`; locale `all`; lưu không đổi EN/chỉ VI/`version`/`effectiveDate` giữ true). Trước fix: 2 test hạ duyệt FAIL (`expected true to be false`), sau fix: 28/28 PASS file này.
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm build` PASS · `pnpm vitest run --project integration tests/integration/retranslate.test.ts` 28/28 PASS · `pnpm test` 2428 passed / 1 failed — fail duy nhất là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" (fail sẵn, phụ thuộc ngày, ngoài scope).
- Không có oxlint config trong repo → bỏ qua `npx oxlint`.

## Doc impact / Reconcile
- Intent (user duyệt BR-08 2026-10-19): `docs/BRD.md` v1.6 BR-08 thêm bullet; `SPECIFICATIONS.md` F12.
- As-built: `docs/API_SPEC.md` §5.2 (hook `revokeEnglishOnManualEdit`, điều kiện hạ/giữ duyệt), `docs/ARCHITECTURE.md` bảng job `translate-content` (luồng duyệt pages). Không đổi schema/ERD, không đổi API shape.
- Spec publish: spec_version 1.2.2 → 1.3.0 (MINOR), `spec/updates/2026-10-19-legal-en-edit-requires-reapproval.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` scopeVersion 2 (trigger feature-update).

## Review
- STRICT PASS round 1 — `.context/review-reports/feature-legal-en-edit-requires-reapproval-phase-1-task-01-round-1-review.md` (0 CRITICAL/MAJOR, 4 MINOR: #2 ngày BRD, #3 doc as-built, #4 filesNote test-scope đã xử lý ở close-out; #1 ghi residual risk).
- Reviewer: lint/typecheck PASS, integration 698/698 PASS, `pnpm test` 2428/1 fail pre-existing.

## Residual risk
- Restore version cũ trong admin (Payload dựng dữ liệu restore ở locale mặc định `vi`) không đi qua bước hạ duyệt: version còn `hasEnglish=true` thường mang bản EN đã duyệt, trừ version tạo trước thay đổi này (reviewer MINOR #1, rủi ro thấp — tách task nếu cần).
- Chưa audit riêng sự kiện hạ duyệt do sửa tay (acceptance không bắt buộc).
- Nút "Duyệt bản EN" hiện lại sau khi lưu chưa thử trên browser (suy ra từ form nhận doc server `hasEnglish=false`, giống luồng job dịch).
- Trang chưa `published` → không revalidate (đúng hành vi hiện tại; `/en` render theo `hasEnglish`).
