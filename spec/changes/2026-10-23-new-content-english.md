---
id: new-content-english
type: feature
status: pending
created: 2026-10-23
---

# Bản tiếng Anh cho data mới nhập staging (3 dự án phân phối + 8 tin tức thật)

## Yêu cầu
3 dự án (Maison Privée, Astor 1, The Windsor Collection) và 8 tin tức thật nhập lên staging ngày 2026-10-23 mới có bản `vi` → bổ sung bản `en` đầy đủ để `/en` hiển thị, cùng chuẩn BL-064 (viết tay, không phải dịch máy thô).

## Bối cảnh
- Script nhập `.import-tmp/import-content.ts` (chưa commit) chỉ ghi `locale: "vi"`; nội dung nguồn ở `docs/content-intake/` (`projects/`, `news/`).
- `pnpm seed:english` (BL-064) chỉ chạy DB dev — `checkSeedEnvironment` chặn staging/prod → cần đường ghi EN cho staging (và sau này prod).
- Dữ liệu EN dev nằm ở `seed/english/data/*.json`, khoá = tiêu đề vi.

## Acceptance (bắt buộc)
- [ ] 3 dự án: tiêu đề, mô tả ngắn, overview, sản phẩm, tiện ích, pháp lý, CSBH, bàn giao… có bản EN; `hasEnglish` bật; alt ảnh EN.
- [ ] 8 tin tức: tiêu đề, sapo, nội dung EN đủ đoạn; văn bản dự thảo vẫn ghi rõ "draft".
- [ ] Giá/số/tên riêng giữ như bản vi (tỷ → billion VND), thuật ngữ BĐS thống nhất với BL-064.
- [ ] `/en` các trang trên staging hiển thị EN, không lẫn tiếng Việt; chạy lại không ghi đè/nhân đôi.
- [ ] Cách đưa lên production được chốt (script nhập có EN, hoặc mở `seed:english` có kiểm soát cho collection cụ thể).

## Ghi chú
Nên làm cùng/sau khi commit script nhập trong `.import-tmp/` (hiện untracked). Liên quan BL-064, BL-065, BL-071.
