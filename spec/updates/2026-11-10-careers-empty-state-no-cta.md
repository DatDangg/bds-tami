# Spec Update — 2026-11-10 careers-empty-state-no-cta

**spec_version:** 1.63.1 → 1.63.2 (PATCH — as-built bug-fix BL-120)
**Trigger:** bug-fix (BL-120, `bug-careers-empty-state-no-cta`)
**Requirements:** SỬA mục Tuyển dụng — bullet "Thiếu email nhận CV (BL-120)": khi 0 vị trí (không lọc) và `site-settings.email` trống/đọc lỗi → không còn câu mời gửi CV; hiện "Hãy quay lại sau hoặc liên hệ TAMI để được tư vấn." (EN: "Please check back later or contact TAMI for advice.") + link "Liên hệ TAMI" / "Contact TAMI" → `/lien-he` / `/en/contact`; banner "Chưa tìm thấy vị trí phù hợp? — Gửi CV ngay" ẩn khi thiếu email (ConsultBanner vẫn hiện). Có email → giữ nguyên BL-114.
**Ảnh hưởng:** `JobListPage`, `CareersCvBanner`, i18n vi/en; module careers (`/tuyen-dung`, `/en/careers`); test lại panel "chưa có vị trí", banner Gửi CV ngay, luồng có email (BL-114), panel lọc không kết quả.
