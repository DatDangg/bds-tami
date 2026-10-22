Agent: spec-validator

# Spec validation (pre-build): BL-062, feature-news-list-detail-v2, round 1

- Mode: spec validation, run before the build.
- Date: 2026-10-23
- Inputs checked:
  - `spec/changes/2026-10-22-news-list-detail-v2.md`: requirements 1 and 2 (D1–D10), requirement 3 (mobile/tablet), Acceptance, and decisions Q1–Q5.
  - `SPECIFICATIONS.md`: line 90–95 (the "Tin tức v2" block), the two BL-062 annotations at line 67 (5) and line 70, F5 at line 172, and F9 at line 184.
  - Task files `tasks/feature-news-list-detail-v2/phase-1-task-01.md` and `phase-1-task-02.md`.
  - Design image `docs/specs/listing-detail-redesign/chi-tiet-tin-tuc-v2.webp`.
  - `.context/project-config.md` (migration gate), `src/payload.config.ts:95`, `src/components/forms/LeadFormSlot.tsx:25`, `src/app/(frontend)/[locale]/lien-he/page.tsx:106`, `spec/changes/BACKLOG.md:69,72`.

## Verdict: ✅ PASS

- No ❌.
- No HIGH conflict.
- 2 ⚠️, which is below the FAIL threshold of 3.
- The non-blocking items below should be fixed in the spec delta or at close-out. None of them blocks starting T01.

## Coverage matrix

