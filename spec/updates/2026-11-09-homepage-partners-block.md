# Spec Update — 2026-11-09 homepage-partners-block

**spec_version:** 1.62.6 → 1.63.0 (MINOR — ADDITIVE, FR-PUB-17 có giao diện)
**Trigger:** feature-update (BL-107, QA 26; quyết định user 2026-11-09)
**Requirements:** THÊM F1 "Đối tác (FR-PUB-17, BL-107)": khối `partners` render từ `developers.showAsPartner` (sortOrder rồi tên, tối đa 24) theo `blockOrder`/`enabled`; dải logo + tên chạy ngang (thay lưới chỉ logo / "không marquee" của design-spec S01), logo grayscale → màu khi hover/focus, `website` http(s) → link tab mới; dừng khi hover/focus + nút Dừng/Phát; reduced-motion và ≤ 4 đối tác → tĩnh; bản lặp aria-hidden + inert; 0 đối tác → ẩn; tiêu đề mặc định "Đối tác"/"Partners"; `/en` theo BR-07; lưu/xoá chủ đầu tư là đối tác → làm mới `/`, `/en`.
**Ảnh hưởng:** trang chủ `/`, `/en`; collection `developers` (hook revalidate mới); không schema/migration/API/quyền.
