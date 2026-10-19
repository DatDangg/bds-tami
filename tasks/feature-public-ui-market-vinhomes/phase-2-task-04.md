# feature-public-ui-market-vinhomes · phase-2-task-04 — Khối Tin cho thuê + Tin tức trên trang chủ

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE UI · NORMAL (đọc dữ liệu công khai sẵn có, cache tag hiện có).

## Việc
- `HomeRentals`: tab theo danh mục cho thuê (CMS hoặc fallback), slider `RentalCard` (tái dùng), "Xem thêm" → `/cho-thue/danh-muc/<slug>`. Tablist a11y; dữ liệu các tab render ở server (≤ 4 tab × 8 tin).
- `HomeNews`: khối tối, intro trái + 3 `NewsCard` phải, "Xem tất cả".
- `HomeBlocks` render theo `blockOrder`; trang chủ revalidate khi rentals/news đổi (kiểm hook hiện có, thêm nếu thiếu).

## Acceptance
- [ ] Hai khối bật/tắt + sắp xếp được; không có dữ liệu thì ẩn khối; ở `/en` theo luật ẩn tin chưa có bản EN hiện có


## Carry-over từ P2-T01 (reviewer r1 — quyết định cho checkpoint)
- Khối không có trong `blockOrder` thì không hiện (as-built ERD L9-T01); `defaultValue` 8 khối chỉ áp cho bản ghi mới → homepage đang có trên staging/prod (6 dòng) **không hiện `rentals`/`news`** cho tới khi admin thêm ở "Thứ tự khối".
- Hướng làm (an toàn, không data migration): (a) cập nhật `seed/sample/homepage.ts` có đủ 8 khối + dữ liệu mẫu cho khối mới; (b) thêm cảnh báo trong admin (description của `blockOrder`/tab Cho thuê, Tin tức: "khối chỉ hiện khi có trong Thứ tự khối") ; (c) ghi bước triển khai "Admin → Trang chủ → Thứ tự khối: thêm Cho thuê, Tin tức" vào Decision log để session chính đưa vào spec/updates. **Không** tự động thêm khối thiếu lúc render (đổi luật as-built, cần user duyệt).