| # | Requirement (change doc) | Spec delta (SPECIFICATIONS.md) | Task | Status | Note |
|---|---|---|---|---|---|
| L1 | Rename "Đọc nhiều" → "Được quan tâm nhiều" / "Most popular" | :91 | T01 Scope 2 | ✅ | Top-5 data source unchanged (:91) |
| L2 | "Đăng ký bản tin" block moves above it, with the same order below lg | :91 (order Bản tin → Được quan tâm nhiều → Chủ đề, same below lg) | T01 Scope 1 | ✅ | Test uses `compareDocumentPosition` (T01 Scope 4) |
| A0 | Author label "Bài viết bởi TAMI REAL ESTATE" everywhere, and the featured card "if present" | :92 (detail page) + :91 (featured card "TAMI REAL ESTATE") | Detail page → T02 Decision 11; featured card → T01 Scope 3 | ✅ | Each part is in exactly one task. Q1 is consistent with the change doc ("thẻ nổi bật danh sách nếu có") |
| D1 | Full-width cover hero, warm scrim, breadcrumb/chip/white h1/sapo/author row/4 share buttons | :93 (D1) | T02 Decision 1 | ✅ | The image matches: the hero is about 300px tall in a 941px-wide image, which is about 460px at 1440 |
| D2 | Cover image only in the hero; inline images keep rounded corners + caption | :93 (D2) | T02 Decision 2 | ✅ | JSON-LD still uses the cover image (T02) |
| D3 | Remove the frame around the opening paragraph; lead text, text-secondary | :93 (D3) | T02 Decision 3 | ✅ | |
| D4 | Table of contents + consult card stick together until just before "Bài viết liên quan"; numbered 01/02 circles; gold bar on the active item; long list scrolls inside | :93 (D4) | T02 Decision 4 (+ Q4) | ✅ | No form, links to `/lien-he` (F5 respected) |
| D5 | h2 keeps the numbered circle, about 22–24px; section content aligned with the heading text | :93 (D5, ≥ md) | T02 Decision 5 | ✅ | |
| D6 | Every `ul` gets ✓; `ol` keeps numbers | :93 (D6, "`ul` cấp gốc") | T02 Decision 6 | ✅ | See N3 (nested lists) |
| D7 | Contact box at the end of every article, text editable in admin vi/en, empty → default, "TAMI REAL ESTATE" is a link | :93 (D7) + :94 (schema) | T02 Decision 7 (+ Q2, Q3) | ✅ | See N1 (default wording) and N4 (plain text) |
| D8 | Pill tags without `#`, keep `?tag=`, hidden on `/en` | :93 (D8) | T02 Decision 8 | ✅ | |
| D9 | Related posts: white background, gold eyebrow, "Xem tất cả" link, 3 horizontal cards (16:7, chip + date, 2-line title, 2-line excerpt, gold arrow button, whole card clickable) | :93 (D9) | T02 Decision 9 | ✅ | |
| D10 | Keep the consult banner | :93 (D10) | T02 Decision 10 | ✅ | |
| M1 | Mobile hero: text full width, share buttons below the author row, scrim dark enough | **Missing from the spec delta** (D1 only describes ≥ lg) | T02 Decision 1 ("< lg: …") | ⚠️ PARTIAL | G1 |
| M2 | Below lg: no left column; TOC collapsed; consult card after the contact box | :93 (end of D4) | T02 Decision 4 (< lg) | ✅ | |
| M3 | Related posts: 1 column (390) / 2 columns (768) | :93 (D9: < sm / sm–lg / ≥ lg) | T02 Decision 9 | ✅ | |
| AC1 | List vi/en: title + order | :91 | T01 Acceptance | ✅ | |
| AC2 | 1440 matches D1–D10 next to image v2, with screenshots | :93 | T02 Scope 3 + Acceptance | ✅ | |
| AC3 | White hero text meets AA on the brightest image, ≥ 3 articles | :93 (D1 "đạt AA trên ảnh sáng") | T02 Scope 3 | ✅ | Spec does not state "≥ 3 articles", but the task does |
| AC4 | No cover → dark hero; no h2 → no TOC (consult card still sticks); no tags → no tag row; < 3 related → show what exists; 0 → hide | :93 (D1 no cover, D4 "chỉ khi có heading", D9 "0 bài → ẩn") | T02 Acceptance | ✅ | "No tags → hide row" is implicit (existing BL-054 behaviour). See N5 |
| AC5 | Sticky column from the start of the body to before "Bài viết liên quan"; TOC scrolls inside; active item updates | :93 (D4) | T02 Decision 4, Scope 3 | ✅ | |
| AC6 | Contact box: admin text, empty → default, link to the form | :93 (D7) | T02 Decision 7 | ✅ | |
| AC7 | `ol` does not become ✓; inline images + captions still show | :93 (D6, D2) | T02 Acceptance | ✅ | |
| AC8 | 1440/1024/768/390, vi + en, no horizontal overflow, clear keyboard focus | general (not restated in the delta) | T02 Scope 3 | ✅ | |
| S1 | Additive site-settings field (SAFE_ADDITIVE) | :94 | T02 Decision 7 (Schema + Migration) | ✅ | |
| DOC | Doc impact | :95 | T01 Scope 6, T02 Scope 4 | ✅ | |

Every change-doc requirement and acceptance item is assigned to exactly one task. Nothing overlaps between T01 and T02: T02 explicitly does not touch `NewsListPage` / `NewsMostRead` / `NewsFeaturedBlock`.

## Conflict check against existing rules

