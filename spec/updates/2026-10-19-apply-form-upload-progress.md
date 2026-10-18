# Spec Update — 2026-10-19 apply-form-upload-progress

**spec_version:** 1.6.0 → 1.7.0 (MINOR — thêm khả năng UI người dùng thấy vào requirement F6: vùng kéo-thả CV ở ≥ md và % tiến trình tải lên thật khi gửi. Theo `docs/SPEC_VERSIONING.md`, PATCH chỉ dành cho "làm rõ, không đổi behavior"; ở đây hành vi form đổi so với code hiện tại. Tiền lệ: 1.6.0 (BL-007), 1.5.0 (BL-010). Không đổi API/schema.)

**Trigger:** feature-update (Change Request MODIFY, BL-005 — nợ thiết kế L7-T04, D3 spec-validation layer 7) — change doc `spec/changes/2026-10-19-apply-form-upload-progress.md`, task `tasks/feature-apply-form-upload-progress/phase-1-task-01.md`

**Requirements:**
- SỬA **F6 (Tuyển dụng)** trong `SPECIFICATIONS.md`: form nộp CV — màn ≥ md có thêm vùng kéo-thả tệp cạnh nút "Chọn tệp", kiểm đuôi + dung lượng như khi chọn tệp; khi gửi, nút hiện % tiến trình tải lên thật và trình đọc màn hình đọc được (design-spec §3.4).
- **design-spec §3.4** (`.context/design-spec.md`): đã mô tả sẵn (vùng kéo-thả ≥ md, nút "Chọn tệp / Choose file" mọi cỡ, % tiến trình upload trong nút, không track nền) — không đổi chữ.
- Liên quan (không đổi chữ): **FR-PUB-09** (form ứng tuyển), **API_SPEC §3.2** `POST /api/public/job-applications` (contract giữ nguyên).

**Code dự kiến (builder chốt):**
- `src/components/careers/ApplyForm.tsx` (vùng kéo-thả ≥ md, gửi bằng XHR có `upload.onprogress`, % trong nút, vùng đọc được cho trình đọc màn hình)
- `src/components/careers/ApplyForm.test.tsx`
- `src/components/forms/use-public-form.ts` (+ test, + `submit-helpers.ts` nếu cần) — đường gửi có tiến trình; LeadForm dùng chung không đổi hành vi
- `src/i18n/messages/vi.json`, `src/i18n/messages/en.json` (nhãn vùng kéo-thả, nhãn tiến trình)

**Schema/API:** không đổi (endpoint, field, mã lỗi `postingClosed`, 413/415/429 giữ nguyên).

**Ảnh hưởng:**
- Form ứng tuyển ở trang chi tiết tuyển dụng (VI/EN).
- Retest: gửi hồ sơ 200 / 400 field / `postingClosed` / 413 / 415 / 429 / 5xx / mất mạng, Turnstile reset; form lead dự án / cho thuê / liên hệ (dùng chung `usePublicForm`) không đổi.

**Docs đã cập nhật:** `SPECIFICATIONS.md` F6 + version. `.context/design-spec.md` §3.4 không đổi. As-built (`docs/API_SPEC.md`/`docs/ERD.md`): no doc impact.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 7
