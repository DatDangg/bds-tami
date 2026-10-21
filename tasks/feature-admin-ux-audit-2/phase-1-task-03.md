# feature-admin-ux-audit-2 · phase-1-task-03 — Màn sửa: thanh Lưu luôn thấy khi cuộn, "Quay lại danh sách", "Xem trên website" (A7)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051) — giai đoạn 1. Báo cáo §2.3.2–2.3.3.
- Spec: `SPECIFICATIONS.md` F10, đoạn BL-051 — mục A7.
- Phụ thuộc: sau T02 (cùng file style / config).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **MEDIUM** — thanh điều khiển màn sửa dùng chung mọi collection/global; URL công khai phải đúng theo ngôn ngữ, không lộ bản nháp.
- Expected review level: **NORMAL** (reviewer nâng STRICT nếu đụng shared component lớn / lộ nội dung nháp).
- Blast radius: mọi màn sửa/tạo admin; helper route công khai nếu tái dùng.

## Scope
**Bước 0 (bắt buộc trước khi code): kiểm trình duyệt hiện trạng Payload 3.91** ở màn sửa Cho thuê + Dự án + global Trang chủ: thanh `.doc-controls` có dính khi cuộn không; có breadcrumb/lối về danh sách không; có nút Xem trước/preview không. Ghi kết quả vào mục "Hiện trạng" của file này. Chỉ làm phần còn thiếu.
1. **Thanh Lưu luôn thấy:** nếu chưa dính → CSS `position: sticky` cho thanh điều khiển (dưới header admin, không đè ô Ngôn ngữ / Xem website BL-050, không che popup/drawer, nền đặc sáng/tối, 375px vẫn bấm được Lưu).
2. **"Quay lại danh sách":** link rõ (icon ← + chữ) về `/admin/collections/<slug>` của collection đang sửa (kể cả khi breadcrumb Payload đã có — người không rành kỹ thuật cần nút rõ); global không có danh sách → không hiện. Dùng slot Payload 3.91 (vd `admin.components.edit.beforeDocumentControls` hoặc tương đương), áp chung qua chỗ map `ADMIN_COLLECTIONS`, không sửa lẻ từng file nếu tránh được.
3. **"Xem trên website":** cho collection có trang công khai (Dự án, Cho thuê, Tin BĐS, Tin tức, Tin tuyển dụng, Dịch vụ, Trang pháp lý) — mở tab mới, URL công khai đúng theo ngôn ngữ đang sửa (tái dùng helper route có sẵn: `src/lib/content/doc-link.ts` `CONTENT_ROUTES`/`publicDetailPath`, `LEGAL_PAGE_ROUTES`; nền `NEXT_PUBLIC_SITE_URL` như `SiteLink`), **chỉ hiện khi doc đã lưu và đang công khai** (status công khai; bản EN chỉ khi bản EN thực sự có trang công khai). Có thể dùng `admin.preview` của Payload nếu nhãn + điều kiện kiểm soát được; ghi lý do chọn.
4. Test unit cho hàm dựng URL / điều kiện hiện nút.
5. **Carry-over MINOR review T02:** thống nhất breakpoint trong `src/components/admin/styles/_list-toolbar.scss` (header 767px vs search/export 768px) về một mốc.

## Hiện trạng (Bước 0, trình duyệt dev server `tami-dev`, admin test `@example.test`)
Đo trên Cho thuê (`/admin/collections/rentals/<id>`), Dự án (`/projects/<id>`), global Trang chủ, ở 1024/1280 và 375, sáng + tối:
- **Sticky: Payload 3.91 ĐÃ dính** `.doc-controls` (`position: sticky; top: 0`, z-index 5; ở trang đang có header scroll mất nên thanh dính ở `top: -56px`, phần nút Lưu nằm trong dải 45px nhìn thấy). Nút Lưu luôn thấy khi cuộn ở cả 3 màn.
- **Thiếu: nền trong suốt** (`rgba(0,0,0,0)`; `blur-bg-light` của Payload không ra nền ở build này) nên nội dung form cuộn xuyên qua nút Lưu. Cần nền đặc sáng/tối.
- **Breadcrumb** (`.step-nav`: "/ Cho thuê / <tiêu đề>") có, nhưng nằm trong `.app-header` (position relative) nên TRÔI MẤT khi cuộn; không có nút "quay lại" rõ.
- **Preview / Xem trước:** KHÔNG có (không collection nào bật `admin.preview`/livePreview); `doc-controls` chỉ có "Lưu" + menu ⋮.
- Global Trang chủ: cùng thanh dính, không breadcrumb về danh sách (không có danh sách) — đúng ý đồ, không cần link.
→ Chỉ làm phần thiếu: nền đặc, "Quay lại danh sách", "Xem trên website".

