# feature-admin-ui-saas-refresh · phase-1-task-01 — Style chung + design tokens admin (sáng/tối, AA)

- Change doc: `spec/changes/2026-10-19-admin-ui-saas-refresh.md` (BACKLOG BL-015) · Spec: FR-ADM-19 (SPECIFICATIONS F10)
- Design: §1 (tokens), §1.6 (ràng buộc kỹ thuật), §2 style sidebar, §4/§5 style bảng/form, §8 (style select admin chuyển từ BL-016)
- Phụ thuộc: — · Song song: ∥ T02

## Classification / Risk
- Type: **MODIFY** (UI admin) · Risk: **MEDIUM** — CSS dùng chung toàn admin, contrast sáng/tối.
- Expected review level: **NORMAL** · Blast radius: mọi màn `/admin` (CSS), không logic.
- Doc impact: as-built `docs/ARCHITECTURE.md` nếu có mục admin UI (builder đề xuất). Decision impact: không.

## Yêu cầu
1. `src/components/admin/admin-tokens.ts`: một nguồn const cho token màu sáng/tối (§1.1, §1.2), badge tones (§1.3), map elevation (§1.6.1) — xuất để test dùng; SCSS ghi cùng giá trị (comment trỏ file TS).
2. `src/app/(payload)/custom.scss`: khai `--admin-*` sáng/tối; map vào `--theme-elevation-*`, `--theme-bg`, `--theme-input-bg`, `--style-radius-s/m/l`, border; viền input/select/checkbox/radio/upload = `--admin-border-strong`; focus-visible 2px accent offset 2px. Restyle: nút (primary/secondary), input, **react-select của Payload** (viền border-strong, bo 6px, menu shadow-md, option hover elevation-100, option chọn accent-soft), card collection, bảng (header 12/500 muted không in hoa toàn bộ, dòng 48px, hover surface-hover, header dính), tab, pill, popup, nav trái (§2: nền nav-bg, eyebrow nhóm 12/600 subtle, mục 14/500 cao 36 bo 6, active accent-soft + vạch 3px trái), alert. Tối: viền thay bóng. Mobile < 768: vùng chạm 44px.
3. Restyle `TranslationFailedBanner` thành alert danger theo token (giữ nội dung/logic).
4. Không đổi `--base`/`--base-body-size`; CSS ngoài `@layer`, không `!important` mới (trừ chỗ logo đã có).
5. Test unit `src/components/admin/admin-tokens.test.ts`: tính contrast WCAG từ token, assert mọi cặp chữ/nền ≥ 4.5, biên điều khiển ≥ 3 (sáng + tối), badge 6 tone × 2 theme ≥ 4.5; các bậc elevation dùng làm chữ ≥ 4.5 trên surface. Kiểm chứng SCSS và TS cùng giá trị (test đọc file SCSS so token, hoặc cách khác ghi rõ lý do).
6. Không đụng component `TranslationStatusFilter` (BL-016) — chỉ style react-select chung.

## Acceptance
- [ ] Tokens sáng/tối đúng design §1; test contrast PASS
- [ ] Viền input/select/checkbox ≥ 3:1, chữ mô tả/placeholder ≥ 4.5:1 (đo thật trên trang admin sáng + tối bằng trình duyệt: list Projects + form Projects + login)
- [ ] react-select admin cùng style input
- [ ] Không vỡ layout 1440 và 390px (sáng + tối)
- [ ] lint/typecheck/test/build PASS

