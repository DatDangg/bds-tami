# feature-rental-share-buttons-s09 · phase-1-task-01 — chia sẻ đầu bài theo S09 (Web Share < sm, dính trái ≥ xl) cho chi tiết Đăng tin BĐS

- Change doc: `spec/changes/2026-10-19-rental-share-buttons-s09.md` (BACKLOG BL-007)
- Nguồn: nợ thiết kế L8-T04 (decision log "Chưa làm"), D4 spec-validation layer 8
- Spec: `SPECIFICATIONS.md` F4 (câu chia sẻ mới), `.context/design-spec.md` S09 bước 2 + bảng responsive (đã làm rõ ở spec delta)
- Lưu ý tên: slug "rental-…" là tên backlog; trang thực tế là **Đăng tin BĐS** (`property-posts`), KHÔNG phải tin cho thuê.

## Xác minh route/template (change-request đã đọc code)
- Route: `src/app/(frontend)/[locale]/tin-bds/[slug]/page.tsx` (`/tin-bds/[slug]`, `/en/property-news/[slug]`) → render `src/components/posts/PostDetail.tsx` (template riêng S09).
- Tin tức chi tiết (S11) KHÔNG dùng `PostDetail`: `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:140` tự render `<ShareButtons>` ở footer cuối bài (đúng S11 "Cuối bài: … chia sẻ"). Tuyển dụng `src/components/careers/JobDetail.tsx:111` cũng dùng `ShareButtons` trong aside.
- Hiện trạng S09: `PostDetail.tsx` footer sau `LeadFormSlot` render `<ShareButtons>` (cuối bài) — sai S09.

## Classification / Risk
- Type: **MODIFY** (đổi vị trí + hành vi responsive của chia sẻ ở trang chi tiết Đăng tin BĐS)
- Risk: **LOW-MEDIUM** — một trang công khai; component mới client; KHÔNG đổi API/schema. Rủi ro: làm vỡ tin tức/tuyển dụng nếu sửa `ShareButtons` dùng chung → **phạm vi an toàn: không đổi hành vi/markup mặc định của `ShareButtons`** (chỉ được thêm prop tuỳ chọn có default giữ nguyên, hoặc tách phần dùng chung). Trang chi tiết phải vẫn SSG/ISR (không đọc `headers`/`searchParams`, không `useSearchParams`).
- Review level expected: NORMAL (UI công khai, component dùng chung chỉ được chạm theo cách tương thích ngược).

## Thiết kế (gợi ý — builder chốt theo code thật)
- Component client mới (vd `src/components/posts/PostShare.tsx`): nhận `url?`, `title`.
  - < sm: 1 nút "Chia sẻ / Share" (min 44px). Bấm: có `navigator.share` → `navigator.share({ title, url: url ?? location.href })`; `AbortError` (người dùng huỷ) → không làm gì; không có API hoặc lỗi khác → mở menu (Facebook, Zalo, sao chép link). Menu: nút `aria-expanded` + `aria-controls`, Esc / bấm ra ngoài đóng và trả focus về nút; không bẫy focus.
  - sm → < xl: hàng ngang Facebook / Zalo / sao chép link (tái dùng logic `ShareButtons` — link mở tab mới, không SDK bên thứ ba; sao chép báo qua `aria-live`).
  - ≥ xl: cụm dọc dính lề trái cột chữ (`sticky`, top dưới header sticky ~ `top-24`), icon có `aria-label`; chỉ trong vùng đầu bài → hết nội dung/thư viện ảnh (không đè form lead, bài liên quan). Cách gợi ý: bọc header+ảnh bìa+nội dung trong 1 container `relative`, rail `hidden xl:block absolute` ở lề trái với con `sticky`. Không để 2 cụm cùng hiển thị ở một breakpoint (bản ẩn dùng `hidden`/display none để khỏi lặp trong cây a11y).
  - Zalo không có icon trong `@/components/icons` → nếu cần icon dùng chữ/glyph đơn giản, giữ `aria-label`.
