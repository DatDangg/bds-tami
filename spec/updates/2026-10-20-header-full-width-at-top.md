# Spec Update — 2026-10-20 header-full-width-at-top (header phẳng ở đầu trang, nổi khi cuộn)

**spec_version:** 1.21.0 → 1.22.0 (MINOR — đổi behavior hiển thị header công khai; không đổi schema, API, quyền, URL, nguồn lead)

**BRD:** không đổi (chỉ hình dạng header, không thêm phạm vi).

**Trigger:** feature-update (Change Request **BL-025**, MODIFY). Change doc `spec/changes/2026-10-20-header-full-width-at-top.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/feature-header-full-width-at-top/phase-1-task-01.md`. Review: `.context/review-reports/feature-header-full-width-at-top-phase-1-task-01-round-1-review.md` (STRICT PASS, 2 MINOR) + `...-round-2-review.md` (NORMAL PASS — sửa MINOR #1: nội dung giữ khung 84rem khi phẳng).

> Sửa quyết định của BL-020 P1-T02 (`ab3f95a`): "một biến thể duy nhất — luôn thanh nổi bo tròn, không cần JS/observer". User 2026-10-20: chưa cuộn mà đã là thanh bo góc "không ổn".

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI) | close-out BL-025 (commit chứa file này) | `HeaderFrame` thành client component nhỏ: listener `scroll` passive + rAF, ngưỡng `scrollY > 4` → `data-scrolled` trên `<header>`; class Tailwind `group-data-[scrolled]:` / `lg:data-[scrolled]:` đổi padding header + max-width/radius/shadow thanh; `Header.tsx` bọc nội dung khung `max-w-[84rem]`; `globals.css` chỉ sửa comment; test `HeaderFrame.test.tsx`, `Header.test.tsx` | STRICT PASS r1 · NORMAL PASS r2 |

## Requirements (SPECIFICATIONS.md — Overview "Khung trang")

- **SỬA** header: nền luôn kính mờ sáng (kem ~80% + blur 24px), không biến thể trong suốt — giữ nguyên; thêm **hai hình dạng theo cuộn**:
  - **Đầu trang** (`scrollY ≤ 4px`, mặc định SSR): thanh **phẳng full-width** sát mép trên/trái/phải, góc vuông, không bóng, cao = `--header-offset` (80px; ≥ lg 104px); nội dung trong khung 84rem căn giữa (chỉ nền tràn viền).
  - **Đã cuộn** (> 4px): thanh **nổi bo tròn** (pill), lề 8px (≥ lg 16px), cao 64px (≥ lg 72px), rộng tối đa 84rem, `--shadow-md`.
  - Cuộn về đầu → phẳng lại. Transition `--duration-base` ease-out; `prefers-reduced-motion` → đổi tức thì.
- `<header>` cao **cố định** `--header-offset` ở cả hai trạng thái → `--header-offset` không đổi, không CLS (hero kéo lên, thanh dính, `scroll-margin` neo giữ nguyên).
- Không đổi: nền/tương phản AA (logo vàng + chữ `--color-text`), fallback `@supports` / `prefers-reduced-transparency` nền đặc, focus ring màu chữ, bố cục < xl / ≥ xl.
- Design: `.context/design-spec.md` §2.1 (Biến thể / Trang không có hero / Cao – lề) cập nhật cùng.

## Schema / Migration / API

Không. Migration: none. Doc as-built: chỉ design-spec §2.1 (đã sửa); không ERD/API.

## Hành vi bị thay thế

| Trước (BL-020 P1-T02) | Sau (BL-025) |
|---|---|
| Header luôn là thanh nổi bo tròn cách mép 8/16px, kể cả khi chưa cuộn | Đầu trang: thanh phẳng full-width cao 80/104px; chỉ khi cuộn > 4px mới thành thanh nổi bo tròn |
| `HeaderFrame` server component, không JS | Client component nhỏ (scroll passive + rAF); SSR trạng thái phẳng |

## Ảnh hưởng

- Mọi trang công khai (VI + EN), mọi breakpoint; trang có hero (`/`, `/en`) và không hero (`/cho-thue`, `/du-an/<slug>`, `/tin-tuc`...).
- Component: `HeaderFrame`, `Header`; phụ thuộc `--header-offset`: hero `-mt-(--header-offset)` + HeroSlider đo `.site-header`, ProjectSubNav `top`, `scroll-margin` neo, aside dính (RentalDetail, JobDetail, ProjectDetail), thanh thông báo trang chủ.

**Residual:** chưa kiểm trình duyệt thật — test chỉ khẳng định chuỗi class (Tailwind v4 sinh đúng biến thể `data-[scrolled]` chưa đo CSS); `max-w-[84rem]` lặp 2 chỗ (thanh + khung nội dung) phải luôn bằng nhau (review r2 MINOR); tải lại giữa trang: phẳng trước hydrate → nổi sau hydrate (không CLS do chiều cao header cố định).

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 27
