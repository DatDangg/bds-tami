# Spec Update — 2026-10-28 news-scheduled-publish

**spec_version:** 1.60.0 → 1.61.0 (MINOR — thêm tính năng: hẹn giờ xuất bản cho Tin tức)
**Trigger:** feature-update (BL-091, change-request class ADDITIVE)
**Work item:** `feature/news-scheduled-publish`
**Change doc:** `spec/changes/2026-10-27-news-scheduled-publish.md`

## Lý do
QA sheet 27/10 dòng 13: admin không đặt được "Ngày xuất bản" ở tương lai cho tin tức. Đúng hiện trạng (ô chỉ đọc có chủ đích); hẹn giờ là FR-ADM-16 (Could) chưa làm. User chốt 2026-10-27: làm cho **chỉ Tin tức**, không cronjob (lọc lúc truy vấn), không gửi email bản tin.

## Delta (SPECIFICATIONS.md: quy tắc biên "Hẹn giờ xuất bản (FR-ADM-16 — BL-091 …)" + dòng ưu tiên Could, dòng F10, dòng "Còn mở")
- THÊM (Tin tức): ô "Ngày xuất bản" (`publishedAt`) sửa được, chọn ngày + giờ theo giờ Việt Nam (không đổi schema: ô chọn theo múi giờ máy, ghi chú GMT+7 + cảnh báo nếu máy khác GMT+7; nhãn/cảnh báo hiển thị Asia/Ho_Chi_Minh); để trống → tự điền khi xuất bản lần đầu như cũ.
- THÊM: khách chỉ thấy tin `published` có `publishedAt` trống hoặc ≤ now — lọc lúc truy vấn (`buildPublicWhere` + truy vấn SQL riêng: tìm `q`/tag, Chủ đề, "Đọc nhiều"); áp cho danh sách/danh mục, chi tiết (404), tin liên quan, trang chủ, sitemap, JSON-LD, `llms.txt`, API khách, chuyển ngôn ngữ, đếm lượt xem.
- THÊM: tới giờ tự hiện, không job (ISR `revalidate = 60` → trễ tối đa ~60s; cache khối "Đọc nhiều" hạ 10 phút → 60s).
- THÊM: staff vẫn xem được tin hẹn giờ; nhãn "Đã hẹn giờ · <dd/MM/yyyy HH:mm>" ở danh sách admin; cảnh báo khi đổi ngày tin đang hiện web sang tương lai.
- SỬA: dòng cũ "job Payload chạy mỗi phút" → lọc lúc truy vấn; FR-ADM-16 thu hẹp cho Tin tức. Dự án / Cho thuê / Tin BĐS KHÔNG đổi. Không đổi schema → không migration.

## Ảnh hưởng
Access/truy vấn công khai dùng chung (risk medium-high): `buildPublicWhere`, `news-search.ts`, `most-read.ts`, route Tin tức VI/EN, trang chủ, sitemap, llms.txt, API khách, admin News.
