Agent: reviewer

# Review: feature-header-match-site-mockup, phase 1, task 01, round 1 (BL-046)

- Task: `tasks/feature-header-match-site-mockup/phase-1-task-01.md`
- Change doc: `spec/changes/2026-10-21-header-match-site-mockup.md`. Chỉ mục "Phạm vi user chốt" là in-scope.
- Diff đã review (chưa commit, staging): `DesktopNav.tsx`, `Header.tsx`, `Header.test.tsx`, `HeaderFrame.tsx`, `HeaderFrame.test.tsx`, `DetailTitleCard.tsx`, `globals.css`, `SPECIFICATIONS.md` hunk "Khung trang" (dòng 19), `.context/design-spec.md` §2.1 (dòng 82–85). Các thay đổi BL-047 và file ngoài phạm vi (AboutBlock, icons, migration, seed, `.claude/agents`, `next.config.ts`, importMap) **không review**.

## Review level: STRICT

**Reason:** `--header-offset` là token layout dùng chung (sticky, scroll-margin, hero kéo lên, mục lục dính), còn `Header`/`HeaderFrame` là component chung của mọi trang public vi/en.

## Blast radius

- Header trên mọi trang public vi/en, cả 2 dạng: thanh phẳng (64/72px) và thanh nổi khi cuộn (52/56px).
- Các chỗ dùng `--header-offset`, đều tự theo giá trị mới vì không còn hardcode:
  - `HeroSlider` (`-mt-(--header-offset)`, `pt-(--header-offset)`)
  - `HeroSearch` (`scroll-mt`)
  - `legal/TableOfContents` (sticky top)
  - `RichText` (`scroll-mt`)
  - `--sticky-top` mặc định ở `:root`
