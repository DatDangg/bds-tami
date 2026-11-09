Agent: spec-validator

# Spec validation: feature-homepage-partners-block (BL-107, FR-PUB-17), pre-plan, round 2

- Mode: Spec validation (round 2, after the delta was fixed)
- Round 1: `.context/review-reports/spec-validation-feature-homepage-partners-block.md` (FAIL: C1 HIGH, C2 MEDIUM, G1-G4)
- Delta checked: `SPECIFICATIONS.md:152` (working tree)
- Cross-checked against: `.context/design-spec.md:276,334-336,359-362`, `docs/BRD.md:192` (BR-07), `SPECIFICATIONS.md:135` (hero Dừng/Phát), `:156` (revalidate pattern), `src/collections/Developers.ts:5,9,20,39,50,57-58`, `tasks/feature-homepage-partners-block/phase-1-task-01.md`

## Verdict: PASS (delta). The task file must be updated before builder reruns (C3)

The delta closes every round 1 finding. It has no ❌, no HIGH conflict and no ⚠️ left. One MEDIUM conflict remains (C3), and it is between the **task file and the delta**, not inside the spec. The task file was not updated in this round. It still describes the round 1 behaviour, and the attempt-1 implementation follows that old behaviour. The delta is the source of truth (task `:4`), but the task's explicit lines contradict it. They must be fixed before builder or reviewer run again.

## Round 1 findings: status

| Finding | Round 1 | Delta now (`SPECIFICATIONS.md:152`) | Status |
|---|---|---|---|
| C1 HIGH: delta overrides design-spec S01 block 6 without saying so, and says "không là link (chưa có quyết định)" | design-spec `:335-336` | States the override: "Thay thiết kế khối 6 … ở hai điểm user chốt: dải chạy ngang + logo kèm tên; các điểm khác … giữ (tiêu đề căn giữa, grayscale + mờ, hover/focus về màu gốc, `website` hợp lệ là link tab mới `rel="noopener noreferrer"`)". The false "chưa có quyết định" sentence is gone. | Closed |
| C2 MEDIUM: falling back to the VI name on `/en` contradicts BR-07 | BRD `:192` | "`/en` theo BR-07: chỉ đối tác đã có bản EN … không lấy chữ VI thay". This matches `englishRequiredFields: ["name","slug"]` (`Developers.ts:57`) and BL-021 `:235`. | Closed |
| G1: revalidate | `Developers.ts` `route: null` | "Lưu / xoá chủ đầu tư đang hoặc vừa là đối tác → làm mới `/` và `/en` (ISR là lưới an toàn)". This follows the pattern at `:156`. | Closed |
| G2: WCAG 2.2.2 on touch screens | `:135` hero precedent | "nút Dừng / Phát nhìn thấy (như hero; cho màn cảm ứng, WCAG 2.2.2)". With reduced-motion the button is not shown. | Closed |
| G3: few partners | none | "≤ 4 đối tác → không chạy, hàng tĩnh căn giữa" | Closed (see N1) |
| G4: partner limit | task "vd 24" | "tối đa 24" | Closed |
| N1 r1: version | — | "MINOR 1.63.0" still needs a header bump at the publish step | Unchanged, check during spec-publish |

## Coverage matrix (user decision ↔ delta)

| Requirement | Source | Delta | Status |
|---|---|---|---|
| Show the block: logo + name, name only when logo is missing | change doc `:23` | yes | ✅ |
| Auto-scrolling marquee | change doc `:23` | yes (explicit override of design-spec `:336`) | ✅ |
| `blockOrder` / `partners.enabled` | `:141` BL-044 | yes | ✅ |
| Reduced-motion: no scrolling, all partners still readable | change doc `:23` | static strip wraps, no button | ✅ |
| Pause on hover / keyboard focus + Dừng/Phát button | change doc `:23` + WCAG 2.2.2 | yes | ✅ |
| No partners → hide block | change doc `:23`, design-spec `:336` | yes | ✅ |
| Title i18n default "Đối tác"/"Partners" | change doc `:23` | yes | ✅ |
| `/en` follows BR-07 | BRD `:192` | yes | ✅ |
| Link `website` opens in new tab, grayscale/hover | design-spec `:335` | kept | ✅ |
| Duplicate copy `aria-hidden` + `inert` | a11y | yes | ✅ |
| Revalidate `/`, `/en` | `:156` pattern | yes | ✅ |
| Limit 24, sort by `sortOrder` then name | ERD/Developers | yes | ✅ |
| Responsive 390/768/1440, no horizontal overflow, no schema/API change | NFR | yes | ✅ |

