# feature-public-ui-market-vinhomes · phase-2-task-01 — Schema global Homepage cho các khối mới

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE schema · DB/migration → STRICT.

## Việc (theo chốt câu 2: thanh thông báo ở Homepage hay SiteSettings)
- `announcementBar` (group): `enabled`, `text` (localized), `link` (navLinkField); khoá "đã đóng" = hash nội dung để đổi chữ thì hiện lại.
- `heroSearch` (group): `enabled`, `placeholder` (localized), `chipProjects` (relationship projects, hasMany, ≤ 6; trống → dự án `isFeatured` mới nhất).
- `rentals` (group): `enabled`, `title`, `categories` (relationship categories scope rental, hasMany, ≤ 4; trống → danh mục đang có tin).
- `news` (group): `enabled`, `title`, `intro` (textarea localized), `posts` (relationship news, ≤ 3; trống → 3 bài mới nhất).
- `ctaBanner`: thêm `image` (upload ảnh), `secondaryLabel` (localized) + `secondaryLink`.
- `HOMEPAGE_BLOCKS` + `BLOCK_LABELS` thêm `rentals`, `news`; tab admin mới; các text localized mới vào danh sách trường dịch của homepage.
- Migration `pnpm payload migrate:create homepage_market_blocks`: chỉ ADD COLUMN nullable / bảng con mới / thêm giá trị enum (`ADD VALUE`), không phá huỷ. `migrate` + `migrate:down` + `migrate` trên `tami_wt_bl020`. Regen `src/payload-types.ts`.
- Docs: `docs/ERD.md` §4.15.

## Acceptance
- [ ] Admin thấy các nhóm mới, nhãn VI; dữ liệu cũ giữ nguyên; `blockOrder` cũ vẫn hợp lệ
- [ ] Migration additive, không HIGH_RISK; integration test global Homepage PASS

