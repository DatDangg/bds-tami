Agent: reviewer

# Review: feature-header-match-site-mockup, phase 1, task 01, round 2 (BL-046)

- Task: `tasks/feature-header-match-site-mockup/phase-1-task-01.md` (Verification summary, attempt 2)
- Round 1: `.context/review-reports/feature-header-match-site-mockup-phase-1-task-01-round-1-review.md`, kết quả FAIL (1 MAJOR, 3 MINOR)
- Diff đã review (chưa commit, staging):
  - `src/components/layout/{DesktopNav,Header,Header.test,HeaderFrame,HeaderFrame.test}.tsx`
  - `src/components/detail/{DetailTitleCard,DetailTitleCard.test,DetailLayout,DetailSubNav}.tsx`
  - `src/components/detail/detail-header-css.test.ts`
  - `src/app/(frontend)/globals.css`
  - `SPECIFICATIONS.md`, hunk "Khung trang" (dòng 19)
  - `.context/design-spec.md` §2.1 (dòng 81–87)
- Ngoài phạm vi, không review: các thay đổi BL-047 (AboutBlock, seed, migration, icons, design-spec khoảng dòng 237, SPECIFICATIONS khoảng dòng 70) và các file khác.

## Review level: STRICT

**Reason:** `--header-offset` là token layout dùng chung (sticky, scroll-margin, hero kéo lên, mục lục dính). `Header`/`HeaderFrame` là component dùng chung cho mọi trang public vi/en.

## Blast radius

Không đổi so với round 1:
- Header trên mọi trang public vi/en.
- Mọi chỗ đọc `--header-offset`: HeroSlider, HeroSearch, legal TableOfContents, RichText, `--sticky-top`.
- Trang chi tiết dự án / cho thuê / tin BĐS: `pb-8` của DetailTitleCard.

