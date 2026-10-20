# feature-homepage-redesign · phase-1-task-02 — Về TAMI (cụm ảnh + video YouTube + số liệu icon + nút) · thẻ Dự án nổi bật nền trắng + tim · banner tư vấn chữ trái (BL-044)

- Change doc: `spec/changes/2026-10-20-homepage-redesign.md` (BL-044). Spec: `SPECIFICATIONS.md` F1 "Bố cục theo mockup mới (BL-044)" mục Về TAMI / Dự án nổi bật / Banner tư vấn.
- **Mockup bắt buộc Read trước khi code:** `docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp` (phần Về TAMI HOMES → Dự án nổi bật → banner "Cần tư vấn bất động sản?").
- Phụ thuộc: **T01 xong** (field `about.*`, `stats[].icon`, `featuredProjects.{eyebrow,description}` đã có trong schema + view model + `strength-icons.ts`).
- Trạng thái: `pending`.

## Ràng buộc user
Như T01: bố cục đúng ảnh; giữ màu/token/font/element (Button, Badge, Dialog `src/components/ui/dialog.tsx`, icon Phosphor, `useSnapSlider`/`SliderArrow`); không hex/kiểu mới. Quyết định đã chốt: **tim chỉ trang trí** (`aria-hidden`, không state/click); **nút play mở YouTube trong Dialog**, không link → ẩn nút.

## Classification / Risk
- Type: **MODIFY** (đổi bố cục/thẻ 3 khối có sẵn).
- Risk: **MEDIUM** — `ProjectsSlider` dùng `useSnapSlider` (BL-038, đã fix bug), `layout/CtaBanner` dùng chung với S14 dịch vụ (thêm prop `align`, mặc định không đổi), iframe YouTube (CSP/privacy: dùng `youtube-nocookie.com`, chỉ nạp khi mở).
- Expected review level: **STRICT** (shared component `layout/CtaBanner`, slider đã có bug trước đó, iframe bên thứ ba).
- Blast radius: trang chủ; `/dich-vu/[slug]` (CtaBanner); test `ProjectsSlider.test.tsx`, `HomeBlocks.test.tsx`, `src/components/layout/CtaBanner.test.tsx`, `home-view.test.ts`.
- Doc impact: design-spec S01 mục 2/3/7 (reconcile T03); `docs/DESIGN.md`? chỉ nếu đổi hành vi dùng chung (CtaBanner align) → ghi 1 dòng.

## Scope / files
1. **AboutBlock** `src/components/home/AboutBlock.tsx` (Server Component + island nhỏ cho video):
   - ≥ lg `grid-cols-12`: cột 1–6 cụm ảnh: ảnh lớn `about.image` (bo `rounded-xl` 20px, 4:5, `ResponsiveImage`), ảnh nhỏ `secondaryImage` (bo 20px, ~40% rộng, đè góc trên trái lệch ra ngoài mép ảnh lớn như ảnh, `absolute`), thẻ chú thích trắng (`bg-surface rounded-lg shadow-md p-5`, chữ `text-small whitespace-pre-line`, nút tròn `ArrowRight` `aria-hidden`) đè góc dưới trái; **nút play** (`AboutVideoButton` client: nút tròn `bg-primary text-primary-foreground` icon `Play` + chữ `videoLabel` on-dark trên dải scrim đáy ảnh lớn) → mở `Dialog` (`DialogTitle` sr-only = videoLabel — Radix bắt buộc; `iframe` `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0`, `allow="autoplay; encrypted-media; picture-in-picture"`, `title`; 16:9, chỉ render khi `open`; đóng Esc/nút X/click ngoài). Hàm `youtubeVideoId(url)` thuần trong `src/lib/home/youtube.ts` + test (watch?v=, youtu.be/, /embed/, có tham số thừa, URL sai → null); view model trả `videoId` (T01 đã map `videoUrl` → builder T02 đổi thành id nếu T01 chưa).
   - Cột 7–12: eyebrow (`text-eyebrow uppercase tracking-[0.12em] text-accent-text`) → `h2 text-h2`: `title` + ` ` + `<span class="text-accent-text">titleAccent</span>` → `RichText content text-text-secondary` → `dl` số liệu 2 cột: ô tròn 56px `bg-primary-subtle` icon (`strength-icons.ts`, thiếu icon → không ô) + `dd text-h2` + `dt text-small text-text-muted` → Button primary `ctaLabel` + `ArrowRight` → `ctaLink` (thiếu → ẩn).
   - `decorImage`: `absolute right-0 inset-y-0 hidden xl:block w-[22%] opacity-…` (chỉ dùng token opacity sẵn có; nếu không có → không mờ), `aria-hidden`, `pointer-events-none`, không đè chữ.
   - < lg: eyebrow + h2 → cụm ảnh (ảnh lớn 4:3, ảnh nhỏ ẩn hoặc thu nhỏ, thẻ chú thích dưới ảnh) → nội dung → số liệu 2 cột → nút.
