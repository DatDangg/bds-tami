# feature-admin-form-ux-polish · phase-1-task-04 — Lịch sử chỉnh sửa (Versions) dễ đọc

- Change doc: `spec/changes/2026-10-22-admin-form-ux-polish.md` (BACKLOG BL-058, mục 4)
- Spec: F-admin "lịch sử phiên bản" (`SPECIFICATIONS.md:168`), FR-ADM-19 — thêm câu theo spec delta mục 4
- Status: approved (Q2 = **Không** hiện "Ai sửa", không migration) — chưa chạy, chờ checkpoint sau đợt 1 · Wave 2 (SAU T02: chung `payload.config.ts` / `importMap.js` / `custom.scss`)

## Hiện trạng (change-request đã kiểm)
- Không có view tuỳ biến: màn Versions là **mặc định Payload 3.91** (`@payloadcms/next/dist/views/Versions`, `.../Version`).
- Collection có versions: Projects, Rentals, PropertyPosts, News, JobPostings, Services, Pages (`withContentDefaults`,
  `src/collections/_shared/content-defaults.ts:206` `versions: { maxPerDoc: MAX_VERSIONS_PER_DOC (=20, :25), drafts: false }`). Categories/Developers `versions: false`.
- Bảng danh sách mặc định (`@payloadcms/next/dist/views/Versions/buildColumns.js:24-72`): cột "Ngày cập nhật" (link), "Mã phiên bản" (UUID), cột `_status` **chỉ khi bật drafts** → ở đây chỉ còn ngày + UUID (khó đọc).
- `drafts: false` ⇒ không có version nháp / tự lưu của Payload; "trạng thái" có nghĩa ở đây là trường nghiệp vụ `status` của bài (Nháp / Xuất bản / Ẩn / Đã thuê…) lưu trong `version.status` của snapshot.
- **Không có dữ liệu "ai sửa"**: bảng `_v` của Payload chỉ có `parent, version, createdAt, updatedAt, latest, autosave…`; nội dung chỉ có `author` (người tạo/sở hữu), không có người sửa gần nhất; audit log (`src/lib/audit/actions.ts`) không ghi update nội dung.
- Màn so sánh (`views/Version/index.js:47`) **mặc định đã "Chỉ trường đã đổi"** (`modifiedOnly` true); nhãn trường tiếng Việt lấy từ `label`; chữ khung đã dịch ở `src/lib/admin/payload-vi-overrides.ts:140-150`.
- Điểm tuỳ biến hợp lệ trong 3.91: `admin.components.views.edit.versions` / `views.edit.version` (`payload/dist/config/types.d.ts:1421-1422`, `DefaultDocumentViewConfig`), `admin.components.Diff` theo field (`fields/config/types.d.ts:177`), CSS.

## Classification / Risk
- Type: **MODIFY** (UI admin). Không migration — **trừ khi Q2 = có "Ai sửa"**: thêm trường ẩn `updatedBy` (relationship `staff`, set ở `beforeChange` = `req.user`, `admin.hidden`, không localized) cho 7 collection → migration SAFE_ADDITIVE (bảng chính + `_v`), bản cũ hiện "—"; cập nhật `docs/ERD.md`; reviewer STRICT.
- Risk: **MEDIUM** (thay view list versions của 7 collection; quyền `readVersions` phải giữ) / **HIGH-ish** nếu có migration. Reviewer: **STRICT** (đụng view Payload + quyền đọc versions).

## Yêu cầu thực hiện (sau khi Q2 được trả lời)
1. **Builder chụp màn hiện tại TRƯỚC khi sửa** (list + so sánh, 1440 sáng/tối) để đối chiếu.
2. Danh sách phiên bản (view `edit.versions` tuỳ biến cho 7 collection, dùng chung 1 component; hoặc giữ view Payload + đổi cột nếu đủ):
   - Sắp xếp mới nhất trước; mỗi dòng: **thời điểm** `dd/MM/yyyy HH:mm` giờ VN + "x phút/giờ trước"; **trạng thái bài** (badge `StatusBadge`/`status-tones` sẵn có) của phiên bản đó;
     nhãn "Phiên bản hiện tại" cho bản `latest`; **số trường thay đổi** so với bản trước (nếu tính được rẻ — không thì bỏ, ghi decision log); [**Ai sửa** — chỉ khi Q2 = có].
   - Bỏ cột UUID khỏi vị trí nổi bật (giữ trong chi tiết nếu cần). Bấm dòng → màn so sánh. Phân trang/giới hạn 20 bản như cũ. Quyền: chỉ người đọc được versions (như Payload).
