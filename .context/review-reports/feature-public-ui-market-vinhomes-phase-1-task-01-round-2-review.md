Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-1-task-01 · round 2
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** token dùng chung `globals.css`, `Button`/`Badge`, `cn`/`FONT_SIZE_TOKENS` (tailwind-merge), nạp `next/font` — xuất hiện trên mọi trang public.
- **Blast radius:** đổi từ round 1: `fonts.ts` nạp EB Garamond 400 + 500; token mới `--text-h2-sm` (RichText h2, JobDetail 3 h2, LeadFormSlot, ContactDetails, RentalDetail `SECTION_HEADING`, RentalSpecs, RentalTerms, SimilarRentals); h1 RentalDetail về `text-h2`; tailwind-merge biết `rounded-pill`; docs DESIGN.md, design-spec, `skills/react-nodejs/design-tokens.md`. Phần còn lại như round 1. Không đổi API/schema/data.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error; 2 warning cũ `tools/task-dashboard/server.mjs`) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app` | PASS 171 files, 1679/1679 |
| `pnpm build` | primary chạy ở worktree sạch ngoài `.claude/` (staging 1861843 + diff): **PASS** (Compiled successfully) |

## Đóng finding round 1
| # | Trạng thái | Bằng chứng |
|---|---|---|
| M1 weight 400 | RESOLVED | `src/lib/fonts.ts:7-8` `["400","500"]` qua next/font (giữ preload); preflight `h1–h6 { font-weight: inherit }`, body 400; test `src/lib/fonts.test.ts` |
| M2 thứ bậc heading | RESOLVED | `--text-h2-sm` `globals.css:179-182`, `FONT_SIZE_TOKENS` `utils.ts:10` + test `cn` |
| m1 design-spec | RESOLVED | About stats `--text-h2`; tên slide `--text-h3`; §1.7 mô tả `--text-h2-sm` |
| m2 file nguồn token | RESOLVED (còn m-a) | design-tokens.md cập nhật |
| m3 `rounded-pill` | RESOLVED | `utils.ts:24` + test 2 chiều |
| m4 chip | RESOLVED (ghi chú) | `button.tsx:14` + DESIGN.md |
| m5 panel 2px | ngoài scope (P2–P4) | — |

Thứ bậc h1 ≥ h2 ≥ h3 (desktop/375px): Cho thuê h1 `text-h2` 44/26 > h2 `h2-sm` 30/24 > h3 25/22 ✓ · Tuyển dụng h1 56 > h2 30 ✓ · Tin tức, Tin BĐS, Dự án, Dịch vụ, Liên hệ ✓.

## Responsive gate (tính bằng CSS)
Không đổi container/grid; heading token đều `clamp()` theo rem; ảnh thẻ giữ `aspect-*` + `overflow-hidden`; nút `h-11`, MobileMenu `min-h-14`, link thẻ `min-h-11`; không `100vh` mới. Residual: CLS thêm file font 400 (next/font `display: swap` + size-adjust → rủi ro thấp); h1 cho thuê 44px và thẻ nổi bật PostCard/NewsCard `lg:text-h2` (44px) có thể xuống nhiều dòng ở 768–1280px.

## Skill gates
aislop skip · oxlint skip (ESLint PASS) · ocr skip · AI-readable OK (1 chỉ báo m-a) · ai-friendly-web N/A · blitzstrike N/A.

## Findings
Không CRITICAL, không MAJOR.
- **[MINOR] m-a** `docs/DESIGN.md:193` dòng Heading 3 còn ghi "heading phụ trong nội dung" (nay là `--text-h2-sm`), bảng chữ thiếu dòng `--text-h2-sm`; `skills/react-nodejs/design-tokens.md:182` tiêu đề "Hệ góc vuông kiến trúc" mâu thuẫn thang radius mới. → sửa ở task 02.
- **[MINOR] m-b** chú thích "tránh bold giả" `src/lib/fonts.ts:7` không chính xác (PostCard `font-semibold` = 600 > 500); có từ trước, không regression → xử lý khi restyle PostCard (P3).
- **[MINOR] m-c** `NewsCard.tsx:57`, `PostCard.tsx:59` `lg:text-h2` nay 44px trong thẻ → cân nhắc `lg:text-h2-sm` ở P3-T03.
- **[MINOR] m5** (mang sang) panel 2px — P2–P4.

## Verdict: PASS
