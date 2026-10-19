Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer. Round 3 hẹp vượt giới hạn 2 vòng theo tiền lệ 2cfe320 (fix 1 điểm).

# Review: feature-public-ui-market-vinhomes · phase-3-task-03 · round 3

## Review level
**STRICT** (giới hạn ở logic bị đụng).

## Reason
Thay đổi quyết định bài nào hiện ở trang 1 `/tin-tuc` và quan hệ với phân trang — sai có thể giấu bài khỏi site công khai.

## Blast radius
Chỉ `src/lib/news/news-home.ts` (`buildMoreNews`, dòng 67-78) + call site `src/components/news/NewsListPage.tsx:85` + test mới. `loadNewsListing` (offset, `excludeIds`), `withPage`, canonical, metadata, `notFound`, trang danh mục không đổi.

## Verify
- `pnpm test src/components/news src/lib/news`: 3 files / 34 tests PASS.
- Primary: `pnpm typecheck` PASS, full `pnpm test` 284 files / 3005 PASS; builder: lint 0 error, build PASS.

## Đóng finding round 2
- **MAJOR-1 — đóng.** "Tin khác" = 4 bài mới nhất (n1–n4) trừ bài đã ở "Tin nổi bật"/hàng danh mục, rồi lưới trang 1 (n5–n16) trừ bài ở "Tin nổi bật". Mọi trường hợp đều truy cập được: bài cũ gắn nổi bật đẩy n1–n4 ra → n1–n4 đứng đầu "Tin khác"; bài mới không danh mục / danh mục ngoài 6 hàng → luôn vào "Tin khác"; bài mới đã ở hàng danh mục → vẫn hiện trang 1; n5–n16 chỉ bị bỏ khi đã ở "Tin nổi bật"; trang 2+ không đổi; `/en` cùng đường code, cùng locale. Thứ tự theo ngày giữ, Map giữ lần đầu.
- **MINOR-1 — đóng.** Bài ở "Tin nổi bật" bị loại khỏi "Tin khác"; trùng giữa hàng danh mục và "Tin khác" theo quy tắc "hàng không loại trùng" đã ghi — không phải lỗi.

## Tests
`NewsListPage.test.tsx:185-206`: 5 bài cũ nổi bật + n1–n4 không danh mục → không trùng "Tin nổi bật"/"Tin khác", n1–n4 đứng đầu "Tin khác", n1–n20 đều ở trang 1 hoặc 2; fixture khôi phục trong `finally`. Test :170-183 kiểm thứ tự.

## Findings
- **[MINOR-1]** Comment cũ `src/lib/news/news-listing.ts:16` (nói web không đọc `featured`) và `:28` ("Tin khác" chỉ là `items`) → cập nhật nêu `buildMoreNews`. **Primary đã sửa trước commit.**

## Responsive gate
N/A round này (không đổi layout/class); PASS round 2 giữ nguyên.

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK; ai-friendly-web/blitzstrike N/A.

## Residual risk
Chưa kiểm trình duyệt thật / DB thật; xác nhận qua mock + suy luận logic.

## Verdict
**PASS**
