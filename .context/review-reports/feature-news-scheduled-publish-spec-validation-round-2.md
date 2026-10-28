Agent: spec-validator

# Spec validation BL-091 `feature-news-scheduled-publish`, pre-plan, round 2

Nguồn đã đọc: `git diff SPECIFICATIONS.md` (dòng "Hẹn giờ xuất bản", `spec_version: 1.61.0` ở :9), `git diff tasks/tami-website/layer-16-task-01.md docs/diagrams/layer-plan.md`, `.context/progress.json` (không có mục `layer-16-task-01`). Lỗi trong round 1: `feature-news-scheduled-publish-spec-validation.md`.

## Verdict: PASS (0 lỗi chặn, không có conflict mức HIGH, 0 cảnh báo mở)

| Round 1 | Đã xử lý | Status | Ghi chú |
|---|---|---|---|
| W1: khối "Đọc nhiều" 10 phút nới so với acceptance ~60s | Spec ghi: "cache riêng của khối Đọc nhiều hạ từ 10 phút xuống **60s** để cùng mức trễ (bài không bao giờ lộ sớm)" | ✅ | Khớp quyết định user. Builder sửa `src/lib/news/most-read.ts:18` (`MOST_READ_CACHE_SECONDS` = 60). Comment `:17` ("spec: ≤ 1 giờ") và `docs/API_SPEC.md:253` ("10 phút") cập nhật lúc close-out |
| W2: giờ VN mâu thuẫn với không migration | Chọn (a): không đổi schema; ô chọn theo múi giờ máy staff (giả định GMT+7); ghi chú "Giờ Việt Nam (GMT+7)"; cảnh báo khi máy không ở GMT+7; nhãn "Đã hẹn giờ" và cảnh báo đổi ngày hiển thị theo Asia/Ho_Chi_Minh | ✅ | Hết mâu thuẫn, test được. Phát hiện "máy không ở GMT+7": phải so offset **tại ngày giờ đang chọn** (`getTimezoneOffset() !== -420`), không chỉ so lúc mở trang |
| W3: task layer-16 còn chờ, mâu thuẫn | `layer-16-task-01.md` có khối SUPERSEDED ("không chạy khi loop tới layer 16"); `layer-plan.md` M4 ghi superseded | ✅ | `progress.json` không theo dõi task này, nên không còn đường loop chạy nhầm. Dòng :51 và :580 trong bảng của `layer-plan.md` vẫn mô tả cron (chỉ M4 có ghi chú). Mức LOW, nên thêm ghi chú lúc close-out |

Coverage 6 acceptance: giữ nguyên như round 1 (A1–A6 đều ✅).

## Việc builder / close-out phải làm (không chặn)
- Tách điều kiện công khai riêng cho `news`. `buildPublicWhere` / `publishedOnly` (`src/access/publishedOnly.ts:13,27`) đang dùng chung cho projects / property-posts / job-postings → cần test khoá A6.
- Đồng bộ điều kiện `published_at IS NULL OR published_at <= now()` vào các truy vấn SQL thô:
  - `src/lib/news/news-search.ts:20-24`: tìm `q`/tag và khối Chủ đề. Nếu không sửa, `listTopNewsTags` lộ thẻ của tin hẹn giờ;
  - `src/lib/news/most-read.ts:38-48`: xếp hạng "Đọc nhiều".
- Hook `src/fields/published-at.ts:10-11`: xoá trống ô ngày ở bài published → điền lại thời điểm lưu (hiện đang giữ `previousValue`).
- Reconcile lúc close-out:
  - `docs/ERD.md:29`: điều kiện chỉ áp cho news;
  - `docs/ERD.md:371`;
  - `docs/PERMISSION.md:42`;
  - `docs/API_SPEC.md:253`: TTL 60s + điều kiện giờ;
  - comment `publishedOnly.ts:10-11`, `public-queries.ts:20`;
  - bảng `layer-plan.md:51,580`.

## Residual risk
- Trang chi tiết dùng ISR trên Next 16.4.2: chưa chạy runtime để xác nhận 404 của bài chưa tới giờ không bị giữ quá 60s. Cần test E2E "tới giờ → bài hiện".
- Working tree có thay đổi không thuộc BL-091 (`src/collections/Projects.ts`, `PropertyPosts.ts`, `Rentals.ts`, `src/fields/ward-in-province.ts`, …). Không tính vào validate này; primary cần tách manifest khi build/commit.
