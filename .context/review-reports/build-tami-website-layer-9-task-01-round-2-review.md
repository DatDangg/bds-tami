Agent: reviewer

# Review — build/tami-website · layer-9-task-01 (Trang chủ S01) · round 2

- Worktree: `D:\prj\bds-wt9-t01` (chưa commit)
- Review level: **STRICT**
- Reason: carousel a11y (WCAG 2.2.2, giữ focus, heading), trang LCP chính, round 2 sửa thêm 2 collection dùng chung (`Projects.ts`, `PropertyPosts.ts`: hook afterChange/afterDelete mới) + hook revalidate dùng chung. Còn nguyên các file dùng chung từ round 1 (`guard-delete.ts`, `post-queries.ts`, `json-ld.ts`, `CtaBanner`, `ServiceCard`, `get-globals.ts`, `post-view.ts`).
- Blast radius: `/vi`, `/en`; mọi lần lưu/xoá `projects` và `property-posts` (admin, bulk, seed/script chạy ngoài Next); cache tag `global:homepage`; các mục round 1 (S09 related posts, CtaBanner/ServiceCard, guard xoá media, JSON-LD).

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 1967/1967 test PASS; 184/185 file. File lỗi duy nhất là `src/lib/contrast.test.ts` (0 test, lỗi do CRLF của worktree, BL-004, không liên quan diff). Log có `Invariant: static generation store missing in revalidatePath(...)` ở mức warn: hook revalidate chạy ngoài Next bị `try/catch` bắt rồi ghi log, có từ trước, không làm test fail. Lần chạy đầu bị cắt output nên tôi chạy lại một lần, ghi ra log để đọc tóm tắt |
| `pnpm build` | PASS (exit 0), `/[locale]` vẫn SSG |

## Đóng các MAJOR của round 1

| Round 1 | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1: 1 slide có video thì không có nút Dừng | **Đã đóng** | `HeroSlider.tsx:61-62` `showPauseButton = !reducedMotion && (multiple \|\| videoPlaying)`; điều khiển hiện khi `multiple \|\| showPauseButton` (`:160`), chấm chỉ hiện khi `multiple` (`:167`). Có test `HeroSlider.test.tsx:186` (bấm Dừng thì gọi `video.pause()`) và `:198` (mobile không dựng video thì không có nút) |
| MAJOR-2: mất focus khi bấm mũi tên lúc focus ở CTA | **Đã đóng** | `:86-87` chỉ xử lý mũi tên khi `event.target.closest("[data-carousel-control]")`. Chấm, Dừng/Phát, trước/sau nằm ngoài các slide bị `inert` nên focus giữ nguyên khi đổi slide. Có test `:129` |
| MAJOR-3: `h1` bị `aria-hidden`/`inert` theo slide | **Đã đóng** (lệch spec, xem MINOR-1) | `HomeBlocks.tsx:32` có `h1.sr-only` nằm ngoài `HeroSlider`; tiêu đề slide là `<p>` (`HeroSlider.tsx:146`). Có test `HomeBlocks.test.tsx:106,117` (luôn có đúng 1 `h1`, vẫn còn trong cây truy cập khi sang slide khác) và `HeroSlider.test.tsx:49` |
| MAJOR-4: ở 375px, 8 chấm chồng lên nút Dừng | **Đã đóng** | `:161` nút Dừng và chấm chung một flex `flex-col items-center sm:flex-row sm:justify-center`, nút Dừng đứng trước (MINOR-5 cũ cũng đóng). Tính ở dưới. Có test `:155,161` |
| MINOR-2 (`ul` cuộn không có tên) | Đã đóng | `ProjectsSlider.tsx:58`, `ServicesBento.tsx:20` có `aria-labelledby`; test `HomeBlocks.test.tsx:126` |
| MINOR-3 (vuốt không phân biệt cuộn dọc) | Đã đóng | `:100-102` cần `\|dx\| ≥ 50` và `\|dx\| > \|dy\|`; test `:138` |
| MINOR-4 (ẩn dự án/ưu đãi không làm mới trang chủ) | Đã đóng | Xem mục hook bên dưới |
| MINOR-1 (`payload-types.ts` chỉ đổi EOL) | **Chưa đóng** | `git diff --ignore-cr-at-eol --stat` rỗng, file vẫn ở trạng thái M (MINOR-3 bên dưới) |

### Đánh giá `h1` sr-only bằng tên site

