Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · Phase 3 close-out · round 1

## Review level
**NORMAL** — đổi trình bày 1 component dùng chung (`NewsCard`, 6 call site đã kiểm, chỉ UI news/home) + sửa docs as-built; không auth/tenant/schema/API/data.

## Blast radius
`NewsCard` biến thể `card` mặc định thành thẻ trắng viền mọi nơi trừ khối tối trang chủ:
- `NewsListBody.tsx:16` (`/tin-tuc` trang 2+, danh mục) — nền sáng.
- `NewsHomeBody.tsx:29,80` (hàng danh mục, "Tin khác") — nền sáng.
- `tin-tuc/[slug]/page.tsx:151` (tin liên quan) — `bg-bg-alt` sáng.
- `HomeNews.tsx:33` (trang chủ, `.theme-dark-block`) — `onDark` → phẳng, trong suốt.
- `NewsHomeBody.tsx:55` (`feature`), `:61` (`row`) — phẳng.
Docs: `.context/design-spec.md`, `docs/DESIGN.md` (as-built); không sửa BRD/PRD/SPECIFICATIONS.

## Verify
- `pnpm lint`: PASS 0 error (2 warning ngoài diff).
- `pnpm typecheck`: PASS.
- `pnpm test src/components/news src/components/home`: 11 files / 107 tests PASS.
- Full test/build: builder 3006 PASS, build PASS.

## Sáng/tối
Chỉ `HomeNews` nằm trong `.theme-dark-block` và truyền `onDark` → không có thẻ trắng dùng token chữ khối tối; AA giữ. Các `card` khác trên nền sáng.

## §3 docs vs code
| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| design-spec §2.7 đệm 3rem chỉ khi `overlap` | OK | `PageBanner.tsx:31` `overlap && "pb-12"` |
| S02 (1280 = 4 cột, băng tìm kiếm, bỏ "2 select 50/50") | OK | |
| S08 thêm 1280 / 4 cột | OK | |
| §3.2 thẻ Dự án (`text-h4`, thẻ trắng, viền, `p-4`, `hover:shadow-md`) | OK | `ProjectCard.tsx:30,43-44` |
| §3.2 thẻ Tin/ưu đãi (thẻ trắng; `onDark`/`feature`/`row` phẳng) | OK | `NewsCard.tsx` `isBoxed` |
| `DESIGN.md:239/241/243/269` | OK | |

## Responsive gate (đọc CSS)
Layout `h-full flex-col overflow-hidden` trong lưới sẵn có OK · token OK · ảnh ratio/sizes không đổi OK · cả thẻ là link `min-h-11` OK · `motion-reduce` + focus ring OK. **PASS** (chưa kiểm trình duyệt).

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK; ai-friendly-web/blitzstrike N/A.

## Findings
- [MINOR] `NewsCard.tsx:61-67` tiêu đề trong thẻ trắng kế thừa màu chữ — nếu sau này dùng `card` trong `.theme-dark-block` mà quên `onDark` sẽ chữ sáng trên thẻ trắng. *(Primary thử `text-text` nhưng `--color-text` bị định nghĩa lại trong `.theme-dark-block` (`globals.css:214`) nên không bảo vệ được → giữ nguyên, ghi residual.)*
- [MINOR] `news-components.test.tsx:52-66` chỉ kiểm class; chưa có assert `HomeNews` truyền `onDark`.
- [MINOR] design-spec §3.2 dòng Dự án chưa nêu `font-display` (`ProjectCard.tsx:44`).

## Verdict
**PASS** — không CRITICAL/MAJOR.
