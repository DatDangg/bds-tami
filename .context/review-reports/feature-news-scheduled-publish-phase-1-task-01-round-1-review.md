Agent: reviewer

# Review — feature-news-scheduled-publish · phase-1-task-01 · round 1 (BL-091)

- **Review level:** STRICT
- **Reason:** đổi access đọc của khách (`makePublishedOnly`) + `buildPublicWhere`/`publicWhere` dùng chung cho mọi route công khai, sitemap, llms; SQL thô; field `publishedAt` dùng chung mọi collection nội dung (`content-defaults`).
- **Blast radius:** `src/access/publishedOnly.ts` (mọi collection nội dung), `src/lib/content/public-queries.ts` (mọi trang công khai, sitemap, llms, resolve-missing-page, endpoint `news-views`, `leads`), `src/lib/news/{news-search,most-read}.ts` (/tin-tuc `q`/tag, khối Chủ đề, Đọc nhiều), `src/fields/published-at.ts` + `content-defaults.ts` (form + list admin news; regression Dự án/Cho thuê/Tin BĐS/Tuyển dụng), admin importMap/SCSS.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (0 lỗi) |
| `pnpm exec eslint <20 file thuộc change>` | PASS (0 lỗi/cảnh báo) |
| `pnpm exec vitest run` 7 unit/ui test (publishedOnly, public-queries, scheduled-publish-sql, published-at, content-defaults, scheduled-publish, ScheduledPublishDisplay) | PASS 7 files / 63 tests |
| `pnpm exec vitest run tests/integration/{news,news-views,projects}.test.ts` (Docker tami-postgres/redis đang chạy) | PASS 3 files / 87 tests (log `revalidateTag ... static generation store missing` là nhiễu có sẵn ngoài Next runtime) |
| `pnpm lint` toàn repo | không chạy — đã biết FAIL do `playwright-report/`, thay bằng eslint file đổi |
| Playwright | không chạy lại (không cần cho kết luận; evidence builder ghi trong task) |

## Kiểm trọng tâm
1. **Không lộ tin hẹn giờ với khách — OK.** Grep mọi đường đọc `news` ngoài test: `findPublicList/BySlug/One` (list, danh mục, chi tiết, related, home `loadNews` cả chọn tay lẫn fallback — `home-queries.ts:113-121`), `sitemap-data.ts:97` (`publicWhere`), `llms-route.ts:26` (`findPublicList`), `resolve-missing-page.ts:109-110`, `news-views.ts:110` (`findPublicList`), `leads.ts:123` (`publicWhere`). SQL thô chỉ 2 chỗ (`news-search.ts:52,71`, `most-read.ts:44`) — đều đã thêm điều kiện. `findLocalizedSlugs` (`news-queries.ts:98`, overrideAccess) chỉ nhận id của bài đã qua public query. REST/GraphQL khách → `access.read` (`content-defaults.ts:235`) có điều kiện. Quan hệ `homepage.news.posts` populate như khách: news có trash nên Payload giữ id khi bị chặn (`relationshipPopulationPromise`), sau đó vẫn lọc qua `findSelected`; global cache 60s. Không có plugin search/collection index khác chứa news.
2. **Collection khác y hệt cũ — OK.** `buildPublicWhere` không option → `{and:[status in, deletedAt exists false]}` như trước; `publicWhere` chỉ bật cho `news`; `publishedAtField()` mặc định giữ nhánh cũ (readOnly + denyAll + `stampFirstPublish`). Khoá bằng unit deep-equal + integration `projects.test.ts` (dự án publishedAt tương lai vẫn hiện, sửa tay bị bỏ qua).
3. **Access/hook — OK.** Bản scheduled bỏ field-level `denyAll` → quyền sửa = collection `update: isAuthorOrAdmin` (sale chỉ bài mình); field access không mở rộng quyền. Hook `stampScheduledPublish` (`published-at.ts:20-26`): gửi giá trị → giữ; `undefined` (cập nhật từng phần/bulk) → giữ `previousValue`; `null`/"" + published → now; trống + chưa published → null. Đã xác minh UI Payload 3.91 xoá ngày gửi `null` (`DateTime/index.js` `setValue(...|| null)`, DatePicker clear `onChange(null)`) → nhánh "xoá trống → now" thật sự chạy từ form. News `versions.drafts: false` (mặc định content-defaults) → không có autosave/draft lệch `previousValue`.
4. **Timezone — OK.** Format `Intl` `timeZone: "Asia/Ho_Chi_Minh"` ghép parts (`scheduled-publish.ts:12-21`); so sánh bằng epoch; offset máy đo TẠI giá trị đang chọn (`ScheduledPublishDisplay.tsx:12-15`), SSR/hydrate dùng -420 qua `useSyncExternalStore` (tránh mismatch).
5. **SQL — OK.** `${now.toISOString()}::timestamptz` là tham số drizzle `sql` (không nối chuỗi); `published_at IS NULL OR <= now`.
6. **Cache Đọc nhiều — OK.** `MOST_READ_CACHE_SECONDS = 60` (`most-read.ts:18`), comment cập nhật.
7. **Cell thiếu `status` — OK (degrade an toàn).** `rowData.status` undefined → `scheduledPublishLabel` null → `DefaultCell` như cũ; đã ghi Residual.
8. **Test — OK.** Unit cho where (news có / khác không), hook 2 nhánh, format/notice, SQL builder; integration Postgres cho guest find/findByID 404, staff admin+sale đọc được, tới giờ tự hiện, sale sửa ô (gửi giá trị, cập nhật từng phần, xoá trống, publish lần đầu), `findFilteredNewsIds`/`listTopNewsTags` với `now` truyền vào, news-views. Test dùng DB thật, không mock contract.

