---
id: utm-capture-public-layout
type: feature
status: done
created: 2026-10-19
backlog: BL-010
---

# Ghi UTM ở mọi trang công khai (không chỉ trang có LeadForm)

## Yêu cầu
MODIFY (review L10-T01 round 1 MINOR-2). UTM chỉ được ghi khi trang có `LeadForm` mount (`src/components/leads/LeadForm.tsx:49`) → khách vào từ quảng cáo ở trang chủ/danh sách rồi sang chi tiết mất UTM. Thêm island nhỏ ở layout công khai lưu `utm_*` vào sessionStorage; LeadForm đọc từ đó.

## Acceptance (bắt buộc)
- [x] Vào bất kỳ trang công khai (VI/EN) có `utm_*` → lưu vào sessionStorage (giữ quy tắc ghi đè hiện có của LeadForm)
- [x] Sang trang khác có LeadForm → lead gửi kèm UTM đã lưu
- [x] URL không có `utm_*` → không ghi; không phá static/caching của layout (island client nhỏ)
- [x] sessionStorage không khả dụng → không crash
- [x] Test; `pnpm test`/lint/typecheck/build PASS
