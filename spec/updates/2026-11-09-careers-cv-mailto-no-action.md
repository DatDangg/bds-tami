# Spec Update — 2026-11-09 careers-cv-mailto-no-action

**spec_version:** 1.62.5 → 1.62.6 (PATCH — as-built bug-fix, thêm nút sao chép email theo hướng đã duyệt)
**Trigger:** bug-fix (BL-114, QA 31)
**Requirements:** THÊM ý "Sao chép email nhận CV" dưới "Danh sách Tuyển dụng": nút "Sao chép email" cạnh `mailto:` ở trạng thái trống và banner "Gửi CV ngay"; thông báo "Đã sao chép"; lỗi clipboard hiện email để chép tay.
**Ảnh hưởng:** `/tuyen-dung` (+ bản EN), `CtaBanner` (slot `extraAction` tuỳ chọn, nơi khác không đổi), i18n `page.careers.v2.cvCopy/cvCopied/cvCopyFailed`.