## Acceptance
- [x] Cuộn form dài (Cho thuê, Dự án): nút Lưu luôn thấy; sáng/tối; 375px + 1280px.
- [x] Màn sửa collection có "Quay lại danh sách" về đúng danh sách.
- [x] "Xem trên website" chỉ ở loại có trang công khai, chỉ khi đã lưu + công khai, đúng URL vi/en, tab mới (`rel="noopener"`).
- [x] BL-050 (header admin, ô Ngôn ngữ, Xem website) không vỡ; drawer/popup không bị thanh dính che.
- [x] Phần Payload 3.91 không cho làm mà không thay view gốc → ghi gap.
- [x] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; importMap regen nếu thêm component.

## Quyết định + lý do
- **Không dùng `admin.preview` của Payload** cho "Xem trên website": nó thêm nút "Xem trước" vào cả collection không có trang công khai, cần async `url` trả về server-side dựa trên doc ở thời điểm tải (không theo doc vừa lưu), nhãn "Xem trước" sai nghĩa (doc đã công khai, không phải nháp), và không kiểm soát được "chỉ hiện khi đã lưu + công khai". Dùng slot `edit.beforeDocumentControls` (client) đọc `useDocumentInfo().savedDocumentData` nên nút tự cập nhật sau khi Lưu mà không cần tải lại.
- **Điều kiện hiện nút = đúng `publicWhere`**: `status` ∈ `PUBLIC_STATUSES` (Cho thuê thêm `rented`), `deletedAt` rỗng, ở EN thì `hasEnglish === true`; đường dẫn dựng bằng `resolveInternalDocHref` (`doc-link.ts`, cùng helper link nội bộ Lexical, dùng `CONTENT_ROUTES`/`LEGAL_PAGE_ROUTES`/`publicDetailPath`) nên vi/en và slug theo ngôn ngữ đang sửa đúng; nền = `NEXT_PUBLIC_SITE_URL` qua `getEnv()` ở phần server của slot (`DocumentNavSlot`), như `SiteLink`. Hàm thuần `src/lib/admin/public-doc-url.ts` (có test).
- Không lọc `publishedAt` (hẹn giờ FR-ADM-16 chưa có trong `buildPublicWhere`); khi thêm sẽ chỉ cần sửa ở `buildPublicWhere` + bổ sung điều kiện ở `publicDocUrl` (ghi residual).
- **Áp chung** ở `ADMIN_COLLECTIONS` qua `withDocumentNavSlot` (`src/lib/admin/document-nav-slot.ts`), giữ slot sẵn có; global không gắn. Component tự ẩn khi: không có `collectionSlug`, trong drawer sửa nhanh (`useEditDepth() > 1`), và "Xem trên website" ẩn khi chưa có `id` (đang tạo mới).
- "Quay lại danh sách" luôn hiện ở màn sửa/tạo của collection (kể cả tạo mới), về `/admin/collections/<slug>` bằng `Link` của Payload (đi qua guard "rời trang chưa lưu" của Payload).
- **CSS** `styles/_doc-controls.scss` (mới, đăng ký trong `custom.scss`): chỉ thêm `background: var(--theme-bg)` (token sáng/tối sẵn có) cho `.doc-controls`; KHÔNG đổi position/z-index của Payload nên drawer (z 101), popup, ô Ngôn ngữ vẫn nằm trên. Hai link dạng nút phụ viền mảnh (cùng kiểu "Hiển thị cột"); ≤768px chỉ còn icon 44x44, chữ ẩn kiểu sr-only (`aria-label` + chữ cho đọc màn hình).
- **Carry-over T02:** `_list-toolbar.scss` hàng header `max-width: 767px` → `768px`, cùng mốc với các khối 768/769 còn lại (khớp mid-break Payload); thêm test khẳng định một mốc. Mốc 767 ở `_surfaces.scss` (nút Xem website/nav) ngoài scope, không đụng.

