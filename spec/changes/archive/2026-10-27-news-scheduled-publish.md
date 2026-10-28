---
id: news-scheduled-publish
type: feature
status: done
created: 2026-10-27
---

# Tin tức: hẹn giờ xuất bản (ngày giờ trong tương lai) (BL-091)

Nguồn: QA sheet "TAMI – Báo bug" dòng 13 (27/10/2026, mức Trung bình, ghi chú "Đề xuất").

## Yêu cầu
Admin đặt "Ngày xuất bản" ở tương lai cho tin tức; tin chỉ hiện trên website từ thời điểm đó và tự hiện khi đến giờ.

## Bối cảnh
- Màn/route/role: `/admin/collections/news` · Admin · 1920
- Actual (QA): không đặt được ngày giờ xuất bản trong tương lai.

## Quyết định user (2026-10-27)
- **Chỉ Tin tức** (`news`). Dự án / Cho thuê / Tin BĐS giữ nguyên: "Ngày xuất bản" chỉ đọc, tự điền khi xuất bản lần đầu.
- **Không cronjob**: lọc `publishedAt ≤ now` lúc truy vấn; trang có cache trễ tối đa ~60s (`revalidate = 60`).
- **Không gửi email bản tin** (chưa làm).

## Acceptance (bắt buộc)
- [ ] Chỉ ở Tin tức: ô "Ngày xuất bản" sửa được, chọn ngày + giờ (giờ Việt Nam), lưu đúng; để trống → như cũ (tự điền khi xuất bản lần đầu).
- [ ] Tin `published` có `publishedAt > now` không hiện với khách ở: danh sách + danh mục, chi tiết (404), tìm `q`, tag, "Được quan tâm nhiều", tin liên quan, trang chủ, sitemap, JSON-LD.
- [ ] Đến giờ tự hiện, không thao tác thêm; trễ tối đa ~60s ở trang có cache.
- [ ] Staff đăng nhập vẫn xem được tin hẹn giờ; danh sách admin có nhãn "Đã hẹn giờ · <ngày giờ>".
- [ ] Sửa ngày của tin đã lên web sang tương lai → có cảnh báo (tin sẽ bị ẩn tới giờ đó).
- [ ] Dự án / Cho thuê / Tin BĐS không đổi hành vi (test khoá).

## Ghi chú
Feature ADDITIVE (FR-ADM-16 thu hẹp cho Tin tức). Liên quan BL-059: đồng bộ điều kiện `publishedAt ≤ now` ở `news-search.ts`, `listTopNewsTags`, `most-read.ts`. Spec delta: `SPECIFICATIONS.md:310` đổi "job mỗi phút" → lọc lúc truy vấn, chỉ Tin tức.

## Kiểm tra 2026-10-27
- QA đúng: ô "Ngày xuất bản" đang **chỉ đọc có chủ đích** — `src/fields/published-at.ts` (`readOnly`, `access.create/update: denyAll`, hook tự điền khi xuất bản lần đầu).
- Hẹn giờ đã có trong spec là **FR-ADM-16, mức Could, chưa làm** (`SPECIFICATIONS.md:126`, `:310`: bài `published` có `publishedAt` tương lai chưa hiện công khai; job Payload mỗi phút revalidate). Chỗ thêm điều kiện đã chừa sẵn: `buildPublicWhere` (`src/access/publishedOnly.ts`). Dùng chung cho Dự án / Cho thuê / Tin BĐS / Tin tức.
- → Không phải bug: là tính năng chưa làm theo spec. Cần user quyết có làm FR-ADM-16 bây giờ không.