3. Màn so sánh: giữ "Chỉ trường đã đổi" mặc định; ẩn khỏi diff các trường hệ thống không có ý nghĩa với người dùng nếu làm được bằng cấu hình (vd nhóm `translation.*` kỹ thuật, hash/search) — không thì ghi gap; nhãn tiếng Việt; thanh chọn bản so sánh dễ hiểu.
4. 390px không tràn ngang. AA sáng/tối.

## Acceptance
- [ ] Màn lịch sử phiên bản rõ: theo thời gian, lúc nào (giờ VN), trạng thái bài, bản hiện tại [, ai sửa nếu Q2].
- [ ] So sánh chỉ nổi bật trường đã đổi, nhãn tiếng Việt.
- [ ] Quyền đọc versions không đổi (sale chỉ xem bài được xem như hiện tại); khôi phục phiên bản vẫn chạy.
- [ ] Ảnh 1440 trước/sau (list + so sánh) trong review report.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` PASS; (nếu Q2 = có) migration versioned + `payload migrate` sạch trên DB worktree + ERD.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `node_modules`. Không đổi `maxPerDoc`/`drafts`. Không thêm endpoint. Không migration nếu Q2 = không.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (+ `pnpm payload migrate` nếu có migration).
- Trình duyệt 1440 + 390: Dự án + Tin BĐS có ≥ 3 phiên bản; role admin + editor/sale.
- Ảnh: `.context/review-reports/feature-admin-form-ux-polish/screens/t04-{before,after}-1440-*.png`.
- Report: `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-04-round-<R>-review.md`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`. Phần nào 3.91 không cho làm mà không fork view → giữ mặc định + ghi gap.

## Decision log
- (change-request) `drafts: false` nên "nháp/xuất bản/tự lưu" của Payload không tồn tại — dùng trường `status` nghiệp vụ của snapshot. "Ai sửa" cần dữ liệu mới → hỏi user (Q2).
- (user 2026-10-22, checkpoint) Q2 = **Không** cột "Ai sửa" → **không migration, không thêm trường**. Danh sách hiện: thời điểm (giờ VN), trạng thái bài của phiên bản, nhãn bản hiện tại, số trường đã đổi so với bản trước. Bỏ mọi nhánh `updatedBy` ở trên.

