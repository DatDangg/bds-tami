# feature-news-list-detail-v2 · phase-1-task-01 — Danh sách Tin tức: "Đọc nhiều" → "Được quan tâm nhiều" / "Most popular", "Bản tin thị trường" lên trên, nhãn thẻ nổi bật "TAMI REAL ESTATE"

- Nguồn: BL-062 · change doc `spec/changes/2026-10-22-news-list-detail-v2.md` (yêu cầu 1 + đoạn "Đổi tác giả"; Quyết định Q1). Spec delta: `SPECIFICATIONS.md` khối "Tin tức v2 (BL-062)".
- Áp `/tin-tuc`, `/tin-tuc/danh-muc/[category]`, `/en/news` (+ danh mục EN). Không đổi schema / API / URL / dữ liệu top 5.
- **AUTO PROCEED** (user "tự quyết, đừng hỏi"): builder không hỏi; chỗ mơ hồ tự chọn phương án đơn giản nhất rồi ghi vào Verification summary.
- KHÔNG làm phần chi tiết tin (T02).

## Classification / Risk
- Type: **MODIFY** (S10 BL-054 — đổi nhãn + thứ tự khối cột phải).
- Risk: **LOW** — chỉ chữ i18n + thứ tự 2 phần tử JSX + 1 nhãn thẻ nổi bật. Không shared component logic, không schema/API/auth.
- Expected review level: **FAST** (reviewer tự chọn).
- Blast radius: `src/components/news/NewsListPage.tsx:68` (nhãn log `orEmpty` "Đọc nhiều"), `:133-137` (sidebar thứ tự); `src/components/news/NewsMostRead.tsx` (JSDoc :7); `src/components/news/NewsFeaturedBlock.tsx:15,37` (nhãn `t("brand")`); `src/i18n/messages/vi.json:219` (`page.news.v2.brand`), `:230` (`mostRead`), `en.json` tương ứng; test `src/components/news/NewsListPage.test.tsx:215-230,326`, `news-components.test.tsx:115-121`.

## Hiện trạng (file:line — không spawn Explore)
- `NewsListPage.tsx:133-137` `sidebar={<> <NewsMostRead/> <NewsletterSignup/> <NewsTopics/> </>}` — `NewsListBody` đặt cột phụ ≥ lg bên phải, < lg dưới lưới (cùng thứ tự DOM).
- `NewsMostRead` tiêu đề `t("mostRead")` namespace `page.news.v2`: vi "Đọc nhiều", en "Most read".
- `NewsFeaturedBlock.tsx:37` nhãn `t("brand")` = "TAMI HOMES" (vi.json:219, en tương ứng) — chỉ dùng ở thẻ nổi bật (Grep xác nhận trước khi đổi; nếu key `brand` dùng nơi khác thì tạo key mới `featuredBrand` thay vì đổi key chung).

