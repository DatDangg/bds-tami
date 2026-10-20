Agent: reviewer

# Review — feature-news-detail-card-toc phase-1 task-01 — round 2 (BL-033)

- **Review level:** FAST
- **Reason:** Chỉ soi phần thay đổi từ round 1 (round 1 đã PASS NORMAL). Round này sửa 3 MINOR, mỗi sửa đổi nằm gọn trong 1 hằng số, 1 ref timer hoặc 1 class. Không đụng shared API, auth, schema hay tenant.
- **Blast radius:** `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx` (danh sách id dành riêng truyền vào `collectTocHeadings`) và `src/components/news/NewsToc.tsx` (timer khoá cuộn, class của link). Chỉ ảnh hưởng trang chi tiết tin tức. Ngoài scope, không review: `next.config.ts`, `src/components/projects/*`, `src/payload-types.ts`.

## Verify commands + result
- `pnpm vitest run src/components/news src/lib/content`: PASS, 17 files, 176 tests.
- `pnpm typecheck` (`tsc --noEmit`): PASS, không có lỗi.

## Delta check
| Round-1 finding | Fix | Result |
|---|---|---|
| MINOR-1: id heading có thể trùng id có sẵn trên trang | `page.tsx:31` khai `PAGE_RESERVED_IDS` và truyền vào `collectTocHeadings` ở `page.tsx:104`. Đã đối chiếu với code: `related-news` (page.tsx:127), `main` (PublicShell.tsx:25), `floating-contact-actions` (FloatingContact.tsx:55). Hàm này đã có test case với reservedIds (section-headings.test.ts:40). | OK |
| MINOR-2: timer khoá cuộn chạy chồng nhau / chạy sau khi unmount | `NewsToc.tsx:83` thêm ref `unlockTimer`. `:121` clear timer cũ trước khi đặt timer mới. `:86` clear khi unmount. | OK |
| MINOR-3: chữ dài không xuống dòng | `LINK_BASE` (`NewsToc.tsx:14`) thêm `break-words [overflow-wrap:anywhere]`. | OK |

## Responsive Checklist Gate
Phần UI thay đổi chỉ có class xuống dòng chữ (MINOR-3). Class này giảm nguy cơ tràn ngang ở 375/768/1280 và không đổi layout. Các mục khác: N/A cho delta này (đã đánh giá ở round 1).

## Skill gates
- aislop / oxlint / ocr: skip. Lý do: review FAST chỉ soi delta, không có trong verify command được giao. Round 1 đã đánh giá.
- AI-readable: OK. Không có tên mơ hồ. Các hằng đều có tên. Comment giải thích lý do (WHY).
- ai-friendly-web / blitzstrike: N/A.

## Findings
- [MINOR, không chặn] `page.tsx:31`: `cta-scrim` chỉ là `data-testid` (CtaBanner.tsx:34), không phải `id`. Giữ trong danh sách thì vô hại (heading "CTA scrim" chỉ bị thêm hậu tố `-2`). Có thể bỏ khỏi danh sách hoặc sửa comment ở `page.tsx:103` cho chính xác. Không bắt buộc.

## Verdict
PASS. Không có CRITICAL hay MAJOR. Cả 3 MINOR của round 1 đã được sửa.