2. **ProjectsSlider** `src/components/home/ProjectsSlider.tsx`: thẻ `w-[82%] sm:w-[320px] lg:w-[272px]` (≈ 5 thẻ/1280 khung + gap 16px — đo lại để khớp ảnh "5 thẻ, thẻ thứ 5 hé"), thẻ trắng `rounded-xl border border-border bg-surface overflow-hidden`: ảnh 4:3 (`ResponsiveImage decorative`, zoom hover giữ) + `Badge` trạng thái góc trên trái + **tim** (`Heart` Phosphor — thêm vào `icons.ts`; `span aria-hidden` ô tròn 40px `bg-surface text-text`) góc trên phải; thân `p-4`: `h3 text-h4 font-semibold line-clamp-2 min-h-[2lh]` (BL-037 giữ, hover `text-accent-text` BL-034), hàng cuối `flex justify-between`: `MapPin` + tỉnh (`text-small text-text-muted`) · nút tròn 40px `bg-primary-subtle text-accent-text` `ArrowRight` (`aria-hidden`, trong link). **Bỏ** `glass-panel` + `ProjectStats` (xoá component nếu không còn dùng, xoá i18n `page.home.projects.stats` chỉ nếu không nơi nào dùng — kiểm grep). Điều khiển mũi tên + chấm ở giữa dưới (giữ `useSnapSlider`, BL-038). `FeaturedProjects.tsx`: đầu khối căn giữa eyebrow (từ view) → h2 + gạch ngắn `h-0.5 w-12 bg-primary` dưới → mô tả (`text-lead text-text-secondary max-w-[60ch]`) → slider → Button `ghost` "Xem tất cả dự án" + `ArrowRight`.
3. **CtaBanner** `src/components/layout/CtaBanner.tsx`: prop `align?: "center" | "start"` (mặc định `center` — S14 không đổi); `start` → `items-start text-left` + khung `max-w-container`; `src/components/home/CtaBanner.tsx` truyền `align="start"`. Nội dung mockup "Cần tư vấn bất động sản?" / mô tả / nút "Nhận tư vấn" là dữ liệu admin (`ctaBanner.title/description/ctaLabel`) — không hardcode.
4. **Tests**: `youtube.test.ts`; `AboutBlock` test mới (render eyebrow/accent, nút play chỉ khi có videoId, Dialog mở → iframe `youtube-nocookie`, stats icon); `ProjectsSlider.test.tsx` (không còn glass/stats, tim `aria-hidden`, link duy nhất/thẻ, chấm/mũi tên BL-038 giữ); `CtaBanner.test.tsx` (align mặc định center, start → class trái); `no-raw-colors.test`.