| Rule | Evidence | Result |
|---|---|---|
| F5: no form on the news detail page | `SPECIFICATIONS.md:172` ("chi tiết tin tức không có form"). D4 → `/lien-he`, "không form — F5" (:93). Q2 → link to the contact page. T02 Decision 4 and 7 | ✅ No conflict. The contact page has an anchor `id="lead-form"` (`LeadFormSlot.tsx:25`, used at `lien-he/page.tsx:106`), so `/lien-he#lead-form` works for Q2 |
| BR-07: no VI fallback on `/en` | `src/payload.config.ts:95` `fallback: false`. T02 Decision 7 "đọc KHÔNG fallback — BR-07" | ✅ Technically safe. The spec delta does not state it explicitly (N2) |
| F3 (spec-validation BL-054): no staff name | :92 "vẫn **không** đọc / hiện tên nhân viên `staff`", :70 | ✅ |
| Tags hidden on `/en` | :67 (5), :93 (D8 "`/en` ẩn"), T02 Decision 8 | ✅ |
| Migration gate (`db_tool: other`, `migration_required: true`) | :94 "chỉ ADD cột nullable — SAFE_ADDITIVE". T02: versioned, inspect SQL to keep only ADD, `down` = DROP COLUMN, drop any drift statements | ✅ See N6 (running `migrate` locally) |
| `no-raw-colors.test`, 1 `h1`, JSON-LD/canonical/ISR/beacon unchanged | :66, :94 "Không đổi API / quyền / URL / JSON-LD / beacon"; T02 header + Scope 1 | ✅ |
| Shared BL-061 sticky frame (3 other detail pages) | T02 Risk: reuses `DetailAsideFit` / `DETAIL_ASIDE_STICKY_CLASS` with no behaviour change | ✅ The reviewer should check the 3 other detail pages are unaffected |
| Intent docs not downgraded | The delta adds a new block that supersedes BL-054. It does not delete the BL-054 text, and it marks the superseded lines | ✅ |

## Decisions Q1–Q5

| Q | Assessment |
|---|---|
| Q1 featured card label "TAMI REAL ESTATE" (brand name only) | Reasonable. It follows the user's wording "thẻ nổi bật danh sách nếu có", and the card is narrow. The brand is now mixed: logo/"Gia nhập TAMI HOMES" vs "TAMI REAL ESTATE". The user chose this; the image footer also uses "TAMI REAL ESTATE". No violation |
| Q2 link to the contact page instead of an on-page form | Reasonable and required by F5. The anchor `#lead-form` exists, so the task should state it outright rather than "thêm neo nếu có" (N1) |
| Q3 `site-settings.newsDetail.contactNote` (localized textarea, nullable) | Reasonable. It reuses an existing global, the migration is additive, and access is unchanged |
| Q4 reuse BL-061 (`DetailAsideFit as="div"` + `--detail-aside-top`) | Reasonable, consistent with BL-061, no duplicated component |
| Q5 Spec Publisher once at close-out | This departs from AGENTS.md Feature rule 3b, which says to publish right after the spec delta. There is precedent: BL-061 (commit 7e97944) did the same, and test-scope then contains the files that actually changed. LOW. Accepted, but close-out must include the publisher step (spec_version + spec/updates + test-scope) |

## Gaps

### Blocking
None.

### Non-blocking (⚠️ = counted toward the threshold; N = note)

- **G1 ⚠️ [PARTIAL] Mobile hero is missing from the spec delta.** Change doc §3, first bullet: "Hero: chữ chiếm full rộng, cụm chia sẻ xuống dưới hàng tác giả; scrim đủ đậm". Only T02 Decision 1 covers it. `SPECIFICATIONS.md:93` D1 has no < lg rule.
  - Fix: add to D1 at :93: "< lg: chữ full rộng, cụm 'Chia sẻ' xuống dòng dưới hàng tác giả, scrim đậm đáy đủ AA".

- **G2 ⚠️ BL-054 sentences that conflict with BL-062 are not all marked.** The override clause at :90 ("thay các câu BL-054 tương ứng ở trên khi mâu thuẫn") covers them, but readers and testers can still be confused by:
  - :67 (3) still says the brand label is "TAMI HOMES"; the marker sits only at (5).
  - :68 is headed "'Đọc nhiều' = lượt xem thật".
  - :84 (as-built) says the author label is "Ban biên tập TAMI HOMES" and the opening paragraph is framed.
  - :89 lists the open item "sticky cột trái chi tiết tin ở màn lg thấp", which BL-062 D4 handles (change doc Ghi chú: "Liên quan BL-059 … xử lý chung trong D4").
  - Fix: add short markers "*(đổi bởi BL-062)*" at :67 (3), :68, :84. At close-out, record in BL-059 (`spec/changes/2026-10-22-news-careers-followups.md`, BACKLOG :69) that the "lg thấp" item is resolved by BL-062, or still open if verification at 1024 fails.