Attempt 2 chỉ đổi:
- Bán kính bo của thanh nổi.
- Comment và chữ trong doc.
- Thêm test.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm vitest run src/components/layout src/components/detail` | **PASS**: 26 files / 182 tests (reviewer tự chạy) |
| `pnpm typecheck` (`tsc --noEmit`) | **PASS**: không có lỗi (reviewer tự chạy) |
| `pnpm lint` / `pnpm test` toàn bộ | Không chạy lại. Builder báo lint 0 error. Attempt 2 không đổi logic, chỉ đổi class, comment và test. |

## Đóng các finding của round 1

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1: bán kính bo phải bằng nửa chiều cao thanh | **Đã đóng** | `HeaderFrame.tsx:43` dùng `group-data-[scrolled]:rounded-[1.625rem] lg:group-data-[scrolled]:rounded-[1.75rem]`, tức 26/28px, đúng nửa của 52/56px. `Header.test.tsx` và `HeaderFrame.test.tsx` đã assert class mới. Dòng "Biến thể" trong design-spec ghi "26px; ≥ lg 28px" và "0 ↔ 26/28px", khớp dòng "Cao / lề". Doc không còn tự mâu thuẫn. |
| MINOR-1: chữ "lề trên header nổi 8/16" | **Đã đóng** | Đã đổi thành "lề ngang … cố định" ở `globals.css:241-242`, `DetailLayout.tsx:45`, `DetailSubNav.tsx:25`, dòng Sticky trong design-spec và `SPECIFICATIONS.md:19`. Chỉ đổi chữ, code không đổi. |
| MINOR-2: test không khoá chiều cao | **Đã đóng** | `detail-header-css.test.ts` có describe BL-046, assert `:root { --header-offset: 4rem;` và `@media (min-width: 64rem) { :root { --header-offset: 4.5rem;`. Regex khớp đúng thứ tự khai báo trong `globals.css`. `HeaderFrame.test.tsx` assert lề `py-1.5` / `lg:py-2`. `DetailTitleCard.test.tsx` assert `pb-8` trên wrapper ngoài. |
| MINOR-3: mã BL trong comment | **Đã đóng** | `DetailTitleCard.tsx:39` ghi "BL-046, BL-045 T04 bỏ sót khoảng BL-031". |

**Hồi quy:**
- Grep `104px|6.5rem|rounded-[2rem]|rounded-[2.25rem]|32/36|8+64+8|16+72+16|lề trên header nổi` trong `src/**`, `SPECIFICATIONS.md` và `.context/design-spec.md` không còn kết quả.
- Không thấy hồi quy mới trong diff.

## Responsive Checklist Gate (diff có đụng UI)

Không có browser trong quyền reviewer, nên các mục dưới đây kiểm bằng CSS math. Attempt 2 chỉ đổi bán kính bo nên kết quả giữ như round 1.

| Mục | KQ | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Menu xl có net khoảng -50px so với trước. Bán kính bo không ảnh hưởng chiều rộng. |
| Mobile-first / min-width | OK | `lg:`/`xl:`/`2xl:` và `@media (min-width:64rem)` đều là min-width. |
| Container không fixed px | OK | `max-w-[84rem]`, `w-full`. |
| Font rem | OK | `text-xsmall` = 0.75rem. |
| Heading fluid / spacing scale | N/A, OK | Diff không có heading. Spacing dùng scale Tailwind. Bán kính bo dùng rem. |
| Media (logo) | OK | `lg:h-9` ghi đè `lg:h-12` nhờ twMerge. Logo dùng `w-auto object-contain`. |
| Touch target ≥ 44px | OK | `min-h-11` trong thanh 52/56px. |
| Nav mobile | OK | MobileMenu không đổi. |
| Table | N/A | Không có table. |
| 100vh | N/A | Diff không dùng. |
| prefers-reduced-motion | OK | Vẫn giữ `motion-reduce:transition-none`. |
| Không che lỗi bằng overflow:hidden | OK | Diff không thêm overflow. |

Ba mốc 375 / 768 / 1280: thanh phẳng 64 / 64 / 72px, thanh nổi 52 / 52 / 56px, bán kính 26 / 26 / 28px, bằng đúng nửa chiều cao. Vì vậy góc bo nội suy cùng nhịp với max-width và padding.

## Skill gates

| Gate | KQ |
|---|---|
| aislop | skip, `aislop` chưa cài |
| oxlint (anti-slop) | skip, oxlint chưa cấu hình |
| ocr (open-code-review) | skip, `ocr` chưa cài |
| AI-readable | OK, 0 indicator. Comment đã khớp giá trị. Không có magic number mới (bán kính có lý do "nửa chiều cao" ghi trong test và design-spec). Hàm không đổi kích thước. |
| ai-friendly-web | N/A, không đổi crawl/SEO |
| blitzstrike | N/A, không có auth/input/API |

## Findings

### [MINOR-1] `docs/DESIGN.md:260` còn ghi số header cũ

**Vấn đề:**
- Dòng này ghi `--header-offset` (80px; ≥ lg 104px), thanh 64/72px và "luôn là thanh nổi".
- Đoạn này đã sai từ BL-025, trước BL-046. File nằm ngoài diff, không chặn PASS.

**Cách sửa đề xuất:** Ở bước Doc Impact/Reconcile khi close-out, cập nhật đoạn as-built này cho khớp:
- Hai hình dạng: phẳng 64/72px, nổi 52/56px.
- Lề 6/8px trên, 8/16px hai bên.

Nếu đoạn này là mô tả lịch sử thì đánh dấu là lịch sử.

Không còn CRITICAL hoặc MAJOR.

## Residual risk

- Chưa kiểm thị giác trong browser. Bán kính 26/28px và kết luận không tràn ở 1280 dựa trên CSS math và lần kiểm tay của builder.
- `pnpm test` toàn bộ và `pnpm lint` không chạy lại. Chỉ chạy lại 26 file của layout và detail, cùng typecheck.

## Verdict: PASS

Cả 4 finding của round 1 đã đóng. Verify PASS và không có hồi quy. MINOR-1 xử lý ở bước doc reconcile khi close-out.