## Verify
- Lệnh từ `.context/project-config.md`; trình duyệt dev server `tami-dev`.

## Verification summary (Builder)
- Unit: `public-doc-url.test.ts` (12), `DocumentNavLinks.test.tsx` (4), `document-nav-slot.test.ts` (2), `doc-controls-styles.test.ts` (2), `list-toolbar-styles.test.ts` (+1) PASS.
- `pnpm typecheck`, `pnpm lint` (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`), `pnpm test`: typecheck 0 lỗi; test 3585 passed (sau thay đổi cuối). `pnpm generate:importmap`: đã sinh (thêm `DocumentNavSlot` vào `importMap.js`).
- Trình duyệt (admin test `@example.test`, đã xoá bằng Local API sau khi kiểm: deleted 1; script tạm đã xoá):
  - Cho thuê (rented, hasEnglish=false) 1024/1280 tối: sau cuộn 1120px nút Lưu top=5px, thanh nền đặc `rgb(18,17,16)`, "Quay lại danh sách" → `/admin/collections/rentals`, "Xem trên website" → `/cho-thue/<slug>` (fetch 200, tab mới `rel="noopener noreferrer"`).
  - Dự án 1280 sáng: nền thanh `rgb(247,247,245)`, 2 link đúng; ô Ngôn ngữ [1038–1208] và "Xem website" [884–1018] không chồng nhau (BL-050 không vỡ).
  - Dự án 375 sáng: scrollWidth 375 (không cuộn ngang), 2 link icon 44x44, Lưu cao 44, bấm được sau cuộn 1500px (top 0.6px).
  - Dự án EN (`?locale=en`, hasEnglish=true) → `http://localhost:3000/en/projects/<slug-en>`; Trang pháp lý ở EN khi `hasEnglish=false` → KHÔNG có nút (không link 404); Lead, danh sách, global Trang chủ → không có link của T03; tạo mới Cho thuê → chỉ "Quay lại danh sách".
  - Drawer sửa nhanh (icon sửa ô Danh mục) mở trên thanh dính (drawer z-index 101 > 5), trong drawer KHÔNG có hai link.

## Residual risk
- "Xem trên website" ở collection `job-postings` hiện cả khi tin quá hạn (trang chi tiết công khai vẫn tồn tại, chỉ danh sách lọc hạn) — đúng hành vi hiện tại của trang công khai.
- Hẹn giờ `publishedAt` (FR-ADM-16) chưa hiện thực ở `buildPublicWhere` nên nút chưa xét; cần cập nhật `publicDocUrl` nếu sau này thêm.
- Chưa thử Lưu thật để xem nút tự cập nhật ngay sau Lưu (dựa vào `savedDocumentData` = state `data` của Edit view, Payload `setData(json.doc)` sau onSave); không sửa dữ liệu thật trong lúc kiểm.
- Locale admin đang sửa được Payload nhớ theo tài khoản (preference): đã kiểm hành vi với EN/VI; link theo `useLocale().code`.

## Payload 3.91 gaps
- `admin.preview` / Preview button không dùng được cho mục đích này (xem Quyết định); dùng slot `beforeDocumentControls`.
- `.doc-controls` không có nền (class `blur-bg-light` không ra màu) → phải bổ sung bằng CSS; header/breadcrumb không dính nên "Quay lại" phải đặt trong thanh điều khiển.
- Slot server `beforeDocumentControls` không nhận `collectionSlug` trong `serverProps` → phần quyết định dùng client hook `useDocumentInfo`.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-1-task-03-round-1-review.md` — **STRICT, PASS**. MINOR mở: (1) tin tuyển dụng quá hạn vẫn có "Xem trên website" (khớp trang công khai vẫn mở); (2) `public-doc-url.ts` chép logic `buildPublicWhere` — khi thêm hẹn giờ `publishedAt` phải sửa cả hai; (3) cảnh báo rời trang chưa lưu của "Quay lại danh sách" dựa guard Payload, chưa test; (4) chưa thử Lưu thật để thấy link hiện ngay.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r1** (STRICT). `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 353 files / 3585 PASS.
- Spec Publisher GĐ1: chạy trước commit này (xem `spec/CHANGELOG.md`).

## Doc impact
- Spec delta F10 (BL-051 GĐ1) + spec-publisher. Không đổi API/ERD (no doc impact khác).
