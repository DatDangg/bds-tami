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
- **Builder:** builder-strong (user chỉ định qua dispatcher).
- **Định nghĩa khối** ở `src/blocks/news/index.ts` (slug `statHighlights` / `projectMention` / `imageText`, `interfaceName` → type trong `payload-types.ts`). Trường chữ của khối khai **một chỗ** ở `src/blocks/news/text-fields.ts` (`NEWS_BLOCK_TEXT_FIELDS` + `forEachBlockTextSlot`), dùng chung cho bộ dịch và "N phút đọc"; test `src/blocks/news/index.test.ts` buộc danh sách này khớp đúng mọi trường text/textarea của khối.
- **Editor:** `createRichTextEditor(placeholder, { blocks })` thêm `BlocksFeature` chỉ khi truyền `blocks`; chỉ `news.content` truyền. Giữ `hideAddBlockButton` / tay kéo ẩn. Chèn khối qua dropdown khối sẵn có của FixedToolbar; Payload chỉ vẽ icon nên `_forms.scss` thêm chữ "Chèn khối" (CSS `::after`, như tiền lệ "Thêm mới"). Không viết client feature riêng (ít code hơn, không đổi dữ liệu).
- **`projectMention`: lệch nhẹ so với scope §2 "dùng dữ liệu populate nếu có".** Trường `project` đặt `maxDepth: 0` (bài chỉ lưu/đọc id, không populate cả dự án vào JSON bài). Thẻ **luôn** tải qua truy vấn công khai theo `locale` (`loadMentionedProjects` → `findPublicProjectCardsByIds`, là `cardsByIds` cũ của `project-queries.ts` được export lại tên mới, dùng `findPublicList`). Lý do: populate không lọc `hasEnglish` ở `/en` và ở depth 1 không có ảnh / tỉnh của dự án; truy vấn công khai là nguồn duy nhất đúng về "được hiện". Một truy vấn cho cả bài, ≤ 20 id, id không phải UUID bị bỏ (tránh lỗi kiểu Postgres → 500).
- **RichText vẫn là component đồng bộ:** trang `/tin-tuc/[slug]` tải map dự án trong `Promise.all` sẵn có rồi truyền `mentionedProjects`; `RichText` render node `block` qua `renderNewsBlock` (danh sách cho phép `blockType`). Nơi khác không truyền map → khối "Dự án nhắc đến" ẩn (chỉ `news.content` có khối). Không tách async component (khỏi rủi ro `RichText` bị import từ client).
- **Render:** Số liệu nổi bật = `ul` lưới 1–4 ô (`< md` tối đa 2 cột), số `font-display text-h2 text-accent-text`; Ảnh cạnh chữ = flex, ảnh `md:w-5/12` 4:3 `ResponsiveImage` (alt của media), `md:flex-row(-reverse)`, `< md` ảnh trên chữ, chữ `whitespace-pre-line`; Dự án nhắc đến = thẻ ngang, cả thẻ MỘT link (`CARD_LINK_CLASS` dùng chung), ảnh trang trí, eyebrow + tên + "tỉnh · loại (danh mục) · tình trạng" + "Xem chi tiết →". Chỉ token màu sẵn có. Khối thiếu dữ liệu (không còn mục hợp lệ, ảnh chưa populate / PDF, chữ rỗng, dự án không có trong map) → `null`.
- **Dịch (F4):** `translation/lexical.ts` duyệt "ô chữ" (holder + key) thay vì chỉ text node: text node + ô chữ khối theo `NEWS_BLOCK_TEXT_FIELDS`. `skeletonOf` giờ che **đúng các ô đó** (trước đây che mọi key `text` bất kỳ — vô tình che `imageText.text`). `MAX_TEXT_NODES` đếm cả ô khối. Khối dở dang (giá trị không phải chuỗi) bỏ qua, không `invalid_input`.
- **Fixture test:** `tests/fixtures/news/payload-config.ts` thêm collection `projects` rút gọn — Payload bắt quan hệ trong khối phải trỏ tới collection có trong config (không thì `InvalidFieldRelationship` khi build config).
- **CSS phụ:** `.tami-required label.field-label::after` cũ (selector con cháu) vẽ thêm `*` cho mọi trường con trong khối → thêm luật bỏ dấu * thêm cho label nằm trong `.rich-text-lexical__wrap` (trường con đã có `*` của Payload).
- **i18n:** namespace mới `newsBlocks` (`statsLabel`, `projectMentionEyebrow`, `viewDetail`), thêm cuối `vi.json` / `en.json`; tình trạng mở bán dùng lại `page.projects.salesStatus`.
- **Không migration:** `pnpm payload migrate:create t02_schema_check --skip-empty` không sinh file (không thay đổi schema DB).

