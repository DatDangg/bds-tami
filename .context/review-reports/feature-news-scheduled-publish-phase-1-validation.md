Agent: spec-validator

# Phase review — feature-news-scheduled-publish · phase 1 (BL-091, FR-ADM-16 chỉ Tin tức)

- Mode: **Phase review** (post-build, sau T01 STRICT PASS r1 + Fix MINOR).
- Nguồn: `SPECIFICATIONS.md:311` (1.61.0) + `:127`; change doc `spec/changes/2026-10-27-news-scheduled-publish.md` (6 acceptance); task `tasks/feature-news-scheduled-publish/phase-1-task-01.md`; reviewer `.context/review-reports/feature-news-scheduled-publish-phase-1-task-01-round-1-review.md`; `spec/test-scope/current.json` v92; `git diff` code + docs.

## Verdict: ✅ COMPLETE (PASS) — 0 MISSING, 0 PARTIAL

## Verify chạy lại
| Lệnh | Kết quả |
|---|---|
| `pnpm exec vitest run` 7 unit/ui (publishedOnly, public-queries, scheduled-publish-sql, published-at, content-defaults, scheduled-publish, ScheduledPublishDisplay) | PASS 7 files / 64 tests |
| `pnpm exec vitest run tests/integration/{news,news-views,projects}.test.ts` | PASS 3 files / 87 tests (log `revalidateTag` ngoài Next runtime là nhiễu có sẵn) |

