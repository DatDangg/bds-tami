---
id: rental-search-word-match
type: bug
status: done
created: 2026-10-27
---

# Tìm kiếm Cho thuê: "can ho" ra tin không liên quan (khớp chuỗi con)

## Yêu cầu
Tìm kiếm `/cho-thue?q=...` phải ưu tiên tin khớp đúng từ khoá (kể cả gõ không dấu), không để từ khoá khớp lẫn vào giữa từ khác.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/cho-thue?q=can%20ho`, VI, Khách, 1920 (sheet QA 26/10/2026 — bug 1, mức Cao)
- Bước tái hiện: Mở Cho thuê → nhập `can ho` → Tìm kiếm.
- Expected: ưu tiên tin khớp "căn hộ" kể cả nhập không dấu.
- Actual: 25 tin, đầu danh sách là sàn văn phòng Xuân Diệu 700tr, Vinhomes Cổ Loa… — "ho" khớp "c**ho**", "can" khớp "cần".
- Root cause đã xác định: `src/lib/search/rental-search-sql.ts:102` — mỗi từ là `rl."search_text" LIKE '%term%'` (chuỗi con, AND, không ranh giới từ) và ORDER BY chỉ theo `sort` (mới nhất), không có độ liên quan.

## Acceptance (bắt buộc)
- [ ] `can ho` / `căn hộ` không trả tin chỉ chứa "cần", "cho" mà không có "căn hộ"; từ khoá khớp theo ranh giới từ (đầu từ), vẫn không dấu.
- [ ] Tin khớp nguyên cụm (các từ liền nhau đúng thứ tự) xếp trước tin chỉ khớp rời từng từ khi sort mặc định; sort giá vẫn theo giá.
- [ ] Vẫn dùng được index trigram hiện có (không full scan tệ hơn), đếm tổng/facet khớp danh sách; mã tin (CT-0000xx) vẫn tìm được.
- [ ] Test cho các ca trên.

## Ghi chú
Ref: ERD §6 searchText, API_SPEC §3.3. Không đổi schema nếu tránh được.