## Responsive Checklist Gate
Diff chỉ đụng **UI admin** (component afterInput/Cell + 1 rule SCSS `.tami-schedule-cell`), không đụng route/component/CSS công khai.
- Layout (horizontal scroll / grid / container px): N/A — rule mới chỉ `font-weight`/`color`, không kích thước/layout.
- Typography/Spacing: N/A — không đặt font-size/spacing mới (dùng lớp có sẵn `tami-field-hint`).
- Media: N/A — không có ảnh/video.
- Touch/Interaction: N/A — không thêm control tương tác (chỉ text).
- Viewport/A11y: OK — không `100vh`, không animation, không `overflow:hidden`; ghi chú bọc `role="status"`.
Residual: không đo lại admin ở 375/768 (builder đo 1920); nội dung là đoạn text tự xuống dòng, rủi ro thấp.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); eslint file đổi PASS thay thế.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`stampScheduledPublish`, `buildScheduleNotices`, `browserOffsetAt`), hàm < 50 dòng, file < 300 dòng, hằng số đặt tên (`VIETNAM_TIMEZONE_OFFSET_MINUTES`, `MOST_READ_CACHE_SECONDS`), comment nói WHY; 0 indicator. Doc reconcile (ERD/PERMISSION/API_SPEC) do change-request ở close-out theo task file.
- ai-friendly-web: N/A — không đổi robots/sitemap/llms structure (chỉ dữ liệu được lọc).
- blitzstrike: skip, chưa cài / không môi trường pentest được phép.

## Findings
- **[CRITICAL]** không có.
- **[MAJOR]** không có.
- **[MINOR-1]** `src/lib/admin/scheduled-publish.ts:68` — `liveNow` yêu cầu `toDate(savedPublishedAt) !== null`; tin `published` có `publishedAt` NULL (vẫn hiện với khách — điều kiện `exists:false`) khi đổi sang giờ tương lai sẽ nhận thông báo "Tin sẽ tự hiện trên web lúc …" thay vì cảnh báo "sẽ bị ẩn". Hiếm (hook tự điền khi xuất bản, chỉ dữ liệu cũ/sửa DB). Đề xuất: coi saved `published` + saved trống-hoặc-≤ now là "đang hiện" (bỏ điều kiện `!== null`), thêm 1 unit case.
- **[MINOR-2]** `src/fields/published-at.ts:49` + `scheduled-publish.ts:62` — "Giờ Việt Nam (GMT+7)" hiện 2 lần dưới ô (description + dòng info đầu của notice). Đề xuất bỏ một trong hai (vd notice chỉ hiện cảnh báo múi giờ/hẹn giờ).
- **[MINOR-3]** `src/components/admin/ScheduledPublishDisplay.tsx:29` — `role="status"` bọc cả dòng info tĩnh; mỗi lần đổi ngày trình đọc màn hình đọc lại toàn khối. Đề xuất chỉ đặt `role="status"`/`aria-live` cho phần cảnh báo động.

## Residual risk
- Trễ ≤ 60s trên production dựa vào ISR `revalidate = 60` + cache Đọc nhiều 60s, chưa đo trên build production (builder đã ghi).
- Nhãn "Đã hẹn giờ" phụ thuộc `status` có trong `rowData` danh sách admin (fallback an toàn về ngày thường).
- Link nội bộ trong rich text trỏ tới tin hẹn giờ: hành vi giống tin nháp/ẩn hiện tại (có sẵn, ngoài scope).

## Verdict
✅ **PASS** — không CRITICAL/MAJOR; 3 MINOR có thể sửa trước commit hoặc ghi follow-up.
