---
id: list-page-banner-image
type: feature
status: done
created: 2026-10-19
---

# Ảnh nền banner đầu trang danh sách (theo phong cách vinhomes.vn)

## Yêu cầu
Phần đầu các trang danh sách (Tin tức, Cho thuê, Dự án, Dịch vụ, Tuyển dụng, Tin đăng…) đang chỉ có chữ trên nền kem
(`PageBanner` biến thể Chữ) → nhìn trống, chưa giống trang con vinhomes.vn (banner ảnh đầu trang).
User chốt (2026-10-19): **admin upload ảnh banner cho từng trang danh sách** trong Cài đặt website; trang nào chưa có
ảnh thì dùng **một ảnh mặc định chung**; chưa có cả ảnh chung → giữ biến thể Chữ hiện tại.

**Cập nhật 2026-10-19 (BL-020):** banner **thấp ~240px** (không phải 300px như vinhomes.vn), ngay dưới là **băng tìm
kiếm gọn kiểu market.vinhomes.vn** thay form lọc dài — xử lý cùng/trong `2026-10-19-public-ui-market-vinhomes.md`.

## Bối cảnh
- `src/components/templates/PageBanner.tsx` đã có biến thể Ảnh (ảnh + scrim + chữ trắng căn giữa, design-spec §2.7).
- `src/components/templates/CategoryListTemplate.tsx:95` nhận `bannerImage` nhưng các trang danh sách chưa truyền vào
  (`NewsListPage`, `PostListPage`, `ProjectListPage`, `JobListPage`; kiểm tra thêm Cho thuê / Dịch vụ).

## Acceptance (bắt buộc)
- [ ] Global Cài đặt website có ô ảnh banner mặc định + ô ảnh banner riêng cho từng trang danh sách công khai (nhãn tiếng Việt).
- [ ] Trang danh sách hiện biến thể Ảnh khi có ảnh riêng, fallback ảnh mặc định, không có cả hai → biến thể Chữ như hiện tại.
- [ ] Trang danh mục con (vd Tin tức › danh mục) dùng cùng ảnh của trang danh sách cha (trừ khi spec chốt khác).
- [ ] Chữ trên ảnh đạt tương phản AA (scrim), không CLS, ảnh banner là LCP được `priority`; VI và EN cùng ảnh.
- [ ] Không đổi quyền/schema ngoài các field mới; migration versioned nếu cần.

## Ghi chú
Tham chiếu `docs/DESIGN.md` (vinhomes.vn: chỉ lấy bố cục, ảnh là của TAMI), design-spec §2.7 Page banner.
