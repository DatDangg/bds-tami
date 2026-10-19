# feature-public-ui-market-vinhomes · phase-5-task-01 — Schema Projects: nổi bật, tiện ích quanh, bảng giá, FAQ

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE schema · DB/migration + dịch tự động → STRICT. **Chỉ làm sau khi user chốt câu 4.**

## Đề xuất (chờ chốt)
- `highlights` array (≤ 8): `title` (localized, required), `description` (textarea localized), `icon` (text, tuỳ chọn).
- `nearbyAmenities` array: `category` select (education | healthcare | shopping | park | transport | other), `name` (localized), `distance` (text, vd "1,2 km" / "5 phút"), `location` (point, tuỳ chọn → marker bản đồ).
- `priceTable` array — bảng giá theo **loại căn** (không quản lý từng căn/quỹ căn chi tiết): `unitType` (localized), `areaFrom`/`areaTo` (m²), `priceFrom`/`priceTo` (VND, VndCell), `availability` select (available | few_left | sold_out), `note` (localized); thêm `priceUpdatedAt` (date).
- `faqs` array (≤ 20): `question` (localized), `answer` (textarea localized).
- Pháp lý: **không thêm field** — gộp `legalInfo` + `documents` (PDF) sẵn có thành một khối "Pháp lý".
- Text localized mới vào danh sách trường dịch của projects; migration additive; regen types; `docs/ERD.md` §4.5.

## Acceptance
- [ ] Field mới đều tuỳ chọn, dự án cũ lưu không lỗi validate; migration additive up/down PASS

