---
id: news-list-detail-v2
type: feature
status: in_progress
created: 2026-10-22
---

# Tin tức — đổi "Đọc nhiều", đưa Đăng ký bản tin lên trên; chi tiết tin tức theo UI mới

## Yêu cầu

### 1. Danh sách `/tin-tuc` (vi + en)
- Tiêu đề khối "Đọc nhiều" (user: "trông thô quá") → **"Được quan tâm nhiều"** / EN **"Most popular"** (user chọn 2026-10-22).
- Khối **Đăng ký bản tin** chuyển lên **trên** khối "Được quan tâm nhiều" ở cột phải (< lg giữ đúng thứ tự tương ứng).

### 2. Chi tiết tin tức `/tin-tuc/[slug]` — ảnh chuẩn `docs/specs/listing-detail-redesign/chi-tiet-tin-tuc-v2.webp`
Ảnh v2 **thay** `chi-tiet-tin-tuc.webp` (BL-054) cho màn này. Bảng so khối — đo bản hiện tại 1440, bài `/tin-tuc/tu-van-mua-ban-udic-riverside-2-vinh-tuy-moi-nhat`, 2026-10-22:

| # | Khối | Hiện tại (as-built BL-054) | Đích (ảnh v2 + user chốt) |
|---|---|---|---|
| D1 | Đầu bài | Nền sáng, chữ đen: badge → h1 48px → sapo → tác giả + chia sẻ; ảnh bìa nằm DƯỚI, trong cột nội dung (2:1) | **Hero ảnh bìa full width** (cao ~ 420–460px ở 1440) + lớp phủ ấm (scrim BL-049) đậm phía trái. Trong hero, căn theo container: breadcrumb (trên cùng) → chip chuyên mục vàng → **h1 chữ trắng** (cột trái ~ 45–50% rộng, tối đa 4 dòng) → sapo trắng mờ → hàng đáy: trái = avatar logo tròn + "**Bài viết bởi TAMI REAL ESTATE**" (user chọn) + "Ngày đăng: dd/mm/yyyy • N phút đọc"; phải = "Chia sẻ:" + 4 nút tròn viền trắng (sao chép link, Facebook, Zalo, chia sẻ khác) |
| D2 | Ảnh bìa trong thân | Có (cover + chú thích) | **Bỏ** — ảnh bìa CHỈ ở hero (user chọn). Thân bài chỉ còn ảnh do biên tập chèn trong nội dung (giữ style bo góc + chú thích nghiêng canh giữa) |
| D3 | Đoạn mở đầu | Đoạn `p` đầu đóng khung nền kem `rgb(248,243,235)` | **Bỏ khung** (user chọn): chữ thường, cỡ lớn hơn thân bài một bậc (lead), màu text-secondary |
| D4 | Cột trái | Chỉ "Mục lục" dính; mục không đánh số, mục đang đọc in đậm; thẻ tư vấn không đi theo | **Mục lục + thẻ "Tư vấn miễn phí" cùng dính** (user chọn) tới hết bài, dừng trước "Bài viết liên quan" (cùng cơ chế với BL-061). Mục lục: thẻ trắng viền mảnh, mỗi mục có **số tròn 01/02/…** viền vàng, mục đang đọc có **vạch vàng dọc bên trái** + số tô vàng; mục lục dài hơn màn → tự cuộn bên trong. Thẻ tư vấn: eyebrow vàng "TƯ VẤN MIỄN PHÍ", tiêu đề đậm, mô tả, nút pill vàng "Nhận tư vấn →" |
| D5 | Tiêu đề mục `h2` | Có số tròn 01/02 (CSS counter) — 26px | Giữ số tròn; nội dung (đoạn, `ul`) của mục **thụt thẳng hàng với chữ tiêu đề** (không chạy dưới số); h2 nhỏ hơn hiện tại một chút cho cân với ảnh (≈ 22–24px) |
| D6 | `ul` | Đã có ✓ tròn vàng (`news-prose`) | Giữ — mọi `ul` tự động ✓ (user chọn); `ol` giữ số |
| D7 | Khung liên hệ cuối bài | Chưa có | **Mới, tự hiện ở mọi bài** (user chọn): khung nền kem bo góc, icon vàng trái, chữ "Để nhận thông tin chi tiết … vui lòng liên hệ **TAMI REAL ESTATE** qua hotline hoặc để lại thông tin bên dưới." — chữ "TAMI REAL ESTATE" vàng, bấm cuộn tới / mở form tư vấn. Nội dung chữ sửa được trong admin (vi + en, rỗng → dùng mặc định i18n) |
| D8 | Thẻ (tag) | "Thẻ:" + chip `#tag` có dấu `#`; ẩn ở `/en` | Chip pill viền mảnh **không có `#`**; giữ link lọc `?tag=`; vẫn ẩn ở `/en` (tag chưa localized — BL-059) |
| D9 | Bài viết liên quan | Section "Bài viết liên quan" | Nền trắng full width; trái eyebrow vàng in hoa "BÀI VIẾT LIÊN QUAN", phải link "Xem tất cả tin tức →"; **3 thẻ ngang**: ảnh tỉ lệ rộng (~ 16:7), chip chuyên mục + ngày, tiêu đề 2 dòng, mô tả 2 dòng, nút tròn vàng mũi tên góc phải dưới; cả thẻ bấm được |
| D10 | Banner tư vấn + footer | "Cần tư vấn bất động sản?" có sẵn | Giữ banner tư vấn hiện có (ảnh nền + nút "Nhận tư vấn") |