- A11y: ổn. Trang luôn có đúng 1 `h1` và nó luôn nằm trong cây truy cập. Đây là cách WAI chấp nhận cho trang chủ có carousel.
- SEO: Google vẫn đọc `h1` được ẩn bằng `sr-only` (không bị coi là cloaking vì đúng là tên site). Nhưng `h1` chỉ có tên thương hiệu nên ít từ khoá hơn tiêu đề slide 1. `<title>` và JSON-LD WebSite/Organization đã mang tên site, nên `h1` mất phần lớn giá trị nội dung.
- So với design-spec: `.context/design-spec.md:284` ghi "`h1` là `title` của slide đầu (các slide sau dùng `p`)". Bản hiện tại lệch ý định này. Ý định đó chính là nguyên nhân MAJOR-3 nên lệch là hợp lý, nhưng chưa được ghi lại (MINOR-1).
- Đề xuất (không chặn): đặt nội dung `h1.sr-only` = `title` slide 1, không có thì dùng `siteName`. Như vậy giữ được từ khoá theo đúng ý spec mà vẫn nằm ngoài carousel. Không khuyên dùng `h1` hiển thị trong slide 1: dù chỉ bỏ `aria-hidden`/`inert` ở slide 1, slide đó vẫn phải ẩn/trơ khi không hiện, nên sẽ quay lại MAJOR-3.

## Hook `createRevalidateHomepageOnUnpublish` (collection dùng chung)

- Chỉ chạy khi bản ghi rời trạng thái công khai: `afterChange` cần `isPubliclyVisible(previousDoc) && !isPubliclyVisible(doc)` (gồm cả xoá mềm qua `deletedAt`); `afterDelete` chỉ khi bản bị xoá đang công khai. Tạo mới (`previousDoc` rỗng), xuất bản, sửa bản vẫn công khai, sửa nháp đều **không** gọi revalidate, nên không làm mới thừa. Test `revalidate-homepage-on-unpublish.test.ts` có 5 case; `property-posts.test.ts:431` vẫn PASS.
- Chạy ngoài Next (seed, script, integration test): `revalidateTagsWithNext`/`revalidateWithNext` có `try/catch` rồi `logger.warn` (`revalidate-global.ts:17`, `revalidate-content.ts:18`), không ném lỗi, không làm hỏng transaction lưu.
- Ẩn hàng loạt N bản ghi công khai sẽ gọi N lần cùng tag/path. `revalidateTag` idempotent nên chấp nhận được. Bài ưu đãi nổi bật bị ẩn có thể bị làm mới `/vi` `/en` hai lần (thêm `createRevalidateContent`), vô hại.
- Không bắt trường hợp bỏ `isFeatured` hoặc bỏ có EN khi bản vẫn `published` (ưu đãi fallback theo nổi bật): trang chủ trễ tối đa 60s theo ISR. Đã nêu là residual ở round 1, không chặn.
- `createProjects(revalidate, revalidateTags?)` / `createPropertyPosts(...)`: tham số thứ 2 không bắt buộc, chỗ gọi cũ vẫn chạy (typecheck PASS).

## Responsive Checklist Gate (diff đụng UI; xác minh bằng CSS math, không có browser)

Hero 8 slide: chấm `size-11` = 44px, 8 chấm = 352px; nút Dừng 44px. Hàng điều khiển `absolute inset-x-0 bottom-4` không có padding ngang.