- **N1 The default contact text says "để lại thông tin bên dưới" but there is no form below (F5).** T02 Decision 7 uses the image's sentence as-is. Below the box is the consult card / `ConsultBanner` with a "Nhận tư vấn" button, so the wording is defensible, but the link goes to `/lien-he`.
  - Option: keep the image wording (the image is the reference standard), or change it to "…hoặc để lại thông tin tại trang Liên hệ" in vi/en.
  - Separately, change T02 Decision 7 from "thêm neo nếu có" to "→ `/lien-he#lead-form` (neo có sẵn `LeadFormSlot.tsx:25`)".

- **N2 BR-07 for `contactNote` is not stated in the spec delta.** It is safe because `fallback: false` (`payload.config.ts:95`) and T02 states it.
  - Fix (optional): add to D7 at :93: "`/en` rỗng → câu mặc định EN, không lấy chữ VI (BR-07)".

- **N3 "mọi `ul`" in the change doc vs "`ul` cấp gốc" in the spec/task.** Nested lists keep their current style. This narrows the requirement in a reasonable way (a ✓ inside a ✓ list would look odd).
  - Fix: write "danh sách lồng giữ kiểu hiện có" into the spec delta for clarity.

- **N4 Security: admin text must be rendered as plain text, never HTML.** T02 Decision 7 states this. The spec delta does not; it should, to prevent XSS from a free-text global field.
  - Fix: add "render text thuần" to D7.

- **N5 Edge case "no tags → hide the Thẻ row"** is implicit in the spec. Fix: add "không tag → ẩn hàng" to D8.

- **N6 Running migrate locally.** `.context/project-config.md:98` says `migration: pnpm payload migrate` is "KHÔNG auto-allow; chỉ chạy trong deploy staging/prod". T02 Decision 7 asks for `pnpm payload migrate` on the local dev DB.
  - This is not forbidden, since only `db push`/reset/seed are banned, but the builder may get a permission prompt.
  - Fix: if it is denied, the builder must stop and record a residual risk (Tool Loop Guard), and verify with the migration test plus a read of the SQL.
  - T01 Scope 7 uses `npx eslint <file scope>` while the config uses `lint: pnpm lint`. That is acceptable for a scoped run, but the reviewer should still run `pnpm lint` per the config.

- **N7 `/en` date format.** The change doc says "Ngày đăng: dd/mm/yyyy" but does not say what `/en` uses. T02 only adds "Published: {date}".
  - Fix: keep the date formatter that already exists for each locale (BL-052: `/en` MM/DD/YYYY), and note this in the task.

- **N8 Consult card height estimate.** T02 Decision 4 caps the TOC height using a guessed card height (~20rem). That is fragile across languages and font sizes.
  - Suggestion: rely on `DetailAsideFit` (it measures `--detail-aside-h`) and `DETAIL_ASIDE_STICKY_CLASS` (`min(top, 100dvh − h − 1rem)`), with the TOC `max-h` as a soft limit. The reviewer should check at 1024×768 (low lg) that both the TOC and the "Nhận tư vấn" button can be reached.

## Suggestions for builder / primary
1. Before T02, the primary should update `SPECIFICATIONS.md:93` for G1 (mobile hero) and add the G2 markers. Do it in the same spec-delta pass; it does not need to block T01.
2. T02 should use `/lien-he#lead-form` directly (N1) and keep the plain-text render (N4).
3. Close-out:
   - Spec Publisher (Q5).
   - Update BL-059 for the "lg thấp" item (G2).
   - Stage only the BL-062 hunks of `src/payload-types.ts` (T02 Scope 9).