- `PostDetail.tsx`: đặt cụm chia sẻ ở `<header>` sau ngày đăng; **bỏ** `<footer>` ShareButtons cuối bài; cập nhật doc comment bố cục.
- i18n VI/EN: tái dùng `page.news.share.*`; thêm khoá mới (vd `share.button` "Chia sẻ"/"Share", `share.menu`) vào **cả** `src/i18n/messages/vi.json` + `en.json` (test `messages-check` phải PASS). Có thể đặt dưới `page.posts.share` hoặc mở rộng `page.news.share` — builder chọn, ghi lại.
- KHÔNG sửa `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, `JobDetail.tsx`.

## Acceptance
- [ ] Chia sẻ ở đầu bài (sau tiêu đề/ngày), không còn bản ở cuối bài
- [ ] < sm: 1 nút "Chia sẻ / Share" gọi `navigator.share` khi có; không có / lỗi (trừ huỷ) → menu Facebook, Zalo, sao chép link
- [ ] ≥ xl: cụm dính lề trái khi cuộn; sm–xl hàng ngang
- [ ] Tin tức (S11) + tuyển dụng dùng `ShareButtons` không đổi markup/hành vi (test hiện có PASS); i18n VI/EN; a11y label/`aria-expanded`
- [ ] Test component (share API có/không/huỷ, menu mở/đóng Esc, copy) + test `PostDetail` (vị trí đầu bài, không còn cuối bài); `pnpm lint`/`typecheck`/`test`/`build` PASS; route `/[locale]/tin-bds/[slug]` vẫn ● SSG/ISR

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Test fail sẵn không tính: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400".
- Reviewer: impeccable + frontend-checklist + responsive-web; kiểm trình duyệt 375/768/1280 nếu dev server chạy được.
- Report: `.context/review-reports/feature-rental-share-buttons-s09-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary

**Thiết kế chốt (builder):**
- `src/components/posts/PostShare.tsx` (client) export 2 component:
  - `PostShare` (đặt trong `<header>` sau `<time>`): cụm `compact` (`sm:hidden`) = 1 nút "Chia sẻ / Share" (`aria-expanded`/`aria-controls`, icon `ShareNetwork`) gọi `navigator.share({ title, url })`; không có API → mở menu; reject `name === "AbortError"` → bỏ qua; lỗi khác → mở menu. Menu in-flow ngay dưới nút (`role=group` "Cách chia sẻ"), gồm Facebook, Zalo (chỉ khi có `url`), sao chép (+ `aria-live`); Esc đóng + trả focus về nút; `pointerdown` ngoài đóng. Cụm `row` (`hidden sm:block xl:hidden`) tái dùng nguyên `ShareButtons`.
  - `PostShareRail` (`hidden xl:block absolute inset-y-0 left-[calc(50%-var(--container-text)/2)]`, con `sticky top-24 -translate-x-[calc(100%+1rem)]`): icon Facebook / "Zalo" (chữ, không có icon Phosphor) / `LinkSimple`→`Check` sao chép, `aria-label`, status `sr-only`; nền `bg-surface` + viền vì khi cuộn qua ảnh bìa 1024px rail đè mép ảnh. Đặt trong wrapper `relative` bao header → ảnh bìa → nội dung/thư viện (không bao form lead/bài liên quan).
- Tách `useCopyLink(url)` ra `src/components/news/use-copy-link.ts`; `ShareButtons` dùng hook này, markup/hành vi/props không đổi (test news PASS nguyên vẹn). Không sửa `tin-tuc/[slug]/page.tsx`, `JobDetail.tsx`.
- `src/components/icons.ts` thêm `LinkSimple`, `ShareNetwork` (Phosphor).
- i18n: tái dùng `page.news.share.*`; thêm `page.posts.share.button` ("Chia sẻ"/"Share") + `page.posts.share.menu` ("Cách chia sẻ"/"Share options") ở cả vi + en.
- Không thêm chuyển động (menu toggle bằng `hidden`) → không cần xử lý `prefers-reduced-motion` mới.

