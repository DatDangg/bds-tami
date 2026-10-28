---
id: listing-hero-search-scroll-focus
type: bug
status: done
created: 2026-10-28
---

# Ô tìm ở hero trang danh sách: tìm xong nhảy về đầu trang + mất focus (BL-092)

Nguồn: follow-up BL-089 (cùng root cause với `/tuyen-dung`), ghi nhận 2026-10-28.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: các trang dùng `ListingHero` có ô tìm (`/du-an`, `/du-an/danh-muc/*`, `/cho-thue`, `/tin-bds`, `/tin-tuc` …; bản `/en` tương ứng) · Khách · 1920 + 390
- Bước tái hiện: cuộn xuống tới ô tìm ở hero (hoặc đang ở giữa trang) → gõ từ khoá → Enter / bấm nút tìm.
- Expected: kết quả cập nhật, trang không tự cuộn về đầu; focus giữ ở ô tìm khi Enter.
- Actual (dự đoán từ code, cần xác nhận repro): `src/components/listing/ListingHero.tsx:59` dùng `next/form` mặc định `scroll` = true → soft nav về scrollY 0; ô `q` có `key={search.value ?? ""}` (:65) → Enter remount input → focus rơi về body.

## Acceptance (bắt buộc)
- [ ] Repro trước sửa trên dev (ghi scrollY / activeElement trước-sau) — nếu ở hero đầu trang không thấy cuộn thì ghi rõ, vẫn sửa mất focus.
- [ ] Sau tìm (Enter / nút), không cuộn về đầu trang; Enter giữ focus ô tìm.
- [ ] URL giữ `q` + tham số giữ lại (preservedParams); back/chip đổi `q` vẫn cập nhật giá trị ô; không JS vẫn GET được.
- [ ] Mọi trang dùng `ListingHero` có ô tìm đều hưởng (không sửa từng trang); test khoá `scroll={false}` + giữ node/focus.
- [ ] Theo cách đã làm ở BL-089 (`JobFilters` + `JobKeywordInput`) — dùng lại nếu hợp lý, không nhân bản.
