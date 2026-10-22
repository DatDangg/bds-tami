---
id: button-variants-merge-and-empty-upload
type: bug
status: done
completed: 2026-10-22
created: 2026-10-22
---

# Follow-up BL-056: `buttonVariants` không gộp class (viền vô hình) + ảnh rỗng làm hiện "Xem thêm" trống (BL-057)

## Yêu cầu
Hai việc còn mở sau review BL-056 (`.context/review-reports/bug-listing-detail-design-match-phase-1-task-01-round-2-review.md`, n-1 + n-2):

1. **n-2: `buttonVariants` trả class chưa gộp.** `src/components/ui/button.tsx` gọi `cva` với base `border border-transparent`.
   Biến thể `secondary` / `outline` / `chip` thêm màu viền (`border-border`, `border-text`, `border-on-dark/30`). Nếu dùng
   `buttonVariants({ variant })` thẳng làm `className` (không bọc `cn()`), `border-transparent` có thể thắng trong CSS → viền vô hình.
   Đây là root cause thật của A5 BL-056 (đã vá bằng `cn()` tại 3 file spotlight).
   - Hiện trạng soát 2026-10-22: mọi chỗ dùng biến thể có màu viền đều đã bọc `cn()`. Các chỗ còn gọi trần đều là `primary`
     (không xung đột màu viền): `NewsArticleSidebar.tsx:59`, `NewsCard.tsx:68`, `PostSpotlightContent.tsx:80`,
     `ProjectSpotlightContent.tsx:53`, `RentalSpotlightContent.tsx:57`.
   - Việc cần làm là **chặn tái phát**: để chính `buttonVariants` trả class đã gộp (vd bọc kết quả `cva` qua `cn`/`twMerge`),
     để gọi trần cũng đúng, rồi bỏ các `cn(buttonVariants(...))` thừa nếu muốn.
2. **n-1: upload rỗng mở "Xem thêm" trống.** `src/lib/content/rich-text-lead.ts:3` coi mọi node `upload` là nội dung thêm.
   Node `upload` mà media đã bị xoá / không có URL thì `RichText` không render gì, nhưng `DetailOverviewIntro` vẫn hiện nút
   "Xem thêm" → bấm ra khoảng trống. Cần dùng chung 1 hàm kiểm tra "upload hiển thị được" giữa `RichText` và `rich-text-lead`.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: khách (public); chi tiết `/du-an/<slug>`, `/cho-thue/<slug>`, `/tin-bds/<slug>` (+ `/en`); mọi nút/link dùng `buttonVariants`.
- Bước tái hiện:
  - n-1: tạo bài có `overview` = 1 đoạn văn + 1 ảnh, rồi xoá media đó trong admin → mở trang chi tiết → bấm "Xem thêm".
  - n-2: dùng `className={buttonVariants({ variant: "outline" })}` (không `cn`) trên 1 `Link` → đo `border-top-color`.
- Expected: n-1 không hiện nút "Xem thêm" khi phần còn lại không có gì hiển thị được; n-2 viền hiện đúng màu biến thể.
- Actual: n-1 nút hiện, mở ra trống; n-2 `border-top-color` = `rgba(0,0,0,0)` (đo ở BL-056 vòng 1).

## Acceptance (bắt buộc)
- [ ] `buttonVariants(...)` gọi trần (không `cn`) cho `secondary` / `outline` / `chip` không còn `border-transparent` trong chuỗi class; có unit test cho 3 biến thể.
- [ ] `Button` và mọi chỗ đang dùng `cn(buttonVariants(...), extra)` hiển thị không đổi (class `extra` vẫn ghi đè được).
- [ ] Node `upload` không có media / không có URL không tính là nội dung thêm → không có nút "Xem thêm" nếu chỉ còn node đó; có unit test.
- [ ] `RichText` và `rich-text-lead` dùng chung 1 hàm kiểm tra upload hiển thị được.
- [ ] Test + typecheck + lint + build PASS.

## Ghi chú
- Follow-up của BL-056 (`spec/changes/archive/2026-10-22-listing-detail-design-match.md`). Không đổi schema, không migration.
- n-2 hiện chưa gây lỗi hiển thị nào đang chạy (đã soát), đây là việc chặn tái phát. n-1 là lỗi hiển thị thật nhưng chỉ xảy ra khi media bị xoá.