## Decision log (builder)
- Attempt 1. Danh sách phiên bản = view tuỳ biến `admin.components.views.edit.versions` (server component `src/components/admin/VersionHistoryView.tsx`), gắn một chỗ trong `withContentDefaults` (`content-defaults.ts`, bỏ qua collection `versions: false`, không đè nếu collection tự khai `edit.versions`) → áp cho cả 7 collection. Màn so sánh (`edit.version`) KHÔNG fork: giữ view gốc của Payload (đã "Chỉ trường đã đổi" mặc định, nút "Khôi phục về phiên bản này" nguyên vẹn).
- Dữ liệu: `payload.findVersions` với `overrideAccess: false` + `user` (cùng đường quyền với view gốc; Payload vẫn chỉ render view khi `docPermissions.readVersions`). `limit: 100` (maxPerDoc = 20 nên không cần phân trang; bỏ cột sắp xếp/UUID — mã phiên bản chỉ còn trong `title` của link).
- Mỗi dòng: `dd/MM/yyyy HH:mm` giờ VN (Intl, Asia/Ho_Chi_Minh, không phụ thuộc múi giờ máy chủ) + "x phút/giờ trước" (tái dùng `relativeTimeVi` của dashboard); badge `StatusBadge` của `version.status` (nhãn lấy từ option field `status` của chính collection); "Phiên bản hiện tại" cho bản mới nhất (drafts tắt ⇒ bản mới nhất = bài hiện tại); "N trường đã đổi" so với bản liền trước, bản cũ nhất ghi "Bản cũ nhất".
- "Số trường đã đổi" = số khoá cấp ngoài cùng của bản chụp khác nhau (`isDeepStrictEqual`), nhóm/mảng/richText tính 1; bỏ qua `id, createdAt, updatedAt, deletedAt, translation, searchReindexPending, _status`. Tính rẻ (dữ liệu đã có sẵn, depth 0), không cần thêm query.
- Màn so sánh: ẩn nhiễu bằng CSS (`_version-history.scss`, selector `.render-field-diffs__field[data-field-path=...]` của 3.91): `updatedAt`, `createdAt`, `deletedAt`, `translation`, `searchReindexPending`. Danh sách phải khớp `VERSION_HIDDEN_FIELDS` (có comment hai đầu). Chọn CSS thay vì định nghĩa lại `updatedAt` kèm `admin.components.Diff` vì cách sau đổi schema trường timestamp của 7 collection (rủi ro migration/index), trái "không thêm trường".
- Nhãn pill ở màn so sánh: `version.previouslyPublished` "Đã xuất bản trước đây" → "Bản đã lưu", `version.currentlyPublished` → "Phiên bản hiện tại" (override ở một nơi `payload-vi-overrides.ts`, cập nhật test EXPECTED). Lý do: collection không dùng bản nháp Payload nên chữ "đã xuất bản" sai nghĩa với bài trạng thái Nháp/Ẩn.
- Không migration, không trường mới, không endpoint, không đổi `maxPerDoc`/`drafts`.
- Gap (giữ mặc định, không fork view): (1) thanh "So sánh với" vẫn là dropdown mặc định của Payload (nhãn "Phiên bản trước" + ngày) — 3.91 không có slot riêng; (2) ô chọn ngôn ngữ "vi, en" ở màn so sánh giữ nguyên; (3) pill `Khôi phục` / ngày ở màn so sánh theo định dạng `admin.dateFormat` của Payload (có thể lệch múi giờ so với cột giờ VN nếu trình duyệt không ở UTC+7); (4) màn so sánh không còn "Mã phiên bản" nổi bật nhưng trang gốc vẫn có ID trong URL.

## Verification summary (builder)
- `pnpm lint`: 0 error (2 warning cũ ở `tools/task-dashboard/server.mjs`, không thuộc task). `pnpm typecheck`: PASS. `pnpm build`: PASS (exit 0).
- `pnpm vitest run --project unit --project ui --maxWorkers=2` quét phạm vi chạm tới (`src/lib/admin`, `src/collections`, `src/components/admin`): 81 file / 653 test PASS (gồm test mới `version-history.test.ts`, 3 test mới `content-defaults.test.ts`, `payload-vi-overrides.test.ts` cập nhật EXPECTED). Chạy TOÀN BỘ unit+ui trên máy này quá chậm (tải máy cao, >30 phút chưa xong, đã dừng) — chưa có số liệu toàn suite, chờ verify tổng thể trên branch.
- Trình duyệt thật (DB riêng `tami_wt_bl058_t04`, Edge headless qua CDP): Tin BĐS (6 phiên bản) + Dự án (7 phiên bản), role admin và sale (user test tạo trong DB riêng: t04-sale@example.test): danh sách đúng thời điểm giờ VN, badge trạng thái (Đã xuất bản/Ẩn), "Phiên bản hiện tại" ở bản mới nhất, "N trường đã đổi", "Bản cũ nhất"; bấm vào dòng mở màn so sánh gốc, "Chỉ trường đã đổi" mặc định, `updatedAt` không còn hiện, pill "Bản đã lưu", nút "Khôi phục về phiên bản này" còn nguyên. 390px: thẻ xếp dọc, không tràn ngang.
- Ảnh: `.context/review-reports/feature-admin-form-ux-polish/screens/t04-before-1440-{light,dark}-{list,diff}.png`, `t04-after-1440-{light,dark}-{list,diff}.png`, `t04-after-390-light-list.png`.

