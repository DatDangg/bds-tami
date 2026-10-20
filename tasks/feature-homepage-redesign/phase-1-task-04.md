# feature-homepage-redesign · phase-1-task-04 — chữ mặc định eyebrow/nhãn video Về TAMI + khoảng cách Về TAMI → Dự án + ERD §4.15 đủ field (BL-044, phase review G-M1)

- Change doc: `spec/changes/2026-10-20-homepage-redesign.md` (BL-044). Nguồn: phase review `.context/review-reports/spec-validation-feature-homepage-redesign-phase-1.md` (G-M1 MAJOR, D1) + review T03 r2 n1.
- Spec: `SPECIFICATIONS.md` F1 "Về TAMI (ĐỔI)": `about.videoLabel` localized, **trống → i18n mặc định**; `about.eyebrow` trống → "Về chúng tôi" (mô tả admin `src/globals/Homepage.ts:162,170` đã hứa như vậy).
- Phụ thuộc: T00–T03 đã commit (3a5fffe, aa5a178, 1271db9, d01f1f7).
- Trạng thái: `in_progress`.

## Classification / Risk
- Type: **MODIFY** (sửa code cho khớp spec đã duyệt — không đổi requirement).
- Risk: **LOW** — chỉ trang chủ khối Về TAMI + i18n + doc as-built. Không schema/migration.
- Expected review level: **NORMAL**.
- Blast radius: `src/lib/home/home-view.ts` (+ test), `src/components/home/AboutBlock.tsx` (+ test), `src/components/home/FeaturedProjects.tsx` / `AboutBlock.tsx` spacing, `src/i18n/messages/{vi,en}.json`, `docs/ERD.md` §4.15.

## Scope
1. **G-M1:** `about.eyebrow` trống → chữ i18n mặc định ("Về chúng tôi" / "About us"); `about.videoLabel` trống → i18n mặc định ("Khám phá TAMI HOMES" / "Discover TAMI HOMES"). Nút play hiện khi có `videoEmbedUrl` hợp lệ (không phụ thuộc nhãn). Thêm key i18n vi/en; test view/AboutBlock cho cả 2 nhánh (có giá trị / trống → mặc định), kể cả `/en`.
2. **Khoảng cách (T03 r2 n1, U4):** khoảng Về TAMI → Dự án nổi bật về ~42px như mockup (hiện ~128px do `py-section` AboutBlock + `pt-section` FeaturedProjects) — chỉ chỉnh spacing token sẵn có ở trang chủ, giữ nền kem Về TAMI đủ đệm dưới.
3. **D1:** `docs/ERD.md` §4.15 bổ sung `hero.eyebrow`, `hero.caption`, `hero.slides[].titleAccent`, `about.ctaLabel`, `about.ctaLink`, `featuredProjects.eyebrow`, `featuredProjects.description` (tham chiếu migration `20261020_103248_homepage_redesign`).

## Acceptance
- [ ] Có link video, nhãn trống → nút play hiện với nhãn mặc định đúng ngôn ngữ; không link → ẩn nút.
- [ ] Eyebrow trống → "Về chúng tôi" / "About us".
- [ ] Mô tả admin `Homepage.ts:162,170` đúng hành vi.
- [ ] Khoảng Về TAMI → Dự án nổi bật ≈ mockup ở 1440; 390 không tràn ngang.
- [ ] ERD §4.15 đủ field.
- [ ] `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS; không hex/kiểu mới; 1 h1.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (builder điền)
- Acceptance criteria: tất cả đạt. Mặc định i18n áp ở component (`page.home.about.defaultEyebrow/defaultVideoLabel`, vi/en); nút play chỉ phụ thuộc `videoEmbedUrl`; mô tả admin Homepage.ts:162,170 vốn đúng, không đổi schema/migration. Khoảng Về TAMI → Dự án nổi bật đo ở 1440 = 40px (AboutBlock `pt-section pb-6` + `data-block="about"`; FeaturedProjects `[[data-block=about]+&]:pt-4`, chỉ khi liền sau Về TAMI). ERD §4.15 bổ sung đủ field. Ảnh: `.context/review-reports/assets/homepage-redesign-t04-1440.png`.
- Verify commands + result: `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning cũ tools/task-dashboard/server.mjs) · `pnpm test` 305 file / 3205 test PASS · `pnpm build` PASS.
- Reviewer verdict: …