## Verification summary (Builder)
- `pnpm typecheck` → PASS.
- `pnpm lint` → PASS (0 lỗi; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, không thuộc task).
- `pnpm test` → PASS 390 file / 3935 test (gồm integration với DB tạm). Lần chạy đầu có 1 lỗi typecheck trong test mới (`tests/integration/news.test.ts`, kiểu `never`) → sửa, chạy lại typecheck + `news.test.ts` 31/31 PASS.
- `pnpm build` → PASS. `node scripts/i18n-check.ts` → vi/en khớp.
- `pnpm generate:types` (+3 interface khối) · `pnpm generate:importmap` (+`BlocksFeatureClient`).
- Test mới: `src/blocks/news/index.test.ts` (schema 3 khối, nhãn VI, giới hạn, khớp trường chữ, editor mặc định không có khối, đoạn dẫn/mục lục không hỏng, id dự án), `src/components/content/blocks/NewsBlock.test.tsx` (render 3 khối VI/EN, ≤ 4 ô, escape, khối thiếu dữ liệu / dự án không công khai / id hỏng / khối lạ ẩn), `src/lib/news/mentioned-projects.test.ts`, `src/lib/translation/lexical.test.ts` (+4: gom chữ khối, ghép không `invalid_output`, giữ blockType/id/project/image/imagePosition, khối dở dang, trần số ô), `translation-service.test.ts` (+1 end-to-end), `news-view.test.ts` (+1 phút đọc), `tests/integration/news.test.ts` (+3: editor news có đúng 3 khối / editor toàn cục không; lưu VI + EN, depth 1 ảnh populate, dự án chỉ id; khối thiếu/vượt giới hạn/PDF → 400).
- Trình duyệt (dev :3112, DB `tami_wt54_p1t02`, đã tắt): `/tin-tuc/<slug>` 1440 + 375 hiện đủ 3 khối, không cuộn ngang; `/en/news/<slug>`: chữ EN, dự án chỉ có bản VI bị ẩn, dự án có EN → `/en/projects/...`. Admin (tài khoản dev `.env.local`): toolbar có "Chèn khối" → 3 mục tiếng Việt; chèn "Số liệu nổi bật" rỗng → lỗi "cần tối thiểu 1"; điền + Lưu → JSON vi có khối mới, bản en giữ nguyên; form Dự án không có "Chèn khối". Dữ liệu mẫu (3 khối gắn vào 1 bài + bản EN mẫu) chỉ nằm trong DB worktree.

## Review

## Doc impact
- `docs/DESIGN.md` (khối nội dung / RichText): thêm 3 khối Tin tức, danh sách cho phép `blockType`, `mentionedProjects` tải công khai theo locale. **Chưa sửa trong task này** — primary reconcile ở close-out (tránh xung đột doc với task song song).
- `docs/ERD.md` §4.8: ghi chú `news.content` chứa node `block` (3 `blockType`, `projectMention.project` = id dự án, `imageText.image` = id media), không bảng/cột mới. **Chưa sửa** — như trên.
- `docs/API_SPEC.md`: no doc impact (không endpoint/contract mới). Migration: không.
