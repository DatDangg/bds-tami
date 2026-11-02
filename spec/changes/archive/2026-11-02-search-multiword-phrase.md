---
id: search-multiword-phrase
type: bug
status: done
created: 2026-11-02
---

# Tìm kiếm nhiều từ khớp lẻ từng từ — Cho thuê, Tin tức, Tuyển dụng (QA sheet 30/10 bug 22)

## Yêu cầu
Ô tìm kiếm từ khoá có ≥ 2 từ phải trả về tin chứa **cả cụm** (vd khu vực "Ba Đình"), không phải tin chứa từng từ rải rác.
Sửa chung cho các trang dùng logic tách từ: `/cho-thue`, `/tin-tuc` (+ trang danh mục tin), `/tuyen-dung`.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/cho-thue?q=ba+đình` (VI, Khách) — QA sheet 30/10 dòng 22. Cùng lỗi ở `/tin-tuc?q=...` và `/tuyen-dung?q=...` (phát hiện khi soi code 2026-11-02).
- Bước tái hiện: vào Cho thuê → nhập "ba đình" → tìm → xem danh sách.
- Expected: chỉ tin thuộc/chứa khu vực "Ba Đình".
- Actual: lẫn tin khu vực khác.

Root cause đã xác định (đọc code, chưa repro trên DB):
- `src/lib/search/rental-search-sql.ts:120` — `searchTerms(q)` tách từ, mỗi từ một `LIKE '%term%'` + regex đầu-từ, AND với nhau nhưng KHÔNG cần liền nhau. "ba đình" → `ba` + `dinh` → khớp tin ở "Mỹ Đình" có "ba phòng ngủ"/"ban công", hoặc tiêu đề có "gia đình"/"cố định" (bỏ dấu → `dinh`). `phraseMatchExpression` chỉ dùng xếp hạng (BL-080), không lọc.
- `src/lib/news/news-search.ts:47` — cùng `searchTerms` + `LIKE '%term%'`, **không** có ràng buộc đầu-từ → "quyết định", "bao", "ban"… đều khớp; nặng hơn Cho thuê.
- `src/lib/careers/job-filters.ts:56` — `haystack.includes(term)` từng từ, không đầu-từ, không cụm (chỉ trên tên vị trí).
- `/du-an`, `/tin-bds` khớp nguyên cụm (`project-list-facets.ts:125`, `post-list-facets.ts:106`) — ngoài phạm vi, chỉ tham khảo hành vi.

## Acceptance (bắt buộc)
- [x] `/cho-thue?q=ba đình` (có dấu hoặc không dấu, hoa/thường) chỉ trả tin mà `searchText` chứa cụm "ba dinh" liền nhau ở ranh giới từ; tin "Mỹ Đình" + "ba phòng ngủ" / "gia đình" không còn khớp.
- [x] `/tin-tuc?q=ba đình` không còn khớp bài chỉ chứa "quyết định"/"gia đình"/"bao"…; cùng quy tắc cụm + đầu-từ.
- [x] `/tuyen-dung?q=<2 từ>` cùng quy tắc cụm + đầu-từ trên tên vị trí.
- [x] Từ khoá 1 từ giữ hành vi hiện tại (đầu-từ ở Cho thuê); số đếm facet/ô lọc khớp với danh sách.
- [x] Test hồi quy cho cả 3 trang (ca "ba đình" vs "Mỹ Đình" + "ba phòng ngủ" / "gia đình").
- [x] API_SPEC / DESIGN cập nhật mô tả quy tắc tìm từ khoá nếu có ghi.

## Ghi chú
Quyết định thiết kế cho builder: cụm theo đúng thứ tự từ người dùng gõ (đã có `phraseRegex`). Cân nhắc giữ xếp hạng BL-080 (không còn cần vì đã lọc cụm).
