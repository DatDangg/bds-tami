---
id: listing-tabs-arrow-overlap
type: bug
status: done
created: 2026-10-27
---

# Thanh danh mục danh sách: nút mũi tên đè lên mục cuối (follow-up BL-084)

## Yêu cầu
Feedback user 2026-10-27 về fix BL-084 (commit de736c0), kèm ảnh `/cho-thue` ~1320px: nút mũi tên phải (tròn trắng) nằm ĐÈ lên mục "Mặt bằng kinh doanh" — chữ "Mặ…" bị che sau nút. User: "làm như này thì cái mũi tên kia vẫn che".

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/cho-thue` (và `/du-an`, `/tin-bds` dùng chung), Khách, ≥ md
- Code: `src/components/listing/ListingTabsScroller.tsx` (nút mũi tên absolute đè lên vùng cuộn), `src/components/listing/ListingCategoryTabs.tsx`.
- Expected: nút mũi tên không che nội dung mục nào; mục bị cắt chỉ mờ dần ở mép vùng cuộn, KHÔNG nằm dưới nút.
- Actual: nút đè lên mục cuối đang thấy một phần.

## Acceptance (bắt buộc)
- [ ] Nút mũi tên nằm trong làn riêng ngoài vùng cuộn (vùng cuộn thu hẹp nhường chỗ khi tràn, hoặc tương đương) — không phần tử tab nào bị nút che ở mọi vị trí cuộn; fade nằm ở mép vùng cuộn.
- [ ] Không tràn thì không có nút/làn thừa, layout như cũ; mobile vẫn vuốt.
- [ ] Gộp xử lý 2 MINOR liên quan của review BL-084: nút biến mất làm mất focus bàn phím (chuyển focus hợp lý hoặc giữ nút disabled), mục đang focus không bị che bởi fade/nút.
- [ ] Ảnh trước/sau ở 1920/1440/1320/1280/768/390.