| Mốc | Phép tính | Kết quả |
|---|---|---|
| 375 | `flex-col`: nút Dừng ở hàng trên (44), chấm ở hàng dưới 352 ≤ 375 (lề 11.5px mỗi bên); không chồng nhau, mỗi đích bấm đủ 44×44 | OK |
| 640 (sm) | `flex-row`: 44 + 352 = 396 ≤ 640 | OK |
| 768 | 396 ≤ 768 | OK |
| 1280 | 396 ≤ 1280; trước/sau `lg:inline-flex` ở `left-6`/`right-6`, giữa màn hình theo chiều dọc, không chạm hàng chấm | OK |

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Hàng chấm hero ≤ viewport từ 375 trở lên; ProjectsSlider < md ẩn mũi tên (`hidden md:inline-flex`), 6 chấm × 44 = 264 ≤ 343 (375 − 2·gutter); md: 44+16+264+16+44 = 384 ≤ 768 |
| Mobile-first `min-width` | OK | Chỉ dùng prefix `sm/md/lg` |
| Grid không cột cố định | OK | Không đổi so với round 1 |
| Container không fixed px | OK | Không đổi |
| Typography rem/fluid | OK | Token `text-display/lead`; tiêu đề slide đổi sang `p` nhưng giữ class |
| Media aspect-ratio / sizes | OK | Không đổi |
| Touch target ≥44px | OK | Các nút điều khiển đều `size-11`, không còn chồng nhau (bảng trên) |
| Nav mobile / Table | N/A | Không đụng |
| Không `100vh` đơn thuần | OK | `100svh` + `min-h-[560px]` |
| `prefers-reduced-motion` | OK | Ẩn nút Dừng khi không có gì chuyển động (không autoplay, không video); test `:171` |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` của hero chỉ cắt ảnh |

## Skill gates

- aislop: skip, chưa cài `aislop`.
- anti-slop/oxlint: skip, chưa cấu hình oxlint (không có `.oxlintrc.json`); ESLint PASS.
- open-code-review (ocr): skip, chưa cài `ocr`.
- AI-readable: OK. Có 1 indicator: `HeroSlider` khoảng 160 dòng trong 1 component, phần lớn là JSX (file 201 dòng ≤ 300). Tên rõ ràng, comment giải thích lý do (WHY), hằng `SWIPE_MIN_PX`/`CONTROL_SELECTOR` có tên. Dưới 3 indicator.
- ai-friendly-web: OK. `robots.txt`/`sitemap.xml`/`llms.txt` có trong build.
- blitzstrike: skip. Không có input/auth mới; hook mới chỉ gọi revalidate.

## Findings

Không còn CRITICAL/MAJOR.

### [MINOR-1] `h1` lệch design-spec S01 nhưng chưa được ghi lại; task file còn mô tả cũ
`tasks/tami-website/layer-9-task-01.md:110` vẫn ghi "`h1` ẩn bằng tên site khi slide 1 không có title", trong khi code đã luôn dùng tên site. Mục "Chưa làm / lệch so với spec" (`:114`) không nhắc lệch so với `.context/design-spec.md:284`.
Cách sửa: sửa dòng 110; thêm dòng lệch spec (h1 nằm ngoài carousel, lý do WCAG/MAJOR-3) để spec-validation layer 9 ghi gap hoặc cập nhật design-spec qua đúng luồng. Nên cân nhắc nội dung `h1.sr-only` = title slide 1, không có thì dùng `siteName` (xem phần đánh giá ở trên).

### [MINOR-2] Mobile: cụm điều khiển xếp dọc cao 88px, có thể chạm CTA khi hero thấp
`HeroSlider.tsx:142,161`: nội dung có `pb-24` (96px) và căn giữa theo chiều dọc. Ở 375px, cụm điều khiển chiếm từ 16px tới 108px tính từ đáy. Nội dung chỉ chạm cụm này khi chiều cao nội dung > H − 120px (H tối thiểu 560 thì nội dung phải > 440px). Hiếm gặp: tiêu đề dài, cộng phụ đề, cộng CTA, trên điện thoại thấp hoặc xoay ngang.
Cách sửa nếu muốn: `pb-32 sm:pb-24`.

### [MINOR-3] `src/payload-types.ts` chỉ đổi EOL (MINOR-1 round 1 vẫn còn)
Bỏ file này khỏi commit T01 để tránh conflict với T08/staging.

### [MINOR-4] Viewport < 352px (ngoài các mốc đã cấu hình)
Ở 320px, 8 chấm rộng 352px bị `overflow-hidden` cắt mỗi bên khoảng 16px; chấm ngoài cùng còn đích bấm khoảng 28px. Không thuộc các mốc kiểm (375+). Ghi residual.

## Residual risk

- Responsive/touch chỉ xác minh bằng CSS math, chưa chạy browser.
- Bỏ `isFeatured` hoặc EN khi bài vẫn `published` thì trang chủ còn trễ tối đa 60s (ISR).
- Từ round 1 còn: header trong suốt đè hero (S01.1) và khối Đối tác chưa làm, là gap cho spec-validation layer 9; i18n `page.home` (T01) sẽ conflict với `page.loading` (T08) khi merge; `contrast.test.ts` lỗi do CRLF (BL-004).

## Verdict

**PASS**. 4 MAJOR của round 1 đã đóng, có code và test. Hook mới trên `Projects`/`PropertyPosts` chỉ chạy khi bản ghi rời trạng thái công khai và an toàn khi chạy ngoài Next. Responsive gate OK ở 375/640/768/1280 với 8 slide. lint, typecheck, build PASS; test 1967/1967 PASS. Còn MINOR-1 và MINOR-3, nên xử lý khi close-out (task file, bỏ `payload-types.ts` khỏi commit).
