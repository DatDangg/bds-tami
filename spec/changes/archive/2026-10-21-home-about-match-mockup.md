---
id: home-about-match-mockup
type: feature
status: done
created: 2026-10-21
---

# Trang chủ — khối Về TAMI làm lại đúng mockup (BL-047)

## Yêu cầu
User 2026-10-21 gửi ảnh cắt từ mockup trang chủ (`docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp`): "cái về tami hiện tại chưa đúng nhé".

## Lệch (đo 1440) và cách sửa
| Lệch | Sửa |
|---|---|
| Cụm ảnh nhỏ hơn mockup (ảnh lớn 388px, ảnh phụ 212px), chữ cột rộng | Cụm ảnh 7/12 cột: ảnh lớn ≈ 430px, ảnh phụ ≈ 250px; chữ cột 8–12 tối đa 27rem; tiêu đề `--text-h1` |
| Không có toà nhà trang trí mép phải | `decorImage` 10% mép phải, mờ + mask nhạt dần, không đè chữ |
| Icon số liệu khiên / người | Thêm icon `medal` + `users-three` vào danh sách icon (migration additive `20261021_020651_about_stats_icons`, down đổi về star/users trước khi dựng enum cũ) |
| Dữ liệu dev: ảnh phụ là mặt bằng, thiếu chữ | `pnpm seed:page-heroes` thêm `seedHomeAbout`: ảnh phụ phòng khách, ảnh trang trí toà tháp (bdstanlong, gitignore), đoạn giới thiệu + chú thích 4 dòng vi/en, icon số liệu |

Không đổi: nền kem, nút play/video, thứ tự khối, bố cục < lg. Hoa văn sóng mép trái mockup chưa làm.