Đổi tác giả "Ban biên tập TAMI HOMES" → "Bài viết bởi TAMI REAL ESTATE" / EN "By TAMI REAL ESTATE" áp **mọi nơi hiện nhãn tác giả bài tin** (chi tiết + thẻ nổi bật danh sách nếu có), không đọc tên nhân viên (giữ spec-validation F3).

### 3. Mobile / tablet (ảnh chỉ có desktop — agent tự dựng, giữ tinh thần ảnh)
- Hero: chữ chiếm full rộng, cụm chia sẻ xuống dưới hàng tác giả; scrim đủ đậm cho chữ trắng.
- < lg: không cột trái; Mục lục dạng thu gọn như hiện tại, thẻ tư vấn chuyển xuống sau khung liên hệ cuối bài (hoặc dùng CTA dính đáy hiện có).
- Bài viết liên quan: 1 cột (390) / 2 cột (768).

## Acceptance (bắt buộc)
- [ ] `/tin-tuc` + `/en/news`: tiêu đề "Được quan tâm nhiều" / "Most popular"; khối Đăng ký bản tin nằm trên khối này.
- [ ] Chi tiết 1440 khớp D1–D10 khi đặt cạnh ảnh v2 (chụp 1440 so khớp, ghi ảnh vào review report).
- [ ] Chữ trắng trên hero đạt AA trên ảnh sáng nhất trong seed (kiểm ≥ 3 bài).
- [ ] Bài không có ảnh bìa → hero nền tối thương hiệu, không vỡ; bài không có `h2` → ẩn Mục lục (thẻ tư vấn vẫn dính); không tag → ẩn hàng Thẻ; < 3 bài liên quan → hiện số có, 0 → ẩn khối.
- [ ] Cột trái dính từ đầu thân bài tới trước "Bài viết liên quan", không đè khối đó; mục lục dài tự cuộn trong; mục đang đọc cập nhật khi cuộn.
- [ ] Khung liên hệ: chữ lấy từ admin (vi/en), rỗng → mặc định; bấm "TAMI REAL ESTATE" tới form tư vấn.
- [ ] `ol` không thành ✓; ảnh chèn trong bài vẫn hiện + chú thích.
- [ ] 1440 / 1024 / 768 / 390, vi + en; không tràn ngang; focus bàn phím rõ.

## Ghi chú
- File liên quan: `src/components/news/NewsArticle.tsx` (Header/Cover/Body/Tags), `NewsArticleSidebar.tsx`, `NewsToc.tsx`, `ShareButtons.tsx`, `NewsListPage.tsx`, `NewsMostRead.tsx`,
  `NewsletterSignup.tsx`, `posts/RelatedPosts.tsx`, trang `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, `globals.css` (`news-prose`), `src/i18n/messages/*`; hero tham khảo `listing/ListingHero.tsx` + scrim BL-049.
- Global chứa chữ khung liên hệ cần thêm trường → migration additive (SAFE_ADDITIVE).
- Liên quan BL-059 (cột trái dính chi tiết tin ở lg thấp) — xử lý chung trong D4.
- Các quyết định user 2026-10-22: ✓ tự động mọi `ul`; khung liên hệ tự động mọi bài; ảnh bìa chỉ ở hero; bỏ khung đoạn mở đầu; mục lục + tư vấn cùng dính; tác giả "Bài viết bởi TAMI REAL ESTATE".

## Quyết định change-request (2026-10-23, user "tự quyết, đừng hỏi" — AUTO PROCEED)
- **Classification:** MODIFY (đổi bố cục S10 / S11 BL-054) + 1 trường schema additive. Risk MEDIUM (shared `news-prose`, khung dính BL-061, 1 migration SAFE_ADDITIVE).
- **Chia task:** T01 danh sách (đổi tên + thứ tự cột phải + nhãn thẻ nổi bật) · T02 chi tiết (D1–D10 + trường admin + migration). Chạy tuần tự (cùng `src/i18n/messages/*`).
- **Q1 Nhãn thẻ nổi bật danh sách:** "TAMI HOMES" → "TAMI REAL ESTATE" (chỉ tên thương hiệu, không "Bài viết bởi" — thẻ hẹp).
- **Q2 Đích "TAMI REAL ESTATE" trong khung liên hệ:** trang chi tiết tin KHÔNG có form (F5) → link tới trang Liên hệ (form tư vấn) — cùng đích nút "Nhận tư vấn" thẻ trái; trang Liên hệ có neo form thì thêm neo.
- **Q3 Trường admin:** `site-settings` (global sẵn có) thêm nhóm "Trang chi tiết tin tức" → `contactNote` (textarea, localized). Mọi lần xuất hiện chuỗi "TAMI REAL ESTATE" trong chữ thành link; mô tả admin nói rõ. Rỗng → câu mặc định i18n (vi/en). Migration ADD cột nullable.
- **Q4 Cột trái:** dùng lại `DetailAsideFit as="div"` + `DETAIL_ASIDE_STICKY_CLASS` + `--detail-aside-top: calc(var(--sticky-top) + 1.5rem)` (BL-061); mục lục giới hạn cao để cả cột (mục lục + thẻ tư vấn) vừa màn, phần thừa cuộn trong mục lục.
- **Q5 Spec Publisher:** chạy 1 lần ở close-out (như BL-061) để test-scope chứa file thật đã đổi; spec delta ghi vào `SPECIFICATIONS.md` trước khi build.
