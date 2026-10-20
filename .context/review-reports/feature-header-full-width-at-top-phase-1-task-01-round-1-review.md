Agent: reviewer

# Review — feature-header-full-width-at-top · phase-1-task-01 · round 1 (BL-025, MODIFY)

- Review level: **STRICT**
- Reason: shared layout component (`HeaderFrame`) render trên mọi route `(frontend)`; thêm JS client (scroll state) + ràng buộc CLS/`--header-offset` mà hero, ProjectSubNav, scroll-margin, aside dính phụ thuộc.
- Blast radius: `src/components/layout/HeaderFrame.tsx` (server → client component), `Header.tsx` (docblock), `globals.css` (comment). Consumer của `--header-offset`/`.site-header` (không đổi, đã soát): `HeroSlider.tsx:105,133,165`, `HeroSearch.tsx:64`, `ProjectSubNav.tsx:84`, `ProjectDetail.tsx:38`, `ProjectSection.tsx:29`, `LegalPolicy.tsx:43`, `Documents.tsx:14`, `RichText.tsx:192`, `RentalDetail.tsx:148`, `SaleContactBox.tsx:71`, `JobDetail.tsx:85`, `ApplyFormSlot.tsx:25`, `TableOfContents.tsx:37`. Không đổi API/schema/data.
- Phạm vi diff: chỉ 5 file nêu trong task (`git diff -- <file>`); file dirty khác ngoài scope.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm vitest run src/components/layout src/lib/contrast.test.ts src/components/home` | PASS — 26 files / 237 tests |
| `pnpm lint` | PASS — 0 error, 2 warning sẵn có (`tools/task-dashboard/server.mjs`, ngoài scope) |
| `pnpm typecheck` (`tsc --noEmit`) | PASS — không lỗi |
| `pnpm test` đầy đủ | không chạy lại; integration test cần Postgres/Redis (đang tắt) — theo Builder 53 file `tests/integration/*` ECONNREFUSED, không tính FAIL |
| `pnpm build` / trình duyệt | không chạy (ngoài phạm vi reviewer) → residual |

## Trọng tâm kiểm

1. **CLS / chiều cao** — OK. `<header>` `h-(--header-offset)` cố định ở cả hai trạng thái; preflight Tailwind v4 `box-sizing: border-box` ⇒ padding 8/16 nằm trong 80/104px. Thanh `h-full` = content box của header (header có chiều cao xác định ⇒ % height resolve): phẳng 80/104, nổi 80−16=64 / 104−32=72, khớp hàng nội dung `h-16 lg:h-18`. `--header-offset` (5rem / 6.5rem ≥ lg, `globals.css:229-233`) không đổi; HeroSlider đo `.site-header` getBoundingClientRect → vẫn 80/104 ở cả hai trạng thái; mọi `top-*`/`scroll-mt-*` không cần đổi.
2. **Hình dạng hai trạng thái** — OK (theo đọc class). Phẳng: `p-0`, `max-w-full`, `rounded-none`, `shadow-none`, `w-full` ⇒ lấp đầy, không khe. Nổi: `data-[scrolled]:px-2/py-2`, `lg:data-[scrolled]:px-4/py-4`, `group-data-[scrolled]:max-w-[84rem] rounded-pill shadow-md` = như trước (`ab3f95a`). Specificity: `data-[scrolled]:*` → `.cls[data-scrolled]` (0,2,0) > `p-0` (0,1,0); `group-data-[scrolled]:*` → `.cls:is(:where(.group)[data-scrolled] *)` (0,2,0) > `rounded-none`/`shadow-none`/`max-w-full` (0,1,0) ⇒ thắng bất kể thứ tự. `lg:data-[scrolled]` vs `data-[scrolled]`: cùng specificity, v4 sort breakpoint variant sau ⇒ lg thắng ≥ lg. Xung đột `group`: grep `group-(hover|focus|data|aria|open|active|has)` trong toàn `src` — không có usage nào trong cây con header (DesktopNav, MobileMenu, LanguageSwitcher, BrandLogo, NavAnchor/button) ⇒ `group` mới trên `<header>` không gây kích hoạt ngoài ý muốn.
   - Bar thành `flex items-center`: hàng nội dung con có `w-full` (`Header.tsx:46`) ⇒ vẫn full-width, căn giữa dọc trong thanh 80/104 khi phẳng.
3. **Hydration** — OK. `useState(false)` ⇒ SSR và render client đầu đều không có `data-scrolled`; trạng thái thật chỉ set trong `useEffect` ⇒ không mismatch. `Header.tsx` (server) truyền `children` là JSX đã render (server elements) vào client `HeaderFrame` — hợp lệ RSC, không truyền function.
4. **Listener** — OK. `{ passive: true }`, gom bằng rAF (`frame` guard), `setScrolled` với cùng giá trị React tự bail-out, gỡ listener + `cancelAnimationFrame` khi unmount. `motion-reduce:transition-none` trên cả header và thanh. Rule nền `.site-header-bar` / `@supports backdrop-filter` / `prefers-reduced-transparency` không đổi (chỉ đổi comment) — `contrast.test.ts` PASS. `pointer-events-none` trên header + `pointer-events-auto` trên thanh ở cả hai trạng thái (phẳng: thanh phủ toàn header ⇒ toàn header bấm được, đúng ý).
5. **Test** — đủ acceptance: mặc định phẳng (không `data-scrolled`, class phẳng, không có bản vô điều kiện của `rounded-pill`/`shadow-md`), cuộn > 4 → `data-scrolled`, ≤ 4 / 0 → phẳng, đọc khi mount, passive + gỡ đúng handler. Giới hạn: jsdom chỉ khẳng định chuỗi class, không khẳng định CSS sinh ra (residual).

## Responsive Checklist Gate (diff đụng UI)

Không có trình duyệt — xác minh bằng CSS math ở 375 / 768 / 1280.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Phẳng: header `p-0`, thanh `w-full max-w-full` = 100% viewport; nổi: `w-full` trong content box (viewport − 16/32px), `max-w-[84rem]`. Không width cố định px. 375: thanh 375 / 359; 768: 768 / 752; 1280: 1280 / 1248. |
| Mobile-first media query | OK | Chỉ dùng `lg:` (min-width) trên base mobile. |
| Grid auto-fit/minmax | N/A | Diff không thêm grid. |
| Container không fixed px | OK | `max-w-[84rem]` (rem, như trước), `max-w-full`. |
| Typography rem / clamp | N/A | Diff không đổi chữ. |
| Spacing theo scale | OK | `px-2/py-2/px-4/py-4` scale Tailwind. |
| Media (img/video) | N/A | Không đổi. |
| Touch target ≥ 44px | OK (không đổi) | Hàng 64/72px, link `min-h-11`/`size-11` không đổi; thanh phẳng cao hơn (80/104) không thu nhỏ target. |
| Nav mobile hamburger | OK (không đổi) | MobileMenu < xl giữ nguyên. |
| Table scroll | N/A | — |
| Không `100vh` đơn thuần | OK | Không dùng vh trong diff. |
| `prefers-reduced-motion` | OK | `motion-reduce:transition-none` trên header + thanh. |
| Không che lỗi bằng `overflow:hidden` | OK | Không thêm overflow. |

## Skill gates

- `aislop`: skip — không nằm trong verify commands được allow của reviewer.
- `oxlint` (anti-slop): skip, oxlint not configured (repo dùng ESLint qua `pnpm lint`, 0 error).
- `ocr` (open-code-review): skip, ocr not installed / không trong allow list.
- AI-readable: OK — tên rõ (`SCROLLED_THRESHOLD_PX`, `sync`, `onScroll`), hàm < 50 dòng, file 47 dòng, không magic number (ngưỡng đặt hằng có comment lý do), comment giải thích WHY. 0 indicator.
- ai-friendly-web: N/A — không đổi robots/sitemap/llms.
- blitzstrike: N/A — không có bề mặt auth/input.

## Findings

- **[MINOR]** `src/components/layout/HeaderFrame.tsx:42` + `Header.tsx:46` — khi phẳng, hàng nội dung trải theo toàn viewport (chỉ đệm `px-3…xl:px-5`), khi nổi bị giới hạn 84rem. Ở viewport rộng (vd 1920px) logo/CTA dịch ngang ~288px mỗi bên khi chuyển trạng thái, và lúc phẳng logo sát mép không thẳng hàng container trang. Ở 1280 chỉ dịch 16px (chấp nhận được). Acceptance không cấm; đề xuất (tuỳ product) bọc nội dung trong `mx-auto max-w-[84rem]` ở trạng thái phẳng để chỉ nền phủ full-width còn nội dung đứng yên. Không chặn PASS.
- **[MINOR]** `HeaderFrame.test.tsx` — test chỉ khẳng định chuỗi class; việc Tailwind v4 sinh đúng `group-data-[scrolled]:`/`lg:data-[scrolled]:` chưa được kiểm bằng CSS thật. Đề xuất đo `.site-header` (80/104) và bounding thanh trước/sau cuộn ở 375/768/1280 khi có dev server (đã ghi residual trong task).

Không có CRITICAL / MAJOR.

## Residual risk

- Chưa kiểm trình duyệt: computed padding/radius/shadow hai trạng thái, chiều cao `.site-header` thực tế, transition max-width 100% → 84rem mượt, iOS bounce.
- Trang mở giữa chừng (reload khi đã cuộn) thấy phẳng rồi nổi sau hydrate — đã chấp nhận theo D3, không CLS.

## Verdict

✅ **PASS**
