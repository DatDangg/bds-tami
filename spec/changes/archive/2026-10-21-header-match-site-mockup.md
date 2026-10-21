---
id: header-match-site-mockup
type: feature
status: done
created: 2026-10-21
---

# Header làm theo mockup site redesign (BL-045 bỏ sót)

## Yêu cầu
User 2026-10-21 (sau khi chạy local BL-045): "sao cái header không đổi như mockup thế".
BL-045 đã làm lại mọi trang con theo `docs/specs/site-redesign-mockup/index.html` nhưng **không đưa header vào phạm vi** (change doc chỉ ghi "giữ element hiện tại"; T01–T07 giữ header BL-019/BL-020/BL-025) → header thật vẫn là thanh kính mờ, khác mockup.

## Hiện trạng vs mockup (đo ở 1440, `/du-an`)
| | Thật (spec Khung trang, BL-025) | Mockup `.hdr` |
|---|---|---|
| Cao ở đầu trang | 104px (`--header-offset` ≥ lg) | 72px |
| Logo | 48px | 36px |
| Menu | 14px, gap 16px, letter-spacing 1.12px | 12px, gap 26px, letter-spacing .04em, mục đang xem gạch chân vàng `--color-primary` |
| Nền | kính mờ kem ~80% + blur, không viền | trắng đặc `--color-surface` + viền dưới `--color-border` |
| Khi cuộn | thành thanh nổi bo tròn có bóng (trang chi tiết: ẩn hẳn) | sticky đứng yên |

## Phạm vi user chốt (2026-10-21)
User: "đang nói cái chữ ấy — cái chữ của menu trên mockup trông sát đẹp hơn hiện tại" → **chỉ đổi chữ menu ngang**: `--text-xsmall` 12px, letter-spacing .04em, gap 24px (xl). Chiều cao / nền kính / hành vi cuộn **giữ nguyên**. Đã làm: `src/components/layout/DesktopNav.tsx` + design-spec §2.1; kiểm 1280 VI/EN không tràn, 1 hàng.

User tiếp: "cho header thấp xuống" → `--header-offset` 64px (≥ lg 72px = mockup), thanh nổi khi cuộn 52/56px lề trên 6/8px, logo ≥ lg 36px; nền kính + hành vi cuộn (nổi / ẩn ở trang chi tiết) giữ nguyên. Files: globals.css, HeaderFrame.tsx, Header.tsx (+ test), SPECIFICATIONS Khung trang, design-spec §2.1. Kiểm 1440/375: header 72/64, không tràn, hero/chi tiết bám đúng.

User tiếp (ảnh chụp chi tiết dự án): "sao phần thanh này lại dính lên, ở tất cả màn" → thanh mục con dính sát đáy thẻ tiêu đề: `DetailTitleCard` (T04 BL-045) thiếu khoảng 32px trước thanh mục con (BL-031, mockup `.subnav` margin-top 32px). Sửa: `pb-8` cho thẻ. Đo 1440: khoảng cách 32px ở chi tiết dự án / cho thuê / tin BĐS.

## (Không làm) Các điểm khác của header mockup
1. Áp cho **mọi trang kể cả trang chủ**, hay chỉ trang con? (header dùng chung)
2. Khi cuộn: giữ thanh nổi bo tròn (BL-025) hay đổi sang sticky phẳng như mockup? Trang chi tiết có giữ "ẩn khi cuộn" (BL-027)?
3. Nút CTA header (`header.ctaButton`) — mockup không có; giữ khi admin bật?
4. Mục đang xem: gạch chân vàng như mockup (đổi quy tắc BL-020 "chỉ dùng màu chữ trên kính" — hết kính thì không còn ràng buộc).

## Ảnh hưởng dự kiến
`src/components/layout/Header*`, `--header-offset` (globals.css → mọi chỗ bù sticky/scroll-margin, thanh mục con, aside dính), spec Khung trang + design-spec §2.1, test header.