## Conflicts

### C3: MEDIUM. Task file and attempt-1 implementation do not match the round 2 delta
`tasks/feature-homepage-partners-block/phase-1-task-01.md` still says:
- `:20` "theo locale (tên EN fallback VI — xem spec)" and `:41` AC test "EN fallback". The delta (BR-07) does the opposite. Attempt 1 at `:49` uses `fallbackLocale: vi` and does not use `findPublicList` "vì nó lọc `hasEnglish` ở `/en`, trái spec". That reason no longer holds: the spec now requires the `hasEnglish` filter.
- `:51` "mục không là link" + vùng `tabIndex=0` + logo `decorative`. The delta requires a link to `website` (new tab, `noopener noreferrer`) when `website` is valid.
- The task has no Dừng/Phát button, no "≤ 4 → không chạy, căn giữa" rule, and no grayscale + mờ / hover-focus back to original colour. The delta requires all of them.
- AC `:36,40` do not yet cover the button, the ≤ 4 rule, links, or `/en` hiding partners that have no EN.
- Revalidate paths: attempt 1 uses `/vi` + `/en` (`:52`), the delta says `/` and `/en`. This is consistent with `:156` (`/vi` `/en` in internal routing), so it is not a conflict. The reviewer only needs to confirm that the actual home route is refreshed.

Required: change-request updates the task's Thiết kế, AC and test list to match the delta, then sends it back to builder (attempt 2). The reviewer must compare against the delta, not against task `:49-55`.

No new conflicts were found between the delta and BRD, design-spec, ERD, `:141` or `:156`.

## Gaps
None blocking (no [MISSING] / [PARTIAL]).

## Notes (non-blocking, for task/builder)
- N1 (G3 residual): the threshold counts items, not width. With 5-6 short items at 1440, two copies may not fill twice the strip width, so a gap or visible seam can appear. "Bản nhân đôi" should be read as "repeat until wide enough for a seamless loop". Extra copies are still `aria-hidden` + `inert`. The task should state this.
- N2: "≤ 4 → hàng tĩnh căn giữa" at 390. Four logo+name items do not fit in one row, so wrapping is needed to satisfy "không tràn ngang trang". This is a reading of the rule, not a conflict.
- N3: `alt`. Design-spec `:335` says `alt` = tên chủ đầu tư, and the delta "giữ các điểm khác". The name is now visible next to the logo, inside the same link, so alt = name makes screen readers read the name twice. The task should pick one of: alt empty + visible name as the link's accessible name, or alt = name + visible name hidden from screen readers. Each partner must be read exactly once (the delta's "trình đọc màn hình … gặp mỗi đối tác 1 lần").
- N4: With links in the strip, the region `tabIndex=0` (attempt 1, task `:59`) should be removed so Tab does not stop an extra time. Focusing a link still pauses through `focus-within`.
- N5: The Dừng/Phát button must not appear when there are ≤ 4 partners (no scrolling), the same as with reduced-motion. The delta implies this but does not say it; the task should state it.
- N6: Doc impact (task `:64`) must be updated to the new behaviour: design-spec S01 `:276,334-336,359-362` (marquee, name, button, ≤ 4), `docs/DESIGN.md`, revalidate map. The comment at `Developers.ts:9` ("render thành liên kết") is now correct again.