## Residual (builder)
- Chưa chạy toàn bộ unit+ui (xem trên) và integration (theo chỉ đạo). Chưa có test render cho `VersionHistoryView` (server component phụ thuộc `req.payload`); logic thuần đã có test, phần render kiểm bằng trình duyệt.
- Ẩn trường nhiễu ở màn so sánh bằng CSS selector `data-field-path` của Payload 3.91 — nâng cấp Payload có thể đổi attribute (khi đó chỉ hiện lại các trường kỹ thuật, không hỏng chức năng).
- Quyền đọc versions: sale đọc được lịch sử của bài đã xuất bản (đúng như màn Payload gốc, không đổi `access`); `readVersions` không cấu hình riêng ở collection — hành vi hiện tại giữ nguyên.
- Dữ liệu test thêm vào DB riêng: vài phiên bản cho 1 Tin BĐS + 1 Dự án, 1 user `t04-sale`. Tiêu đề Dự án đã bị ghi hỏng encoding do curl trên Windows và đã khôi phục (qua node, UTF-8). `src/payload-types.ts` chỉ lệch EOL do `generate:importmap`/CLI (không tính, không commit).

## Decision log (builder, attempt 2)
- MAJOR-1: `findVersions` đổi sang `locale: "all"` (trường localized thành `{ vi, en }`; `status` không localized nên vẫn là chuỗi, badge đúng — kiểm trên trình duyệt). Thêm `dropEmpty` trong `version-history.ts`: bỏ khoá null/đối tượng rỗng ở mọi cấp, để `{vi}` và `{vi, en:null}` là cùng nội dung (nếu không, lần đầu có EN hay mọi trường localized đều bị tính đổi).
- MINOR-1: stretched link (`::after` phủ `li.version-history__row`, hover nền accent-soft). MINOR-2: tách `loadVersionRows`, `type VersionRowProps`. MINOR-3: `formatAdminURL`. MINOR-4: tra `status` bằng `collectionConfig.flattenedFields` (xuyên khối bố cục không tên); `status` của 7 collection đều do một helper dùng chung `statusField()` nên cùng cấp ngoài cùng trong dữ liệu — chưa mở trình duyệt cho Rentals/News/JobPostings/Services/Pages.

## Verification summary (attempt 2)
- Unit: `version-history.test.ts` thêm 2 case (snapshot `{vi,en}` chỉ en đổi → 1; `{vi}` ≈ `{vi,en:null}` → 0).
- Trình duyệt (DB riêng, Tin BĐS): sửa title ở locale en bằng REST (không gọi dịch AI) → bản mới "1 trường đã đổi" (trước đó lần đầu tạo EN hiện 3 trường); badge "Đã xuất bản" vẫn đúng. Ảnh `t04-after-1440-{light,dark}-list.png`, `t04-after-390-light-list.png` cập nhật.
- `pnpm lint` 0 error; `pnpm typecheck` PASS; vitest `src/lib/admin src/collections src/components/admin` 81 file / 655 test PASS; `pnpm build` PASS. Full unit+ui không chạy (reviewer đã chạy full ở r1 PASS, đổi lần này nhỏ). Dev server đã tắt. Không commit.
- Residual: chưa xem trình duyệt cho 5 collection còn lại và sale mở bài không đọc được (như reviewer nêu).

## Review
- Round 1 — **STRICT FAIL** (`.context/review-reports/feature-admin-form-ux-polish-phase-1-task-04-round-1-review.md`): MAJOR-1 "N trường đã đổi" chỉ so locale đang xem → phiên bản do job dịch EN tạo báo "Không đổi trường nào". MINOR-1..4.
- Round 2 — **STRICT PASS** (`.context/review-reports/feature-admin-form-ux-polish-phase-1-task-04-round-2-review.md`): `locale: "all"` + `dropEmpty`; bấm cả dòng; `formatAdminURL`; `status` qua `flattenedFields`. MINOR còn (chấp nhận, follow-up): thiếu test "xoá giá trị → 1"; focus ring chỉ ô thời gian; `li` tiêu đề `aria-hidden` trong `ul`; `""`/`[]` ↔ `null` đếm dư ≤ 1.
- Integration (dispatcher, 1 lần trên branch sau đợt 1 + T04, `--maxWorkers=1`): 57 file / 775 test PASS.
- Doc impact: no doc impact as-built (không API/schema). Spec delta mục 4 (change doc) áp lúc close-out BL-058. Gap giữ mặc định Payload: ô "So sánh với", chọn ngôn ngữ, định dạng ngày ở màn so sánh (`admin.dateFormat`). Ghi nhận ngoài phạm vi: `readVersions` mặc định của Payload = mọi người đã đăng nhập (sale đọc được phiên bản bài đang xuất bản) — đề xuất task riêng.