## Ma trận coverage
| # | Requirement | Nguồn spec | Implementation / evidence | Status |
|---|---|---|---|---|
| 1 | Chỉ Tin tức: ô "Ngày xuất bản" sửa được, ngày + giờ, lưu đúng; trống → tự điền khi published lần đầu; xoá trống ở bài published → now; quá khứ được phép | change doc AC1; SPEC:311 | `src/fields/published-at.ts:20-26` (`stampScheduledPublish`), `:39-53` (bỏ `denyAll`/`readOnly`, `dayAndTime`); `content-defaults.ts` `publishedAtField({ scheduled: options.scheduledPublish })`; `News.ts:73` `scheduledPublish: true`; test `published-at.test.ts`, integration `news.test.ts` (sale gửi giá trị / cập nhật từng phần / xoá trống / publish lần đầu); Playwright lưu `2026-10-29T02:30Z` | ✅ |
| 2 | Giờ VN: ghi chú "Giờ Việt Nam (GMT+7)" + cảnh báo máy không GMT+7; nhãn/cảnh báo theo Asia/Ho_Chi_Minh | SPEC:311 | `scheduled-publish.ts:12-21` (Intl `Asia/Ho_Chi_Minh`), `:62-65`; `ScheduledPublishDisplay.tsx:12-26` (offset TẠI giá trị chọn, `useSyncExternalStore`); ảnh `bl091-admin-form-tz-warning-1440.png` | ✅ |
| 3 | Khách không thấy tin `published` có `publishedAt > now`: list + danh mục, chi tiết 404, `q`, tag, Chủ đề, Đọc nhiều, tin liên quan, trang chủ, sitemap, JSON-LD, llms, chuyển ngôn ngữ, đếm lượt xem, API khách | change doc AC2; SPEC:311 | `publishedOnly.ts:23-30` (`scheduled` → `or[exists:false, ≤ now]`); `public-queries.ts:25` bật chỉ `news`; `content-defaults.ts:235` access.read khách; SQL thô `news-search.ts:23` (`publicNewsSql` dùng cho `findFilteredNewsIds` + `listTopNewsTags`), `most-read.ts:45-46`. Grep đường đọc news: `news-queries.ts:66,77,84`, `news-views.ts:110`, `resolve-counterpart.ts:35,42`, `sitemap-data`, `llms-route`, home — đều qua `findPublic*`/`publicWhere`; không còn SQL thô news khác. Integration guest find/findByID 404 | ✅ |
| 4 | `publishedAt` trống vẫn hiện như cũ | task AC; SPEC:311 | điều kiện `exists:false` / `IS NULL` ở cả 3 nơi; unit + integration | ✅ |
| 5 | Tới giờ tự hiện, không cron; trễ ≤ ~60s | change doc AC3; SPEC:311 | lọc lúc truy vấn (`now` mỗi request); `MOST_READ_CACHE_SECONDS = 60` (`most-read.ts:18`); ISR layout `revalidate = 60`; integration "tới giờ tự hiện"; Playwright +80s (dev) | ✅ (residual: chưa đo trên build production — đã ghi) |
| 6 | Staff active vẫn xem/sửa tin hẹn giờ; danh sách admin nhãn "Đã hẹn giờ · dd/MM/yyyy HH:mm" | change doc AC4; SPEC:311 | `makePublishedOnly` → `user.active === true`; `ScheduledPublishCell` (`ScheduledPublishDisplay.tsx:44-49`) + `scheduledPublishLabel`; integration admin + sale đọc được; ảnh `bl091-admin-list-1920.png` | ✅ |
| 7 | Đổi ngày tin đang lên web sang tương lai → cảnh báo, không chặn lưu | change doc AC5; SPEC:311 | `buildScheduleNotices` `scheduled-publish.ts:69-70` (đã lưu published + trống/≤ now); ảnh `bl091-admin-form-warning-1920.png` | ✅ |
| 8 | Dự án / Cho thuê / Tin BĐS (+ Tuyển dụng) không đổi | change doc AC6; SPEC:311 | `buildPublicWhere` không option = where cũ; `publishedAtField()` mặc định giữ readOnly + `denyAll` + `stampFirstPublish` (`published-at.ts:55-63`); không đụng `Projects/PropertyPosts/Rentals.ts` cho BL-091; unit deep-equal + integration `projects.test.ts` (publishedAt tương lai vẫn hiện, sửa tay bị bỏ qua) | ✅ |
| 9 | Không job/cron, không email, không schema/migration | change doc "Quyết định user"; SPEC:311 | không có file job/migration trong diff; `payload-types.ts` chỉ đổi 1 dòng comment description | ✅ |
| 10 | Reviewer MINOR-1..3 đã sửa thật | reviewer r1 | MINOR-1: `scheduled-publish.ts:69` không còn yêu cầu saved `!== null` (dùng `!isScheduledPublish`). MINOR-2: description `published-at.ts:49` không còn "GMT+7" (giữ ở notice). MINOR-3: `ScheduledPublishDisplay.tsx:30-32` ghi chú tĩnh là `<p>`, chỉ phần động trong `role="status"` | ✅ |
| 11 | Doc reconcile | task "Doc impact" | `docs/ERD.md` (điều kiện công khai riêng news + dòng `publishedAt`), `docs/PERMISSION.md` (row `news` read khách), `docs/API_SPEC.md` (loader Đọc nhiều), `docs/diagrams/layer-plan.md` + `tasks/tami-website/layer-16-task-01.md` đánh dấu SUPERSEDED; `SPECIFICATIONS.md:127` cập nhật Could | ✅ |
| 12 | test-scope v92 `changed.files` khớp diff thật | test-scope | 23 file liệt kê = đúng tập file code/test BL-091 trong `git status`/`git diff` (không có file thừa/thiếu). `importMap.js` có thêm 2 dòng WardField của BL-077 trong working tree — ngoài BL-091, cần stage riêng 4 dòng ScheduledPublish | ✅ (lưu ý staging) |

## Gaps
- [MISSING]: không có.
- [PARTIAL]: không có.

## Ghi chú close-out (không phải gap)
- `spec/test-scope/current.json:11` trỏ `spec/changes/archive/2026-10-27-news-scheduled-publish.md` nhưng file archive chưa tồn tại (change doc vẫn ở `spec/changes/`, `status: in_progress`) → change-request phải archive + cập nhật BACKLOG BL-091 ở close-out để link hợp lệ.
- `importMap.js` / `payload-types.ts`: chỉ stage hunk BL-091 (4 dòng ScheduledPublish; 1 dòng comment `News.publishedAt`), không kéo dòng WardField (BL-077).

## Residual risk
- Trễ ≤ 60s trên production chưa đo trên build production (dev không ISR).
- Nhãn "Đã hẹn giờ" phụ thuộc `status` có trong `rowData` danh sách; thiếu → fallback ngày thường (an toàn).
- Staff đăng nhập không preview tin hẹn giờ trên website công khai (public query không theo user) — đúng spec ("xem/sửa trong admin").