## Ràng buộc chung BL-015 (mọi task)
- Chỉ `/admin`: cấu hình `admin.*` của Payload + `src/app/(payload)/custom.scss` + component trong `src/components/admin/**`. **KHÔNG** đụng `src/app/(frontend)`, **KHÔNG** đổi schema/DB, access control, hook, API.
- Không sinh migration: không thêm/đổi `name` field, không bọc field vào `group`/`tabs` có `name`. Chỉ tab **không tên**, `row`, `collapsible`, `label`, `labels`, `admin.*`. Kiểm: `src/payload-types.ts` sau `pnpm generate:types` không đổi kiểu (chỉ có thể đổi comment/JSDoc), và `pnpm payload migrate:create` không tạo file mới (nếu tạo → xoá file đó, coi là FAIL).
- Không commit/push (primary commit). Không sửa `.context/project-config.md`, `.claude/**`.
- Design nguồn: `docs/specs/2026-10-19-admin-ui-saas-design.md` (§7 Đã chốt) + mock `docs/specs/2026-10-19-admin-ui-saas-mock.html`.
- Verify (project-config): `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`. Fail đã biết từ trước (nếu có) ghi rõ, không che.
- File ≤ 300 dòng, hàm ≤ 50 dòng (project-config ui).
- Retry/Escalation: tối đa 3 attempt; review tối đa 2 vòng FAIL → `architecture_review_needed`.

## Verification summary

### Thiết kế chốt
- Token sáng/tối đúng design §1.1/§1.2/§1.3/§1.4; map 21 bậc `--theme-elevation-*` theo §1.6.1 (bậc lẻ nội suy), `--theme-bg` = canvas,
  `--theme-input-bg` = surface (cả tối, ghi đè ngoài @layer), `--theme-border-color` = border, `--style-radius-s/m/l` = 6/8/12,
  `--accessibility-outline` = 2px accent offset 2px, `--nav-width` 256, `--gutter-h` 32/20/16 (khai lại đủ breakpoint vì biến ngoài layer thắng media query của Payload).
- Viền input/select/checkbox/radio/dropzone/search = `--admin-border-strong`; placeholder/mô tả = `--admin-text-subtle`; react-select: viền strong, bo 6, menu shadow-md + viền, option hover elevation-100, chọn accent-soft.
- Bảng: card surface bo 12, header 12/500 muted nền canvas (sticky trong `.table`), dòng 48px, bỏ sọc, hover surface-hover; ≤1024 bỏ bo/viền dọc (Payload kéo bảng tràn gutter).
- Nav: nền nav-bg, eyebrow 12/600 subtle, mục 14/500 cao 36 bo 6, active accent-soft + vạch 3px accent; mobile 44px.
- Tab tài liệu active = accent-soft (phần tử `.btn` mang `doc-tab--active`), tab field: gạch accent. Pill bo 999; pill/banner success/warning/error → badge tone.
- Login/forgot: form trong card surface. `.required` → tone danger (error-500 của Payload chỉ 4.13:1).
- SCSS tách partial ≤ 300 dòng ở `src/components/admin/styles/` (trong scope `src/components/admin/**`), `custom.scss` `@use`.

### File đổi
- Mới: `src/components/admin/admin-tokens.ts`, `src/components/admin/admin-tokens.test.ts`, `src/components/admin/styles/_tokens.scss`, `_controls.scss`, `_surfaces.scss`, `_lists.scss`.
- Sửa: `src/app/(payload)/custom.scss` (header + `@use`), `src/components/admin/TranslationFailedBanner.tsx` (inline style → class alert).
- Không đụng collection/global/config, không migration (chỉ CSS/TS token/test).

### Test mới
- `admin-tokens.test.ts` (16 test, unit): chữ chính/muted/subtle × 4 nền ≥ 4.5; accent link/surface+canvas, on-accent/accent(+hover), accent-soft-text/accent-soft ≥ 4.5; badge 6 tone × 2 theme ≥ 4.5; elevation {400,450,500,600,800,1000} × {0,50,100} ≥ 4.5; border-strong/focus/accent trên surface+canvas ≥ 3, elevation-350/0 ≥ 3; SCSS `_tokens.scss` trùng TS (--admin-*, badge, 21 bậc elevation, sáng + tối). PASS.