- Trang chi tiết dự án / cho thuê / tin BĐS: `DetailTitleCard` có thêm `pb-8`. `--sticky-top` ở trang chi tiết vẫn cố định 0.5rem/1rem nên không đổi.
- `MobileMenu` có thanh trên `h-16 lg:h-18` (64/72). Thanh này nay **khớp đúng** chiều cao header phẳng (trước là 80/104), không hồi quy.
- Đã Grep `h-16|lg:h-18|top-20|6.5rem|104px…` trong `src`: không còn chỗ nào hardcode chiều cao header cũ. `PageHero pt-20` không kéo hero lên dưới header nên không liên quan.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm vitest run` Header, HeaderFrame, `src/components/detail`, HomeBlocks, project-detail, rental-detail | **PASS**: 10 files / 119 tests (reviewer tự chạy) |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | Không chạy lại. Builder báo PASS / 0 error / 344 files, 3531 PASS. Typecheck + lint hợp lý vì diff chỉ đổi class và CSS var. |

## Responsive Checklist Gate (diff có đụng UI)

Không có browser trong quyền reviewer, nên các mục dưới đây kiểm bằng CSS math.

| Mục | KQ | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Menu xl: chữ 14px/.08em → 12px/.04em, ước ~-100px với 7 mục EN. Gap 16 → 24px (+48px). Net khoảng **-50px** so với trước, vốn đã không tràn ở 1280. Builder đã kiểm tay 1280 VI/EN. |
| Mobile-first / min-width | OK | `lg:`/`xl:`/`2xl:` đều là min-width. `--header-offset` dùng `@media (min-width:64rem)`. |
| Container không fixed px | OK | Không đổi (`max-w-[84rem]`, `w-full`). |
| Font rem | OK | `text-xsmall` = `--text-xsmall: 0.75rem` (globals.css:92). |
| Heading fluid / spacing scale | N/A | Diff không có heading. Spacing dùng scale Tailwind (`py-1.5`, `py-2`, `pb-8`, `gap-6`). |
| Media (logo) | OK | `BrandLogo` có `w-auto object-contain object-left max-w-[7.5rem]`. `cn` = twMerge (utils.ts:31) nên `lg:h-9` ghi đè đúng `lg:h-12`. Logo giữ tỉ lệ, không méo, không cao quá thanh (36 < 56). |
| Touch target ≥ 44px | OK | Link logo và mục menu giữ `min-h-11` (44px) trong thanh 52/56px. Hàng nội dung `h-full` cao bằng thanh nên không cắt. |
| Nav mobile | OK | Không đổi (`MobileMenu` < xl). |
| Table | N/A | Không có table. |
| 100vh | N/A | Diff không dùng. |
| prefers-reduced-motion | OK | Giữ `motion-reduce:transition-none` trên header và thanh. |
| Không che lỗi bằng overflow:hidden | OK | Diff không thêm overflow. |

Ba mốc đã kiểm: 375 (thanh 64 phẳng / 52 nổi), 768 (như 375 vì < lg), 1280 (72 / 56, menu một hàng).

## Skill gates

| Gate | KQ |
|---|---|
| aislop | skip, `aislop` chưa cài |
| oxlint (anti-slop) | skip, oxlint chưa cấu hình (không có `.oxlintrc.json`) |
| ocr (open-code-review) | skip, `ocr` chưa cài |
| AI-readable | OK. 1 indicator nhẹ: comment còn ghi số cũ (MINOR-1), dưới ngưỡng 3. Không magic number mới ngoài token. Hàm không đổi kích thước. |
| ai-friendly-web | N/A, không đổi crawl/SEO |
| blitzstrike | N/A, không có auth/input/API |

## Findings

### [MAJOR-1] Bán kính bo thanh nổi không còn bằng nửa chiều cao thanh, và design-spec §2.1 tự mâu thuẫn

**Vị trí:**
- `src/components/layout/HeaderFrame.tsx:43` (`group-data-[scrolled]:rounded-[2rem] lg:group-data-[scrolled]:rounded-[2.25rem]`)
- `.context/design-spec.md:81`
- `src/components/layout/Header.test.tsx:131`

**Vấn đề:**
- Thanh nổi nay cao 52px (≥ lg 56px), nhưng bán kính vẫn 32px / 36px.
- BL-026 có quy tắc rõ ở design-spec §2.1 dòng "Biến thể": *"bo tròn hai đầu bằng bán kính thật = nửa chiều cao thanh (32px; ≥ lg 36px…)"*, và *"góc bo đổi dần 0 ↔ 32/36px"*.
- Dòng "Cao / lề" vừa sửa lại ghi 52/56px, nên as-built doc nay tự mâu thuẫn: nửa của 52/56 là 26/28, không phải 32/36.

**Hậu quả khi chạy:**
- Trình duyệt co bán kính quá lớn (hệ số 52/64). Ảnh tĩnh vẫn là viên thuốc nên nhìn tĩnh không lỗi.
- Nhưng khi nội suy với `--ease-standard` `cubic-bezier(0.2,0,0,1)`, bán kính chạm 26px ở khoảng **41% thời gian** (~185ms / 450ms). Phần còn lại góc đứng yên trong khi max-width/padding vẫn chạy.
- Chiều ngược lại (về đầu trang) góc đứng yên ~50ms đầu.
- Đây đúng là loại lệch nhịp mà BL-026 đã sửa (nhẹ hơn trường hợp 9999px nhưng cùng bản chất).

**Cách sửa đề xuất:**
- Đổi thành `group-data-[scrolled]:rounded-[1.625rem] lg:group-data-[scrolled]:rounded-[1.75rem]` (26/28px).
- Cập nhật assertion ở `Header.test.tsx:131`.
- Sửa design-spec §2.1 dòng "Biến thể" thành 26px / ≥ lg 28px, "0 ↔ 26/28px".
- Hoặc, nếu user muốn giữ 32/36: phải ghi rõ ngoại lệ trong design-spec. Không để doc nói "= nửa chiều cao" trong khi thực tế không phải.

### [MINOR-1] Còn nhiều chỗ ghi "--sticky-top = lề trên header nổi (8/16px)", nhưng lề trên header nổi nay là 6/8px

**Vị trí:**
- `src/app/(frontend)/globals.css:241-242` (comment "lề trên của header nổi (8/16px)")
- `src/components/detail/DetailLayout.tsx:45`
- `src/components/detail/DetailSubNav.tsx:25`
- `.context/design-spec.md:87` (dòng Sticky: "0.5rem / ≥ lg 1rem (= lề header nổi)")
- `SPECIFICATIONS.md:19` ("đúng lề của header nổi (8px; ≥ lg 16px)")

**Vấn đề:** Hành vi không sai, vì header ẩn hẳn khi cuộn ở trang chi tiết và 8/16 vẫn bằng lề **hai bên**. Nhưng các mô tả trên không còn đúng.

**Cách sửa:** Đổi chữ thành "= lề ngang header nổi (8/16px)", hoặc ghi rõ đây là giá trị cố định. Không cần đổi code.

### [MINOR-2] Test header không còn khoá chiều cao: chỉ kiểm `h-full`

**Vị trí:** `src/components/layout/Header.test.tsx:133`, `src/components/layout/HeaderFrame.test.tsx:58`

**Vấn đề:**
- Assertion cũ `h-16 lg:h-18` được thay bằng `h-full`. Không test nào kiểm giá trị `--header-offset` (4rem / 4.5rem).
- Cũng không test nào kiểm điều kiện "lề + thanh = header-offset", tức 6+52+6 = 64 và 8+56+8 = 72.
- `DetailTitleCard` `pb-8` cũng chưa có test.

**Cách sửa đề xuất:**
- Thêm 1 test đọc `globals.css`, giống `detail-header-css.test.ts`, để assert `--header-offset: 4rem` và `4.5rem` trong `min-width:64rem`.
- Thêm 1 assertion `pb-8` trong `DetailTitleCard.test.tsx`.

Không chặn PASS, vì test hiện tại dùng class làm hợp đồng như các test header khác trong repo.

### [MINOR-3] Comment trong `DetailTitleCard` dẫn mã thay đổi chưa đúng

**Vị trí:** `src/components/detail/DetailTitleCard.tsx:39`

**Vấn đề:** Comment ghi "(BL-031, mockup…)", trong khi thay đổi thuộc BL-046 (hồi quy BL-045 T04).

**Cách sửa:** Ghi "BL-046 (BL-045 T04 bỏ sót khoảng BL-031)" để truy vết đúng.

## Phủ yêu cầu (Phạm vi user chốt)

| Yêu cầu | KQ |
|---|---|
| Chữ menu 12px / .04em / gap 24px (xl), 2xl giữ gap 32 | OK (`DesktopNav.tsx:38,65`) |
| `--header-offset` 64/72; nổi 52/56, lề trên 6/8, hai bên 8/16 | OK (globals.css, HeaderFrame `py-1.5` / `lg:py-2`, `px-2` / `lg:px-4`) |
| Logo ≥ lg 36px | OK (`lg:h-9`, twMerge ghi đè `lg:h-12`) |
| Nền kính + hành vi cuộn (nổi / ẩn ở chi tiết) giữ nguyên | OK (không đổi class `site-header-bar`, glass, translate) |
| Khoảng 32px trước thanh mục con (dự án / cho thuê / tin BĐS) | OK (`pb-8`; cả 3 trang đều truyền `subNav`) |
| Spec / design-spec cập nhật | Một phần: dòng radius chưa cập nhật (MAJOR-1) |
| "(Không làm)" ngoài phạm vi | Không bị đụng (nền vẫn kính, gạch chân vẫn màu chữ, CTA giữ) |

## Residual risk

- Chưa kiểm thị giác trong browser (reviewer không chạy app). Kết luận "không tràn" ở 1280 và bán kính co lại dựa trên CSS math và lời builder.
- `pnpm test` toàn bộ không chạy lại. Chỉ chạy lại 10 file liên quan.

## Verdict: FAIL

Còn 1 MAJOR (MAJOR-1). Builder cần làm:
1. Đổi bán kính thanh nổi thành 26/28px (`rounded-[1.625rem]` / `lg:rounded-[1.75rem]`), cập nhật `Header.test.tsx`, sửa design-spec §2.1 dòng "Biến thể". Nếu giữ 32/36 thì ghi rõ ngoại lệ đã được user duyệt.
2. (Khuyến nghị) MINOR-1: sửa chữ "lề trên header nổi 8/16" ở globals.css, DetailLayout, DetailSubNav, design-spec, SPECIFICATIONS.
3. (Khuyến nghị) MINOR-2: thêm test khoá giá trị `--header-offset` + `pb-8`.
4. (Khuyến nghị) MINOR-3: sửa mã BL trong comment `DetailTitleCard`.