**File đổi:** `src/components/posts/PostShare.tsx` (mới), `src/components/posts/PostShare.test.tsx` (mới), `src/components/news/use-copy-link.ts` (mới), `src/components/posts/PostDetail.tsx`, `src/components/news/ShareButtons.tsx` (refactor nội bộ), `src/components/icons.ts`, `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`, `src/app/(frontend)/[locale]/tin-bds/[slug]/page.test.tsx`.

**Test (TDD):**
- Trước code: `PostShare.test.tsx` FAIL (module chưa có); `page.test.tsx` test mới FAIL (không có nút "Chia sẻ" trong header).
- Sau code: `PostShare.test.tsx` 10/10 PASS (share có API, AbortError bỏ qua, lỗi khác → menu, không API → menu + Esc trả focus, bấm ngoài đóng, sao chép EN, không URL chỉ sao chép, class breakpoint mỗi cụm, rail sticky + aria-label + sao chép); `page.test.tsx` PASS (chia sẻ trong header sau `<time>`, trước form lead, không `article > footer`, rail cùng wrapper với header + nội dung, không bao form lead); `news-components.test.tsx` + `post-components.test.tsx` PASS nguyên vẹn.
- Fix 1 lần trong lúc TDD: `DOMException` jsdom không `instanceof Error` → `isUserCancel` so `name`.

**Verify commands:**
- `pnpm lint` → PASS (exit 0)
- `pnpm typecheck` → PASS (exit 0)
- `pnpm test` → 231/232 file, 2467/2468 test PASS; 1 fail duy nhất là fail sẵn ngoài scope: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … → 400"
- `pnpm build` → PASS (exit 0); route table: `├ ● /[locale]/tin-bds/[slug]` (● SSG, generateStaticParams) — vẫn SSG/ISR
- oxlint: repo không có config oxlint → skip.

**Kiểm trình duyệt:** dev server local chạy được nhưng DB local không có bài Đăng tin BĐS đã xuất bản (`/tin-bds` chỉ có link danh mục) → chưa xem được trang chi tiết thật ở 375/768/1280. **Residual risk:** vị trí rail ≥ xl (`left-[calc(50%-var(--container-text)/2)]` + translate) chưa soi bằng mắt; reviewer nên kiểm nếu có dữ liệu.

**Round 1 fix (sau review round 1 FAIL — MAJOR-1 + MINOR-1..4):**
- MAJOR-1: wrapper rail thêm `z-(--z-raised)` (token 10 trong `globals.css`, dưới `--z-header` 30 nên header dính vẫn che rail) → ảnh bìa (positioned, sau trong DOM) không còn vẽ đè rail. Vì wrapper `absolute inset-y-0` cao suốt vùng bài và giờ nằm trên ảnh, thêm `pointer-events-none` ở wrapper + `pointer-events-auto` ở cụm nút sticky để cột trống không chặn click ảnh bìa.
- MINOR-1: wrapper ngoài `PostShare` thêm `xl:hidden` (hết khoảng trống 16px dưới ngày đăng ở ≥ xl).
- MINOR-2: `PostShareRail` chuyển xuống SAU `<header>` trong `PostDetail.tsx` (vẫn trong wrapper `relative`, trước ảnh bìa) → Tab gặp `h1` trước; `absolute inset-y-0` nên sticky vẫn bắt đầu từ đầu bài, vị trí hiển thị không đổi.
- MINOR-3: glyph Zalo rail `text-xs` → token `text-xsmall`.
- MINOR-4: `title` link Facebook/Zalo trong `PostShare` (menu gọn + rail) đổi từ tiêu đề bài sang nhãn hành động (`t("facebook")`/`t("zalo")`); `ShareButtons` KHÔNG đổi. `PostShareRail` không còn dùng `title` → props thu về `Pick<PostShareProps, "url">`, `PostDetail` bỏ truyền `title` cho rail.
- Test (TDD, FAIL trước → PASS sau): `PostShare.test.tsx` thêm assert `z-(--z-raised)` + `pointer-events-none/auto`, `title` link rail = nhãn hành động, Zalo `text-xsmall`, wrapper ngoài `xl:hidden` (11 test); `page.test.tsx` thêm assert rail đứng sau `<header>` trong DOM.
- Verify: `pnpm lint` PASS (0 warning) · `pnpm typecheck` PASS · `pnpm test` 231/232 file, 2468/2469 (fail duy nhất là fail sẵn `job-applications` "vị trí hết hạn → 400") · `pnpm build` PASS, route `├ ● /[locale]/tin-bds/[slug]` vẫn ●. CSS build có `z-index:var(--z-raised)`.
- Kiểm trình duyệt 1280 (cuộn qua ảnh bìa): vẫn chưa làm được vì DB local không có bài Đăng tin BĐS đã xuất bản (residual risk giữ nguyên; lý thuyết z-order đã được sửa đúng theo phân tích của reviewer).