## Acceptance
- [ ] 1440: khối Về TAMI khớp ảnh (cụm ảnh chồng trái + thẻ chú thích + nút play; eyebrow/tiêu đề 2 màu/mô tả/2 số liệu icon/nút phải; ảnh toà nhà trang trí mép phải) — đối chiếu ảnh.
- [ ] Bấm "Khám phá TAMI HOMES" mở Dialog video YouTube, đóng được; xoá link trong admin → nút biến mất; link sai → admin báo lỗi validate.
- [ ] Dự án nổi bật: eyebrow + tiêu đề + mô tả căn giữa; ~5 thẻ trắng (ảnh + badge + tim + tên + ghim + nút mũi tên); mũi tên/chấm giữa dưới đi đúng 1 vị trí (BL-038); "Xem tất cả dự án →".
- [ ] Tim: không focus/click/state (`aria-hidden`, không `button`).
- [ ] Banner tư vấn chữ trái; `/dich-vu/<slug>` CTA vẫn căn giữa.
- [ ] 390: Về TAMI xếp dọc, thẻ dự án vuốt ngang 82%, banner chữ trái; không tràn ngang.
- [ ] Mọi chữ mới từ admin, `/en` thiếu EN → ẩn phần tử đó (eyebrow/caption/accent/nhãn nút) — không lấy chữ Việt.
- [ ] Không hex/kiểu mới; AA; `pnpm test`/`typecheck`/`lint` PASS.

## Verify
`pnpm vitest run src/components/home src/components/layout src/lib/home` → `pnpm typecheck` → `pnpm lint` → xem http://localhost:3000 (không chạy thêm dev server) 1440/390, chụp đặt cạnh mockup.

## Retry / Escalation
Như T01 (3 attempt → `architecture_review_needed`). Mỗi fail append `.context/error-memory.md`.

## Verification summary (builder điền)
- Acceptance criteria: đã đối chiếu 1440 với mockup (cụm ảnh + chú thích + play + 2 số liệu icon + nút; thẻ dự án trắng + badge + tim + ghim + nút mũi tên, ~5 thẻ, mũi tên/chấm giữa dưới, "Xem tất cả dự án"; banner chữ trái). 375: không tràn ngang (scrollWidth = 375), About xếp dọc, thẻ dự án 82% vuốt. Dialog video: test mở/đóng + iframe chỉ dựng khi mở. Tim aria-hidden SPAN. S14 vẫn center (test align). Chữ mới ẩn khi thiếu (test EN).
- Verify commands + result: `pnpm vitest run src/components/home src/components/layout src/lib/home src/components/ui src/i18n` 38 files / 336 tests PASS · `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs) · `pnpm test` 304 files / 3195 tests PASS. Ảnh: `.context/review-reports/assets/homepage-redesign-t02-{1440,390}.png` (chụp bằng Edge headless; Edge headless có chiều rộng tối thiểu ~500 nên bản 390 có thể bị cắt ngang, mobile đã kiểm lại bằng Browser pane 375).
- Tái dùng `parseVideoUrl` (T01 đã map `videoEmbedUrl` youtube-nocookie), nên KHÔNG tạo `src/lib/home/youtube.ts` mới. Dữ liệu mẫu (about.* + ctaBanner.image + featuredProjects.eyebrow/description, locale vi) nhập vào DB DEV qua Local API; không commit.
- Lệch so với mockup + lý do: (1) Ảnh lớn About để vuông (aspect-square), ảnh thẻ dự án 11:10 thay vì 4:5 / 4:3 trong task — mockup đo được ~1:1 và ~1.09:1, theo mockup. (2) Ảnh toà nhà trang trí rộng 9% (task ghi 22%) vì mockup chỉ hé ~120px mép phải; 22% đè lên chữ ở 1440. (3) Mô tả Dự án nổi bật max-w 80ch (task 60ch) để 1 dòng như mockup. (4) Nút play nằm trên dải scrim `bg-banner-scrim` đơn sắc (token có sẵn) thay vì gradient trong mockup (không thêm kiểu mới). (5) Vòng icon/nút mũi tên dùng `bg-primary-soft` (không phải primary-subtle như task) theo bài học review T01. (6) Nền thẻ chú thích/mảng nền be phía sau ảnh phụ trong mockup không dựng (trang trí, không token). (7) `projects.viewAll` đổi thành "Xem tất cả dự án"/"View all projects" theo mockup; xoá i18n `page.home.projects.stats` (không còn nơi dùng); `ProjectSlideView.stats` còn trong view model nhưng không còn được render (để nguyên, ngoài phạm vi dọn).
- Reviewer verdict: …
