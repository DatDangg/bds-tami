# Spec Update — 2026-10-19 rental-share-buttons-s09

**spec_version:** 1.5.0 → 1.6.0 (MINOR — thêm hành vi hiển thị vào requirement F4: vị trí cụm chia sẻ, nút Web Share trên điện thoại, cụm dính ≥ xl. Theo `docs/SPEC_VERSIONING.md`, PATCH chỉ dành cho "làm rõ, không đổi behavior"; ở đây hành vi trang đổi so với code hiện tại (chia sẻ ở cuối bài). Tiền lệ: 1.4.0 — nợ thiết kế khung trang theo design-spec — cũng là MINOR. Không đổi API/schema.)

**Trigger:** feature-update (Change Request MODIFY, BL-007 — nợ thiết kế L8-T04, D4 spec-validation layer 8) — change doc `spec/changes/2026-10-19-rental-share-buttons-s09.md`, task `tasks/feature-rental-share-buttons-s09/phase-1-task-01.md`

**Requirements:**
- SỬA **F4 (Đăng tin BĐS)** trong `SPECIFICATIONS.md`: thêm câu — chi tiết bài có chia sẻ (Facebook, Zalo, sao chép link) ở **đầu bài**; điện thoại dùng 1 nút "Chia sẻ" Web Share API (fallback menu); màn rộng (≥ xl) cụm chia sẻ dính lề trái khi cuộn (design-spec S09).
- SỬA **design-spec S09** bước 2 (`.context/design-spec.md`): chỉ một cụm chia sẻ trong bài (không lặp cuối bài); < sm (640): 1 nút "Chia sẻ / Share" gọi `navigator.share` (tiêu đề + URL canonical), không hỗ trợ hoặc lỗi khác huỷ → menu (Facebook, Zalo, sao chép link; `aria-expanded`, Esc/bấm ngoài đóng); sm–xl: hàng ngang dưới ngày đăng; ≥ xl: cụm dọc chỉ icon (`aria-label`) `sticky` lề trái cột chữ từ đầu bài đến hết nội dung/thư viện ảnh, không đè form lead / bài liên quan. Bảng responsive thêm mốc 640.
- Liên quan (không đổi chữ): **FR-PUB-07** (chi tiết bài Đăng tin BĐS).

**Code dự kiến (builder chốt):**
- `src/components/posts/PostDetail.tsx` (dời cụm chia sẻ lên đầu bài, bỏ bản cuối bài)
- Component chia sẻ mới trong `src/components/posts/` (Web Share + fallback menu + biến thể ngang/dọc dính)
- `src/i18n/messages/vi.json`, `src/i18n/messages/en.json` (nhãn "Chia sẻ / Share", aria-label)
- Test component
- **Không đổi** `src/components/news/ShareButtons.tsx` (tin tức `/tin-tuc/[slug]`, tuyển dụng `JobDetail`)

**Schema/API:** không đổi.

**Ảnh hưởng:**
- Trang `/tin-bds/[slug]` + `/en/property-news/[slug]`.
- Retest: tin tức chi tiết `/tin-tuc/[slug]` và tuyển dụng chi tiết vẫn dùng `ShareButtons` như cũ; form lead trong bài Đăng tin BĐS; JSON-LD `Article`.

**Docs đã cập nhật:** `SPECIFICATIONS.md` F4 + version; `.context/design-spec.md` S09. As-built (`docs/API_SPEC.md`/`docs/ERD.md`): no doc impact.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 6