**Quyết định tự chọn:** (1) bấm ngoài chỉ đóng menu, không kéo focus về nút (tránh cướp focus khỏi phần tử người dùng vừa bấm); Esc mới trả focus. (2) Bấm nút khi menu đang mở → đóng menu (toggle) thay vì gọi lại `navigator.share`. (3) Menu dự phòng in-flow (không dropdown absolute) để khỏi bị cắt/đè ở mobile. (4) Khoá mới đặt dưới `page.posts.share`, chuỗi dùng chung giữ ở `page.news.share`.

## Doc impact / Reconcile
- Intent (qua change request BL-007): `SPECIFICATIONS.md` F4 (câu chia sẻ đầu bài), `.context/design-spec.md` S09 bước 2 + bảng responsive (thêm mốc 640).
- As-built: `docs/ARCHITECTURE.md` danh sách component (posts/ thêm PostShare, news/ thêm use-copy-link). Không đổi API/schema/ERD.
- Spec publish: spec_version 1.5.0 → 1.6.0 (MINOR), `spec/updates/2026-10-19-rental-share-buttons-s09.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` scopeVersion 6 (trigger feature-update).
- Gap L8 D4b (spec-validation layer 8) → đã xử lý bởi BL-007.

## Review
- Round 1 NORMAL FAIL — `.context/review-reports/feature-rental-share-buttons-s09-phase-1-task-01-round-1-review.md` (MAJOR-1 ảnh bìa đè rail ≥ xl; 4 MINOR).
- Round 2 NORMAL PASS — `.context/review-reports/feature-rental-share-buttons-s09-phase-1-task-01-round-2-review.md` (đóng đủ 5 finding, không finding mới).

## Quyết định change-request
- Phạm vi an toàn: chỉ template S09 (`PostDetail`); tin tức S11 (`tin-tuc/[slug]/page.tsx`) và tuyển dụng (`JobDetail`) giữ `ShareButtons` cuối bài/aside như cũ — `ShareButtons` chỉ refactor nội bộ (hook `use-copy-link`), props/markup không đổi. S11 ghi "Responsive như S09" nhưng đặt chia sẻ "cuối bài" → không áp Web Share/rail cho tin tức trong change này (cần change request riêng nếu muốn).
- Bump MINOR (spec-publisher theo `docs/SPEC_VERSIONING.md`: đổi hành vi hiển thị so với code).

## Residual risk
- Chưa kiểm trình duyệt thật 375/768/1280: dev DB không có bài Đăng tin BĐS đã xuất bản và khởi động preview dev server bị từ chối quyền (đã tạm publish 1 bài rồi khôi phục nguyên trạng). Cần soi trên staging: rail ≥ xl nằm trên ảnh bìa khi cuộn, trượt dưới header dính, bấm được; nút Share < sm trên iOS/Android thật.
- Tin tức chi tiết (S11) vẫn chưa có Web Share < sm / rail — xem quyết định phạm vi.

