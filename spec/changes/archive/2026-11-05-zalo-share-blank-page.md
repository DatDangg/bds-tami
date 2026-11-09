---
id: zalo-share-blank-page
type: bug
status: done
created: 2026-11-05
---

# Chia sẻ Zalo: sp.zalo.me/plugins/share chỉ ra màn hình trắng (QA bug 24, Cao)

## Yêu cầu
Nút chia sẻ Zalo ở chi tiết bài viết (vd /tin-tuc/thu-do-ha-noi-tam-nhin-100-nam-2) chuyển tới sp.zalo.me/plugins/share?dl=...&type=link nhưng chỉ trắng trang. Mong đợi: hiện giao diện chia sẻ Zalo với đúng link bài. Kiểm tra tham số/URL share (dl có thể cần origin/domain hợp lệ, staging dùng sslip.io IP nên Zalo có thể chặn — xác nhận root cause trước).

Nguồn: QA sheet "TAMI – Báo bug" dòng 24 (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4).

## Điều tra root cause (change-request, 2026-11-05)
- `curl` (UA trình duyệt) `https://sp.zalo.me/plugins/share?dl=<url>&type=link` trả **HTTP 200, body 0 byte** cho CẢ link staging (`187-52-119-50.sslip.io`) LẪN domain công khai `https://vnexpress.net/` → trang trắng **không phụ thuộc domain staging**; giả thuyết "Zalo chặn sslip.io" bị loại.
- Biến thể `?href=` cũng 0 byte. Staging page tự trả 200 (crawl được).
- SDK chính thức `https://sp.zalo.me/plugins/sdk.js` không dựng URL `plugins/share?dl=`: nút chia sẻ là widget `<div class="zalo-share-button" data-href data-oaid data-layout data-customize data-callback>` → iframe `https://button-share.zalo.me/share_inline?...&url=<href>&d=<base64>`. `data-oaid` (ID Official Account) là thuộc tính của widget.
- Kết luận sơ bộ: root cause ở **code** — `src/components/news/ShareButtons.tsx:83` dùng endpoint không được Zalo hỗ trợ (trả rỗng). Không phải `wontfix-external`.
- Residual: chưa gọi được `button-share.zalo.me` từ máy điều tra (kết nối lỗi) → cần thử trong trình duyệt thật; cần biết TAMI có Zalo OA ID không (widget dùng `data-oaid`).

## Acceptance (bắt buộc)
- [ ] Tái hiện đúng bước QA ghi, thấy lỗi trước khi sửa (root cause trước, không sửa triệu chứng)
- [ ] Sau sửa, bước tái hiện cho kết quả đúng "mong đợi"; có test hồi quy

## Quyết định (user 2026-11-09)
Bỏ hẳn endpoint `sp.zalo.me/plugins/share` (không còn hoạt động); KHÔNG dùng widget SDK / OA ID.
- **Mobile** (thiết bị có Web Share API `navigator.share`): nút **"Chia sẻ"** → mở menu chia sẻ của hệ điều hành → người dùng chọn Zalo → chọn người nhận.
- **Desktop** (không có `navigator.share`): nút **"Chia sẻ qua Zalo"** → copy link bài vào clipboard + thông báo "Đã sao chép liên kết — dán vào Zalo để chia sẻ".
- Áp dụng mọi nơi đang có nút Zalo (chi tiết tin tức; rà ShareButtons dùng chung ở dự án/cho thuê/tin BĐS nếu có). Có bản EN.
