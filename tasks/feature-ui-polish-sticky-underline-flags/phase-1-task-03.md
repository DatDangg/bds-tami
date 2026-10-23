# feature-ui-polish-sticky-underline-flags · phase-1-task-03 — Cờ đổi ngôn ngữ chữ nhật 3:2, nhỏ hơn

- Change doc: `spec/changes/2026-10-23-ui-polish-sticky-underline-flags.md` (BACKLOG BL-074, mục 3)
- Spec: SPECIFICATIONS.md F12 bullet FR-PUB-19 (as-built BL-063 → BL-074) · design-spec §2.3
- Auto proceed (user "tự làm tự quyết đừng hỏi t").

## Hiện trạng
- `src/components/layout/flag-icons.tsx`: SVG `viewBox 0 0 24 24` (vuông), sao VN tâm (12,12); Union Jack giản lược vuông.
- `src/components/layout/LanguageSwitcher.tsx:47-54`: khung `span size-6 rounded-[2px] ring-1 ring-black/20`, đang chọn `ring-2 ring-accent-text ring-offset-2` (+ offset theo tone), cờ `size-6`. Link `min-h-11 min-w-11 rounded-full` (vùng bấm 44×44), `gap-1`.

## Quyết định (change-request)
- Cờ **3:2**: `viewBox="0 0 30 20"` (vẽ lại tỷ lệ: VN nền đỏ #DA251D, sao vàng tâm (15,10) bán kính ngoài ~6 theo tỉ lệ quốc kỳ — bán kính ngoài = 1/5 chiều dài... dùng tỉ lệ chuẩn: đường kính đường tròn ngoại tiếp sao = 2/3 chiều cao? Theo quy định VN: bán kính = 1/5 chiều dài → 6 trên chiều dài 30; tính lại `STAR_POINTS` (5 cánh, đỉnh hướng lên, bán kính trong ≈ 0.382 × ngoài), làm tròn 2 chữ số). UK: Union Jack giản lược theo 30×20 (chéo trắng + chéo đỏ giữa, chữ thập trắng + đỏ; nét tỉ lệ như hiện tại theo chiều cao).
- Kích thước hiển thị **21×14 px** (`h-3.5 w-[21px]` hoặc tương đương; ưu tiên class Tailwind chuẩn nếu có, vd `w-5 h-[13.33px]` không đẹp → dùng 21×14). Nhỏ hơn 24×24 hiện tại.
- Viền chọn **mảnh hơn**: đang chọn `ring-1` → dùng `ring-[1.5px]`/`ring-1` màu `--color-accent-text` + `ring-offset-1` (thay `ring-2 ring-offset-2`); vẫn phân biệt không chỉ bằng màu nhờ cờ kia mờ 60% + ring có offset (khung bao ngoài). Kiểm tương phản ring ≥ 3:1 trên nền kính sáng và nền tối (footer `on-dark`, menu toàn màn hình). Viền mảnh `ring-1 ring-black/20` cho cả hai cờ giữ.
- Bo góc giữ `rounded-[2px]`. Vùng bấm giữ `min-h-11 min-w-11` (≥ 24×24 WCAG 2.5.8, thực tế 44×44). Khoảng cách hai mục giữ `gap-1` (nếu header < xl chật thì có thể giảm, ghi log).
- `aria-hidden`, `focusable=false`, `data-flag`, `aria-label`/`title`/`lang`/`hreflang`/`aria-current`, cookie + đích link: **không đổi**.

## Classification / Risk
- Type: **MODIFY** (UI). Không đổi API / schema / i18n.
- Risk: **LOW-MEDIUM** — component dùng ở header, menu toàn màn hình, footer (dùng chung). Reviewer: **STRICT** (shared header/footer component) — scope hẹp.
- Doc impact: design-spec §2.3 + SPECIFICATIONS F12 (change-request reconcile).

## Acceptance
- [ ] Cờ VN/EN chữ nhật 3:2 (viewBox 30×20), hiển thị 21×14, sao VN cân giữa; Union Jack nhận ra được.
- [ ] Đang chọn: viền mảnh hơn hiện tại, vẫn phân biệt rõ (nền sáng header, menu toàn màn hình, footer tối).
- [ ] Vùng bấm ≥ 44×44 giữ nguyên; header < sm/≥ sm/≥ xl không vỡ hàng.
- [ ] Test `flag-icons.test.tsx` + `LanguageSwitcher.test.tsx` cập nhật viewBox/kích thước/ring.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `.context/design-spec.md`, file dirty không thuộc change; không đụng task 01/02.
- KHÔNG commit.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test`
- Trình duyệt dev :3000: header 390/768/1440, menu toàn màn hình, footer (vi + en); zoom ảnh cờ.
- Report: `.context/review-reports/feature-ui-polish-sticky-underline-flags-phase-1-task-03-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) 3:2, 21×14, ring đang chọn mảnh hơn (offset 1), vùng bấm 44×44 giữ.

### Builder (round 1)
- Cờ viewBox `0 0 30 20`; VN nền #DA251D, sao tâm (15,10). Bán kính sao: dùng quy định quốc kỳ (đường tròn ngoại tiếp đường kính = 2/3 chiều rộng → R = 20/3 ≈ 6.67, r = 0.382R ≈ 2.55), KHÔNG dùng "1/5 chiều dài = 6" của task (hai giá trị gần nhau; chọn theo quy định). `STAR_POINTS` tính bằng node, làm tròn 2 chữ số.
- UK: Union Jack giản lược 30×20, nét theo chiều cao: chéo trắng 4 / đỏ 1.6, thập trắng 6 / đỏ 3.4.
- Hiển thị `h-3.5 w-[21px]` (khung + svg); ring đang chọn `ring-[1.5px] ring-accent-text ring-offset-1` (offset glass/dark giữ); `ring-1 ring-black/20`, `rounded-[2px]`, `min-h-11 min-w-11`, `gap-1` giữ.
- Tương phản ring (tính từ computed style): header sáng #8C6733 vs nền kính ~#FAF8F6 ≈ 4.8:1; menu/footer tối #E0BF89 vs #111 ≈ 10:1 (≥ 3:1).

## Verification summary (builder)
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS (4592 tests).
- Trình duyệt :3000: cờ đo 21×14, vùng bấm 44×44, group 92×44; 375px không h-scroll (sw=iw=375); menu toàn màn hình + footer đo/ảnh OK; phóng to SVG: sao VN cân giữa, Union Jack nhận ra. Header 1440/800 và footer đo qua JS (screenshot pane giới hạn 800px). Footer EN dùng cùng component (chỉ đổi locale) — không chụp riêng.
