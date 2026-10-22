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
