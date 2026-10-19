# feature-public-ui-market-vinhomes · phase-2-task-05 — Restyle Giới thiệu, Dịch vụ, CTA, Đối tác

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **done** — STRICT FAIL r1 (khẳng định đủ #1–#11 khi thiếu slider banner ưu đãi #3) → PASS r2; GAP #3 chờ user
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · NORMAL.

## Việc
- AboutBlock, ServicesBento (3 thẻ dịch vụ trên ảnh, bo 20px), Partners: restyle theo token P1.
- CtaBanner: ảnh nền tràn viền (field mới P2-T01; scrim đạt AA như `--color-banner-scrim`), 2 nút viên thuốc (primary + secondary); không có ảnh → nền tối như cũ.
- Docs: design-spec S01 (bảng khối #1–#11), DESIGN.md.

## Acceptance
- [ ] Trang chủ đủ section #1–#11 theo change doc; AA; responsive 375/768/1280/1440


## Decision log (builder, 2026-10-19)
- **Ảnh CTA:** view dùng `ctaBanner.image` trước, chưa đặt thì rơi về `backgroundImage` cũ (CTA đã cấu hình không mất ảnh; trước đây `backgroundImage` hiển thị mờ 20%, nay cùng đi qua scrim). Global đọc bằng `readPublicGlobal` (`findGlobal` không `select`, `depth: 1`) nên `image` được populate; test `read-global.test.ts` khoá hình dạng truy vấn thật (không `select`, depth ≥ 1) theo bài học P2-T04.
- **Scrim AA:** dùng đúng `--color-banner-scrim` (0.6) của PageBanner; tiêu đề/câu phụ/chữ nút phụ trắng (`--color-on-dark`; mô tả KHÔNG dùng on-dark-muted vì không đạt trên ảnh trắng) → 4.5:1 trên ảnh trắng tinh (`contrast.test.ts`). Nút chính nền vàng + chữ tối (độc lập ảnh). Nút phụ = biến thể `chip` (khối vẫn là `.theme-dark-block` + scrim ≥ overlay đúng ràng buộc P1). Link phụ qua `resolveNavLink`; thiếu nhãn hoặc link không hợp lệ → ẩn nút.
- **Không CLS:** có ảnh thì khung `min-h-[clamp(26rem,60svh,40rem)]`, ảnh `absolute inset-0` lazy `sizes="100vw"` decorative. Không ảnh → khối tối như cũ (không đổi layout).
- **Component dùng chung:** trang chủ dùng `home/CtaBanner` (wrapper) → `layout/CtaBanner`; `layout/CtaBanner` còn dùng ở `/dich-vu/[slug]` (không ảnh, không nút phụ → render y như cũ, không đổi).
- **ServiceCard:** chữ trắng trên gradient đáy KHÔNG đạt AA trên ảnh sáng (chữ phủ tới ~60% thẻ 4:3) nên chuyển sang khung kính `.glass-panel` + chỉ `--color-text` (cùng quy tắc P2-T03, đã có test kính). Bỏ `theme-dark-block` khỏi thẻ (nó đảo `--color-text` thành trắng, sai trên kính sáng). Bo `rounded-xl` 20px. Thay đổi lan sang "Dịch vụ khác" ở trang chi tiết dịch vụ (cùng component, thống nhất style).
- **AboutBlock:** chỉ đổi ảnh bo 20px (tiêu đề đã serif sentence-case, số liệu đã là hàng chữ theo P1). **Partners:** hiện KHÔNG render gì (`partners` ngoài `RENDERED_BLOCKS`, FR-PUB-17 Should, không phải placeholder) → không có gì để restyle, không đổi schema; ghi rõ trong design-spec S01.6.
- **Docs:** design-spec S01 (bảng khối + đối chiếu #1–#11 market ↔ khối TAMI, mục 2/4/6/7) và `docs/DESIGN.md` cập nhật.
- Không tạo key i18n mới (nhãn nút phụ do CMS; mặc định giữ `page.cta.getAdvice`).

## Verification summary (builder)
- `pnpm lint`: 0 error (2 warning cũ ở `tools/task-dashboard`). `pnpm typecheck`: PASS.
- `pnpm vitest run src/components src/lib src/i18n src/app src/hooks`: 192 files / 1868 tests PASS. `pnpm test` đầy đủ: 273 files / 2867 tests PASS. Build bỏ qua (primary build worktree sạch).
- Test mới: `layout/CtaBanner.test.tsx`, `services/ServiceCard.test.tsx`, `lib/content/read-global.test.ts`, mở rộng `home-view.test.ts` (ảnh/nút phụ), `HomeBlocks.test.tsx` (CTA ảnh + 2 nút, không ảnh), `contrast.test.ts` (CTA trên ảnh trắng).
- Chưa verify bằng mắt 375/768/1280/1440 (không chạy dev server); residual risk: layout thẻ dịch vụ với khung kính ở bento 21:9 (md) và CTA cao tối thiểu 26rem cần primary xem runtime.

## Round 2 fixes (builder)
- MAJOR-1: design-spec S01 bỏ câu "Đủ #1–#11"; ghi **GAP MỞ** cho phần "slider banner ưu đãi" của #3 (chưa task nào xây; chờ user quyết ở checkpoint Phase 2: (a) dựng mới + schema CMS, (b) ánh xạ vào slider Ưu đãi/slide hero, (c) bỏ khỏi phạm vi). Không dựng trong task này. `docs/DESIGN.md` không tuyên bố đủ #1–#11.
- MINOR-1: khối CTA có ảnh dùng `[&_a:focus-visible]:outline-on-dark` (trắng); thêm dòng test trong `contrast.test.ts` (trắng >= 3:1 trên scrim đè ảnh trắng; vòng mặc định < 4.5 và ~2.95).
- MINOR-2: `Homepage.ts` thêm `admin.description` cho `ctaBanner.backgroundImage`/`image`. `pnpm generate:types` → diff `payload-types.ts` chỉ 6 dòng JSDoc comment (không đổi kiểu) → không cần migration.
- MINOR-3: `docs/DESIGN.md` Trang chủ: "Đối tác (dải logo; chưa dựng giao diện)".
- MINOR-4: `min-h-[26rem]` làm nền, `supports-[height:1svh]:min-h-[clamp(26rem,60svh,40rem)]` (viết thế vì tailwind-merge sẽ bỏ một trong hai `min-h-*` cùng nhóm).

## Phase 2 close-out (validator D1–D4)

- D1 `docs/DESIGN.md` hàng Trang chủ: thêm thanh thông báo (trên cùng) + ô tìm kiếm/chip vào luồng trang; slider dự án mô tả đúng P2-T03 (thẻ ~464×600, khung kính, badge, số liệu); thứ tự khối nêu theo `blockOrder` (mặc định 6 khối, Cho thuê/Tin tức chỉ hiện khi thêm vào thứ tự).
- D2 `.context/design-spec.md` S01: khối 3 = slider thẻ, không eyebrow; khối 5 = slider thẻ; dòng ngân sách eyebrow = 0/3.
- D3 `docs/ERD.md` §4.15: ngoại lệ title tuỳ chọn của `rentals`/`news`; bỏ ghi chú "header trong suốt CHƯA làm"; "khi P2-T03/T04 xong" → đã dựng; thêm hook `createRevalidateHomepageOnListing`; danh sách guard media thêm `ctaBanner.image`.
- D4 `createRevalidateHomepageOnListing` chỉ gọi `paths(homepagePaths())` (`/vi`, `/en`), không đụng tag `global:homepage` (nhận `Pick<HomepageRevalidators,"paths">`); `News.ts`/`Rentals.ts` bỏ tham số `revalidateTags` thừa (không caller nào truyền). Hook global/service/unpublish (dự án, ưu đãi) giữ nguyên, vẫn dùng `revalidateHomepage` (tag + paths) — cần tag cho hook global (chính global được cache theo tag); với hook dịch vụ/gỡ xuất bản, tag là thừa (dịch vụ, dự án, ưu đãi cũng đọc trực tiếp theo id ở `home-queries`) → đề xuất follow-up bỏ tag ở 2 hook đó (reviewer close-out MINOR). Unit test listing cập nhật (chỉ paths). `docs/DESIGN.md` hàng Announcement Bar nêu rõ lưu nào làm mới toàn site vs chỉ `/` `/en`.
- Verify: `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard), `pnpm typecheck` pass, vitest `src/components src/lib src/i18n src/app src/hooks` 1869/1869, integration homepage+rentals+news (DB `tami_wt_bl020`) 90/90.

## Checkpoint Phase 2 (2026-10-20)
- User chốt GAP #3: ánh xạ "slider banner ưu đãi" vào slider Ưu đãi (khối 5) → acceptance "Trang chủ có đủ section #1–#11" đạt theo ánh xạ này (design-spec S01 đã cập nhật). Q2/Q3: xem README § Quyết định user checkpoint Phase 2.
