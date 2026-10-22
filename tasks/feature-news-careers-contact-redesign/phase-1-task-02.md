# feature-news-careers-contact-redesign · phase-1-task-02 — Khối mới trong trình soạn bài Tin tức + render web

- Nguồn: BL-054 Quyết định 3. Spec 1.47.0 khối BL-054 mục "Khối mới trong trình soạn bài Tin tức".
- Plan: phase 1 wave A (song song P1-T01). Không migration (dữ liệu nằm trong JSON lexical) — nếu Payload sinh thay đổi schema thì DỪNG báo primary.
- Phụ thuộc: không.

## Classification / Risk
- Type: **ADDITIVE**. Risk: **HIGH** — `RichText` là renderer dùng chung mọi trang chi tiết (XSS / danh sách cho phép), editor admin, dịch tự động. Review: **STRICT**.
- Blast radius: `src/collections/News.ts` (chỉ editor của `content`), `src/lib/admin/rich-text-editor.ts`, `src/blocks/news/*` (mới), `src/components/content/RichText.tsx` (+ `src/components/content/blocks/*`), `src/lib/translation/lexical.ts` + `lexical.test.ts` (spec-validation F4: hiện không duyệt `fields` của block và `skeletonOf` so khung cây — dịch thêm chữ khối phải giữ khớp khung, không làm hỏng bản dịch cả bài), `src/lib/news/read-time.ts`, `src/lib/content/rich-text-lead.ts`, `src/payload-types.ts`, importmap admin.
- Doc impact: `docs/DESIGN.md` (khối nội dung), `docs/ERD.md` (ghi chú `news.content` có block).

## Files to Create/Modify
- `src/collections/News.ts`
- `src/lib/admin/rich-text-editor.ts`
- `src/blocks/news/`
- `src/components/content/RichText.tsx`
- `src/components/content/blocks/`
- `src/lib/translation/lexical.ts`
- `src/lib/news/read-time.ts`

## Scope
1. Editor riêng cho `news.content`: `createRichTextEditor` + `BlocksFeature` với 3 block (slug ổn định, nhãn admin tiếng Việt):
   - `statHighlights` "Số liệu nổi bật": `items` array 1–4: `value` text bắt buộc (≤ 16 ký tự, vd "+18%"), `label` text bắt buộc (≤ 80).
   - `projectMention` "Dự án nhắc đến": `project` relationship → `projects` bắt buộc.
   - `imageText` "Ảnh cạnh chữ": `image` upload ảnh bắt buộc, `text` textarea bắt buộc, `imagePosition` select `left` "Ảnh bên trái" / `right` "Ảnh bên phải" mặc định `left`.
   - Thanh công cụ cố định (BL-042) phải có cách chèn khối dễ thấy cho người không rành (nút/dropdown "Chèn khối" trên toolbar) — không bật lại nút "+" / tay kéo đã ẩn. Collection khác giữ editor cũ.
2. Render web trong `RichText` (Server Component, danh sách cho phép): node `block` với `fields.blockType` thuộc 3 loại → component tương ứng; khối lạ / thiếu dữ liệu → bỏ như cũ. `projectMention`: dùng dữ liệu đã populate (depth) nếu có, không thì tải qua query công khai theo `locale` (chỉ dự án `published`, chưa xoá, `/en` chỉ khi có bản EN — tái dùng public-queries); không đủ → ẩn khối. Thẻ: ảnh, tên, vị trí (tỉnh), loại, tình trạng mở bán, nút "Xem chi tiết" → URL dự án theo locale (content-paths). `imageText`: ảnh trái/phải, < md xếp dọc; ảnh qua `ResponsiveImage`. `statHighlights`: lưới 2–4 ô số lớn màu nhấn + nhãn.
3. Chữ trong khối localized theo bài. Bộ gom chữ dịch tự động (`src/lib/translation/lexical.ts`: hiện bỏ qua `fields` của block; `skeletonOf` so khung cây) phải dịch `value` / `label` / `text` của block không; chưa → bổ sung (không dịch id / relationship / select / blockType). `estimateReadMinutes` tính cả chữ trong khối; `rich-text-lead` / mục lục / `section-headings` không bị khối làm hỏng.
4. Test: render 3 khối (VI/EN), khối thiếu dữ liệu ẩn, dự án chưa xuất bản ẩn, chữ escape, block lạ bị bỏ; schema editor news có 3 block, collection khác không; dịch gom chữ khối; read-time đếm chữ khối.
5. `pnpm generate:types` + `pnpm generate:importmap` nếu có component admin. Kiểm `pnpm payload migrate:create` chạy thử không sinh thay đổi schema (xoá file thử nếu có, báo primary).

## Acceptance
- [ ] Admin bài tin tức chèn được 3 khối (nhãn tiếng Việt), lưu VI + EN; editor collection khác không đổi.
- [ ] Web `/tin-tuc/[slug]` + `/en/news/[slug]` hiển thị đúng 3 khối; khối hỏng / dự án không hợp lệ ẩn gọn.
- [ ] Dịch tự động không làm mất / hỏng khối.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)

## Verification summary (Builder)

## Review

## Doc impact
