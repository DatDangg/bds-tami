# feature-page-hero-warm-scrim · phase-1-task-01 — Scrim ảnh đen ánh nâu vàng (đổi chung `--color-banner-scrim`)

- Nguồn: `spec/changes/2026-10-21-page-hero-warm-scrim.md` (BL-049). Spec: `SPECIFICATIONS.md` Overview, câu "Hero trang con" (as-built BL-049). Trạng thái: `done`.
- Plan: 1 phase / 1 task — user chốt phạm vi "đổi CHUNG token" (2026-10-21), "làm đi" = duyệt plan.

## Classification / Risk
- Type: **MODIFY** (đổi tông màu token dùng chung). Risk: **LOW–MEDIUM** — 1 giá trị token, không đổi schema/API/auth/bố cục; nhưng token dùng chung cho 5 chỗ (PageHero lớp phẳng + gradient trái, PageBanner, CtaBanner, chú thích ảnh AboutBlock, bóng chữ `.crumb-glass`) và có ngưỡng tương phản AA sát (breadcrumb kính).
- Expected review level: **NORMAL** (token/style dùng chung, có test tương phản tự động).
- Blast radius: mọi trang con có hero ảnh (Dự án, Cho thuê + danh mục, Đăng tin BĐS, Tin tức, Tuyển dụng, Liên hệ, Dịch vụ, Pháp lý), banner CTA trang chủ + `ConsultBanner`, khối Về TAMI trang chủ (chú thích ảnh), PageBanner biến thể Ảnh.
- Doc impact: `docs/DESIGN.md` (hàng `PageHero`), `.context/design-spec.md` (as-built hero), `skills/react-nodejs/design-tokens.md` (bảng token). Decision impact: không (không đổi kiến trúc/contract).

## Quyết định màu (đo trước khi chọn, ảnh trắng tinh = trường hợp xấu nhất, alpha giữ 0.6)

| Scrim | nền phẳng trên ảnh trắng | chữ trắng / nền phẳng | chữ trắng breadcrumb (khung `.crumb-glass` 13% vàng đậm) | dòng vàng `#e0bf89` phía chữ (phẳng + gradient trái) | vàng trên nền phẳng 1 lớp |
|---|---|---|---|---|---|
| cũ `rgb(10 12 16 / 0.6)` | `#6c6d70` | 5.17 | 4.65 | 7.23 | 2.95 |
| gợi ý `rgb(28 20 10 / 0.6)` | `#77726c` | 4.76 | **4.35 (FAIL AA)** | 6.42 | 2.72 |
| **chọn `rgb(20 13 2 / 0.6)`** | `#726e67` | **5.07** | **4.60** | **7.03** | 2.89 |

- Gợi ý `28 20 10` bị loại vì chữ breadcrumb trên khung kính tụt dưới 4.5:1. `20 13 2` giữ tỉ lệ R:G:B ấm hơn (hue ~37°, nâu vàng) nhưng đủ tối để mọi chữ trắng ≥ 4.5:1.
- Dòng vàng / eyebrow (`--color-primary` = `--color-on-dark-accent` `#e0bf89`) chỉ đặt ở phía trái hero nơi gradient chồng lên lớp phẳng → 7.03:1. Vàng trên nền phẳng 1 lớp (2.89) chỉ liên quan vòng focus CTA, vốn đã dùng `outline-on-dark` trắng (giữ nguyên).

