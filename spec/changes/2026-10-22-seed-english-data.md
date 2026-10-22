---
id: seed-english-data
type: feature
status: in_progress
created: 2026-10-22
---

# Seed dev đủ data tiếng Anh (hiện tiếng Việt có, tiếng Anh gần như trống)

## Yêu cầu
Seed dev hiện chỉ ghi `locale: "vi"` (vd `scripts/seed-scraped.ts`), nên `/en` gần như rỗng. Đếm qua API dev 2026-10-22 (`hasEnglish = true` / tổng):
Dự án **3/61**, Cho thuê **0/30**, Tin BĐS **0/36**, Tin tức **0/22**, Dịch vụ **0/3**.

Cách làm (user chọn 2026-10-22): **viết sẵn bản EN cố định vào seed** — dịch tiêu đề, mô tả ngắn, nội dung rich text, trường có cấu trúc (tiện ích, FAQ, sản phẩm, highlights…),
SEO title/description, alt ảnh của **mọi bản ghi** seed: Dự án, Cho thuê, Tin BĐS, Tin tức, Dịch vụ, Danh mục, Tuyển dụng, các global (trang chủ, page heroes, cấu hình chung,
trang Liên hệ/Pháp lý…) → ghi `locale: "en"` + bật `hasEnglish`. Không gọi API AI lúc seed, chạy lại seed ra kết quả giống nhau (idempotent).

## Acceptance (bắt buộc)
- [ ] Sau khi chạy seed dev: mọi bản ghi seed của Dự án, Cho thuê, Tin BĐS, Tin tức, Dịch vụ, Tuyển dụng, Danh mục có bản EN + `hasEnglish = true`.
- [ ] Các global hiển thị ở public (trang chủ, hero trang con, footer/cấu hình chung, liên hệ, pháp lý) có chữ EN, `/en` không còn chỗ trống / rơi về tiếng Việt.
- [ ] Bản EN là tiếng Anh tự nhiên, đúng thuật ngữ BĐS; tên riêng (tên dự án, chủ đầu tư, địa danh) giữ nguyên; slug EN theo quy tắc hiện có.
- [ ] Seed chạy lại 2 lần không nhân đôi bản ghi, không ghi đè sai bản vi.
- [ ] Kiểm `/en`, `/en/projects`, `/en/rentals`, `/en/property-posts` (tên route theo `routing.ts`), `/en/news`, 1 chi tiết mỗi loại: có data, số đếm tiện ích/danh mục đúng.
- [ ] Chỉ seed dev — không chạy lên staging/prod (§ Non-negotiables).

## Ghi chú
- File: `scripts/seed-*.ts`, `scripts/seed.mjs`. Khối lượng dịch lớn → nên tách task theo loại nội dung.
- Không đổi schema → không migration.