### Verify commands (worktree)
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm build` PASS (exit 0).
- `pnpm test`: unit+ui 1842/1843 — 1 fail `src/components/layout/Header.test.tsx` "bẫy focus" (timeout 5s khi máy tải nặng; file frontend, ngoài scope; chạy riêng PASS 16/16). Integration: 2 lần đầu fail hàng loạt vì Postgres "the database system is in recovery mode" (tải song song T02); chạy lại `--project integration` **704/704 PASS**.

### Đo contrast thật (trình duyệt, computed style, port 3101)
| Màn | Sáng | Tối |
|---|---|---|
| Login | label 17.49 · viền input #8F8984/#FFF **3.45** · link 5.12 · nút chính chữ/nền 5.12 · `*` 7.47 (sau fix) | label 16.09 · viền #6E6862/#1A1918 **3.19** · link 10.02 · nút 10.51 · `*` 9.28 |
| List Projects | h1 16.3 · th 7.11 (12/500) · td 17.49 · placeholder tìm kiếm **5.74** · viền search 3.22/canvas · pill 15.08 · pager hiện tại 6.96 · nav active 6.96 · nav eyebrow 5.55 | (cùng token; bảng/hàng kiểm ở 390 tối, không h-scroll) |
| Form Projects | label 16.3 · mô tả **5.36** · viền input/select/checkbox/textarea/dropzone 3.22 trên canvas · rs value 17.49 · tab active 6.96 · doc-controls label 5.36 · "thêm dòng" 5.13 | h1 17.29 · mô tả 5.46 · viền 3.43 trên canvas / 3.19 trên surface · chữ input 16.09 · tab active 10.89 · read-only 6.01 |
| Dashboard | card title 17.49 · alert dịch lỗi 7.03 (link inherit) | card title 16.09 · alert 8.63 |
- Responsive: 1440 (nav mở 256px, bảng card) và 390 (scrollWidth = innerWidth, không h-scroll; input/select/nút 44px, checkbox 22px) sáng + tối — không vỡ layout.

### Residual risk
- Header bảng chỉ dính trong vùng cuộn của `.table` (Payload `overflow: auto` cho cuộn ngang) — không dính theo cuộn trang; đổi cần thay scroll container của Payload.
- Dashboard mặc định: nhãn nhóm `.collections__label` (26px) chưa restyle — T04 thay cả view.
- Quy tắc generic `.field-type input` áp lên cả input trong lexical/date picker (đã loại `.rs__input`); kiểm bằng mắt form Projects OK, các field hiếm (code, json, point) chưa soi.
- Rule `.btn` 14px / medium 36px áp toàn admin (drawer, bulk upload) — chưa soi hết màn.
- `pnpm payload migrate:create` không chạy (không đổi config/schema; chỉ CSS/TS).

### Attempt 3 (ngoại lệ user duyệt) — MAJOR-1 vùng bấm checkbox mobile
- Fix `src/components/admin/styles/_controls.scss` (`@media (max-width: 767px)`): `.checkbox-input { min-height:44px; align-items:stretch }`, `label.field-label { min-height:44px; align-items:center }`, `.checkbox-input__input { align-self:center }` + `input[type="checkbox"] { width/height:44px; margin-left/top:-12px }`. Hộp hiển thị vẫn 22px; radio giữ nguyên; không `!important`.
- Toán DOM (Payload 3.91): input absolute trong `.checkbox-input__input` (relative, 22px border-box, viền 1px => padding-box 20px, tâm cách gốc 10px); input 44px với margin -12px => phủ x,y ∈ [-12,32] quanh gốc, tâm 10 = tâm hộp => 44x44 căn giữa, z-index:1 của Payload giữ trên label. Hàng cao ≥44 nên input (align-self:center) nằm trọn hàng; label stretch 44px nên toàn bộ hàng toggle. Checkbox không label (list view SelectRow/SelectAll): input 44x44 phủ ô, chỉ lấn 11px vào padding ô bảng.
- Không đo bằng trình duyệt trong attempt này (chứng minh bằng CSS/DOM math).
- Test thêm: `admin-tokens.test.ts` "_controls.scss mobile: vùng bấm checkbox 44x44". Verify: lint PASS, typecheck PASS, test 243 files/2551 PASS, build PASS.
