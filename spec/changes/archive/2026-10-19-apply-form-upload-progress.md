---
id: apply-form-upload-progress
type: feature
status: done
created: 2026-10-19
backlog: BL-005
---

# Form ứng tuyển: % tiến trình tải CV + vùng kéo-thả ≥ md

## Yêu cầu
MODIFY — nợ thiết kế L7-T04 (D3 spec-validation layer 7). design-spec §3.4: CV có vùng kéo-thả ở ≥ md (nút "Chọn tệp / Choose file" mọi cỡ); khi gửi hiện thanh tiến trình upload (XHR progress) trong nút, hiện "%", không có track nền. Hook `usePublicForm` dùng fetch, không có upload progress → cần XHR riêng trong `ApplyForm`.

## Acceptance (bắt buộc)
- [ ] ≥ md: vùng kéo-thả nhận file (.pdf/.doc/.docx ≤ 5MB), validate giống chọn tệp; < md chỉ nút chọn tệp
- [ ] Khi gửi: nút hiện % tiến trình upload thật (XHR `upload.onprogress`); xong/lỗi về trạng thái như cũ
- [ ] Giữ nguyên contract endpoint, Turnstile, thông báo lỗi/thành công, i18n VI/EN
- [ ] A11y: vùng kéo-thả có label + fallback nút bàn phím; tiến trình đọc được (`aria-live` hoặc progressbar)
- [ ] Test component kéo-thả + progress; `pnpm test`/lint/typecheck/build PASS

## Ghi chú
design-spec §3.4 (dòng ~163-165).
