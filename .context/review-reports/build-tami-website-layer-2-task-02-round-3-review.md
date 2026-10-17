Agent: reviewer

# Review: build-tami-website, layer-2-task-02, round 3 (delta after round-2 PASS)

Task: `tasks/tami-website/layer-2-task-02.md`: collections `provinces` + `wards`, administrative data, idempotent seed
Scope: the delta made after round 2 (`WARD_NAME_OVERRIDES`, n1, n2, n3, ERD §4.2). The overall uncommitted diff vs HEAD `08acf77` was re-verified with the configured commands.

## Review level
**STRICT**

## Reason
The blast radius is the same as round 2: schema/migration, a seed that runs in production, and static data that feeds public filters and rentals `searchText`. The delta changes the data pipeline and the generated JSON.

## Blast radius
- `scripts/build-admin-units.mjs` (new override map, `applyNameOverrides`, the n1 guard in `buildWards`; the alias for this ward is removed).
- `seed/data/administrative-units.json`: ward 40153016 name only.
- `tests/unit/admin-units.test.ts` (new test), `tests/integration/geo-seed.test.ts` (n2), `scripts/admin-units/vietnamese-key.ts` (comment), `docs/ERD.md` §4.2.
- DB: one `wards` row name is overwritten on reseed. The upsert key is `code`, and the slug does not change.

## Verify commands + result
The commands come from `.context/project-config.md`:

| Command | Result |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0: **102 files / 1060 tests passed** (+1 vs round 2) |
| `pnpm build` | exit 0 |

`git status --short` showed the same 25 entries before and after the run, so the verify commands left no side effects.

**JSON diff check:**
- `seed/data/administrative-units.json` is untracked, the same as the whole task. That means `git diff` cannot compare it with the round-2 version. `git diff --stat` covers only the 7 tracked files.
- What I checked instead:
  - Grep for "Đào Duy" finds exactly one match in the JSON: `{"provinceCode":"16","code":"40153016","name":"Phường Đào Duy Từ","type":"phuong","slug":"phuong-dao-duy-tu","legacyNames":["Phường Nguyên Bình, Thị xã Nghi Sơn","Phường Xuân Lâm, Thị xã Nghi Sơn"]`. This matches CSV rows 8291 and 8296.
  - "Đào Duy Tư" no longer appears anywhere in the data.
  - The EXPECTED counts and all converter invariants still pass, because the unit tests load the JSON.
- See Residual risk for what remains unverified.

## Responsive Checklist Gate
N/A: the diff has no UI.

## Skill gates
- aislop: skip, not among the allowed reviewer commands. A manual read found no dead code or speculative abstraction.
- oxlint (anti-slop): skip, oxlint not configured. `pnpm lint` passed.
- ocr: skip, ocr not installed / not allowed.
- AI-readable: OK, 0 indicators.
  - `applyNameOverrides` is 12 lines and `buildWards` is about 32 lines.
  - Comments explain why, and ERD §4.2 is updated (override map + fail conditions).
- ai-friendly-web: N/A (internal data).
- blitzstrike: N/A (offline converter, no new input surface).

## Delta verification
- **Override (`build-admin-units.mjs:46,117-129,244`):**
  - The override is keyed by ward code, which is unique.
  - It fails if the xlsx name is not the `from` value (compared after `clean`), and it fails if an entry is never used.
  - It runs before `assertDistinctWardKeys` and before matching and slugging. So the corrected name is what gets matched against the csv, and the collision guard checks the corrected name too.
  - The old alias for this ward is gone; `WARD_NAME_ALIASES` now has 10 entries.
  - The corrected name matches the CSV directly. The slug is unchanged because `slugify` strips tones. The seed upserts by `code`, so a reseed overwrites only `name`.
- **n1 FIXED (`:208`):** `buildWards` fails when a csv group has already been used, so the xlsx-to-csv-group mapping is now one-to-one inside the converter.
- **n2 FIXED (`geo-seed.test.ts:129-130`):** the test now deletes a real ward id as sale and still expects 403.
- **n3 partially FIXED:** see MINOR r3-1.
- Unit test `admin-units.test.ts:17-19` asserts the corrected name and the unchanged slug.

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]
- **r3-1. The comments in `scripts/admin-units/vietnamese-key.ts` now contradict each other.**
  - Line 2 (after the n3 fix) says "kiểu cũ hòa / kiểu mới hoà". This is the conventional naming.
  - Line 37 still says "về vị trí kiểu mới (hoà -> hòa, thuỷ -> thủy, uý -> úy)", which labels hòa as the new style.
  - Behaviour is unaffected because the key only needs to be deterministic.
  - Fix: reword line 37, for example "đặt về vị trí chuẩn hoá cố định (hoà -> hòa ...)", or "kiểu cũ" so it agrees with line 2.
- m2 from round 1 remains open (accepted: Payload cannot name a compound index).

## Residual risk
- The JSON is untracked, so I could not mechanically diff it against the round-2 version. "Only this ward changed" rests on three things:
  - the builder's statement;
  - the converter being deterministic, where the override touches only code 40153016;
  - the grep and test evidence above.
- I did not open the xlsx directly. The `from` guard would fail the build if the xlsx spelling differed.
- `aislop` / `ocr` were not run.

## Verdict
**PASS**: no CRITICAL or MAJOR findings. The delta matches the user's decision, n1 and n2 are closed, and all verify commands pass. The overall PASS from round 2 still holds. r3-1 is a cosmetic comment fix that can be done opportunistically.