## Scope (Builder)
1. `src/app/(frontend)/globals.css` dòng 30–31: đổi `--color-banner-scrim` → `rgb(20 13 2 / 0.6)`; sửa comment nêu: dùng chung cho các chỗ trên, đen ánh nâu vàng (BL-049) thay đen lạnh, alpha giữ 0.6, chữ trắng ≥ 4.5:1 trên ảnh trắng (FR-ADM-20, đo ở `contrast.test.ts`). **CHỈ** sửa 2 dòng này — file có thay đổi chưa commit của BL-047 (`--header-offset`), không đụng.
2. `src/lib/contrast.test.ts`: test hiện có đọc token động nên tự kiểm số mới; thêm 1 test BL-049: scrim ngả ấm (R > G > B), alpha vẫn `0.6`. Không sửa test khác.
3. Không đổi component (PageHero/PageBanner/CtaBanner/AboutBlock), không đổi `--color-overlay`, độ mờ, gradient, bố cục.
4. Doc as-built: `docs/DESIGN.md` hàng `Hero trang con (PageHero)` + `.context/design-spec.md` dòng as-built BL-045 hero (§ ~129) + `skills/react-nodejs/design-tokens.md` (thêm token `--color-banner-scrim` cạnh `--color-overlay` ở bảng + khối `@theme`) — ghi giá trị + số đo.

## Verify
- `pnpm vitest run src/lib/contrast.test.ts src/components/layout/PageHero.test.tsx src/components/layout/PageBanner.test.tsx src/components/layout/CtaBanner.test.tsx`
- `pnpm typecheck`, `pnpm lint`

## Acceptance
- [x] Scrim token đổi, mọi lớp phủ dùng token ngả ấm (không hardcode trong component)
- [x] Chữ trắng ≥ 4.5:1 trên ảnh trắng (5.07 / breadcrumb 4.60); dòng vàng 7.03 — test tự động PASS
- [x] Test PageHero/PageBanner/CtaBanner/trang danh sách PASS
- [x] Doc as-built cập nhật

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (Builder)
- `pnpm vitest run` contrast + PageHero + PageBanner + CtaBanner + ProjectListPage + RentalListPage: 6 files, 123 tests PASS (gồm test mới BL-049: scrim R > G > B, alpha 0.6).
- `pnpm typecheck`: PASS. `pnpm lint`: 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope).
- Đổi: `globals.css` (2 dòng scrim), `contrast.test.ts` (+1 describe), `docs/DESIGN.md`, `.context/design-spec.md` (dòng hero as-built), `skills/react-nodejs/design-tokens.md` (bảng + khối CSS). Không đụng component. Không kiểm thị giác (không khởi động server).

## Spec validation (pre-plan)
- `.context/review-reports/feature-page-hero-warm-scrim-spec-validation.md` — **PASS** (số đo tự tính lại khớp).
- Residual risk F-1 (LOW): 7.03:1 của chữ vàng đo tại mép trái (gradient đậm nhất, cùng cách đo test BL-045). Gradient nhạt dần sang phải → chữ vàng < 4.5:1 từ ~50% bề rộng hero (token cũ ~53%), vẫn ≥ 3:1 tới ~97%. Dòng vàng `h1` là chữ lớn (ngưỡng 3:1) và eyebrow ngắn sát mép trái trong khung `max-w-[16ch]` → chấp nhận; BL-049 chỉ dịch ngưỡng ~3 điểm %.

## Review
- Round 1: `.context/review-reports/feature-page-hero-warm-scrim-phase-1-task-01-round-1-review.md` — **NORMAL, PASS** (0 CRITICAL/MAJOR). Reviewer tự tính lại số đo, khớp. MINOR #2 (spec ghi rõ "mép trái") đã sửa trong SPECIFICATIONS.md; MINOR #1 (helper parse rgb lặp 4 lần trong contrast.test) và #3 (mô tả `--color-overlay` trong design-tokens.md còn ghi "scrim trên ảnh hero", có từ trước) để task riêng.

## Verification summary (close-out)
- Acceptance criteria: **PASS**. Verify: vitest 6 files / 123 tests PASS; typecheck PASS; lint 0 error. Reviewer verdict: **PASS** (r1). Spec validator: PASS.
- Residual risk: chưa kiểm thị giác trên ảnh thật (không có dev server); số đo là trường hợp xấu nhất ảnh trắng tinh.

## Doc impact
- As-built: `docs/DESIGN.md` (hàng PageHero), `.context/design-spec.md` (as-built hero), `skills/react-nodejs/design-tokens.md` (token `--color-banner-scrim`). Intent: `SPECIFICATIONS.md` qua change request đã duyệt (spec 1.41.0). Không đổi API/schema.