## Scope
1. Thứ tự cột phải: `NewsletterSignup` → `NewsMostRead` → `NewsTopics` (DOM cũng là thứ tự < lg).
2. i18n `page.news.v2.mostRead`: vi **"Được quan tâm nhiều"**, en **"Most popular"**; nhãn log `orEmpty` đổi tương ứng ("Được quan tâm nhiều"); JSDoc `NewsMostRead` + `NewsListPage` cập nhật tên khối.
3. Nhãn thương hiệu thẻ nổi bật lớn: vi + en **"TAMI REAL ESTATE"** (Q1).
4. Test (TDD — sửa test trước, fail rồi pass): `NewsListPage.test.tsx` — region "Được quan tâm nhiều"; thứ tự trong cột phụ: bản tin (`[data-newsletter]`) đứng TRƯỚC khối "Được quan tâm nhiều" (`compareDocumentPosition`), "Chủ đề" sau cùng; bản EN (nếu test có locale en) "Most popular". `news-components.test.tsx:115-121` nhãn "TAMI REAL ESTATE".
5. Kiểm thị giác (Browser pane, dev server sẵn có :3000 nếu đang chạy; không có thì `tami-dev` trong `.claude/launch.json`): `/tin-tuc` 1440 + 390, `/en/news` 1440 — chụp `.context/review-reports/assets/bl062-p1t01-<màn>-<w>.png`. Không chạy được → ghi residual, không bịa.
6. Doc impact (as-built, builder sửa): `.context/design-spec.md:573` (S10 cột phải: thứ tự + tên mới; thêm "As-built BL-062"), `docs/DESIGN.md:245` (Tin tức: "Bản tin thị trường" · "Được quan tâm nhiều" · "Chủ đề", nhãn thẻ nổi bật "TAMI REAL ESTATE"). KHÔNG sửa `SPECIFICATIONS.md` / `spec/**`.
7. Verify (`.context/project-config.md`): `pnpm typecheck` · `npx eslint <file scope>` · `pnpm test` (đủ bộ, chờ xong) · `pnpm build` (nếu dev server đang chạy và build xung đột `.next`, ghi rõ; ưu tiên chạy được).
8. **KHÔNG commit / stage.** Không đụng file dirty ngoài scope: `.claude/*`, `.context/project-config.md`, `CLAUDE.md`, `opencode.jsonc`, `src/app/(payload)/admin/importMap.js`, `src/payload-types.ts`, `template-feedback.md`, `spec/changes/2026-10-22-seed-english-data.md`, `spec/changes/2026-10-22-news-careers-followups.md`.
9. Ghi `## Verification summary` cuối file này trước khi trả report. Report mở đầu `Agent: builder`.

## Acceptance
- [ ] `/tin-tuc` + `/en/news`: tiêu đề "Được quan tâm nhiều" / "Most popular"; "Bản tin thị trường" nằm trên khối đó (≥ lg cột phải và < lg dưới lưới).
- [ ] Thẻ nổi bật lớn: "TAMI REAL ESTATE".
- [ ] Test cập nhật PASS; typecheck + eslint (scope) + test + build PASS; design-spec + DESIGN.md as-built.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary
- Builder: builder · AUTO PROCEED, không commit/stage.
- Đã làm: cột phải `NewsListPage` đổi thứ tự `NewsletterSignup` → `NewsMostRead` → `NewsTopics`; i18n `page.news.v2.mostRead` vi "Được quan tâm nhiều" / en "Most popular"; `page.news.v2.brand` (chỉ dùng ở `NewsFeaturedBlock`, Grep xác nhận) → "TAMI REAL ESTATE" vi + en; nhãn log `orEmpty` + JSDoc (`NewsListPage`, `NewsMostRead`, `NewsFeaturedBlock`, `NewsListBody`) cập nhật; as-built `.context/design-spec.md` (S10 + dòng "As-built BL-062") và `docs/DESIGN.md` (Tin tức).
- Test (sửa trước, đỏ 3 fail → xanh): `NewsListPage.test.tsx` (region "Được quan tâm nhiều", `compareDocumentPosition` bản tin → khối → "Chủ đề", EN "Most popular"), `news-components.test.tsx` (nhãn "TAMI REAL ESTATE", tên khối).
- Verify: `pnpm typecheck` PASS · `npx eslint src/components/news` PASS (0 lỗi) · `pnpm test` PASS 4406/4406 · `pnpm build` PASS.
- Trình duyệt (dev :3000): `/tin-tuc` DOM cột phải = [Bản tin, Được quan tâm nhiều, Chủ đề], có chữ "TAMI REAL ESTATE". `/en/news` dữ liệu dev không có tin EN/most-read nên khối ẩn (đã phủ bằng unit test EN).
- Residual: KHÔNG lưu được ảnh `bl062-p1t01-*.png` (Browser tool không ghi file ảnh ra đĩa) — chỉ xác minh DOM; không bịa ảnh. Không đo thị giác 1440/390.
- Ghi chú: file CRLF nên Edit nhiều dòng qua node không khớp lần đầu; đã sửa lại bằng Edit.
