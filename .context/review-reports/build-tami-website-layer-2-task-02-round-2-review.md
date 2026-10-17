Agent: reviewer

# Review: build-tami-website, layer-2-task-02, round 2

Task: `tasks/tami-website/layer-2-task-02.md`: collections `provinces` + `wards`, administrative data, idempotent seed
Scope: whole uncommitted diff vs HEAD `08acf77` (`.claude/launch.json` ignored). Round 1 report: `build-tami-website-layer-2-task-02-round-1-review.md` (FAIL, M1).

## Review level
**STRICT**

## Reason
Schema/migration (new tables, enum, FKs, columns on `payload_locked_documents_rels`), a seed that runs in production, static data that feeds public filters and rentals `searchText` (LGL-01), a shared `pnpm seed` runner, and access control. Round 1 failed on data correctness.

## Blast radius
- DB: `provinces`, `wards`, `wards_legacy_names`, `enum_wards_type`, `payload_locked_documents_rels` (`provinces_id`, `wards_id`).
- `src/payload.config.ts`, `src/payload-types.ts`, `src/collections/Provinces.ts` (new `beforeDelete` hook), `src/collections/Wards.ts`.
- Seed: `seed/index.ts`, `seed/geo.ts`, `scripts/seed.mjs`, `scripts/seed-run.ts`, `package.json` (`seed` script, `engines.node >=22.18`).
- Data pipeline: `scripts/build-admin-units.mjs`, `scripts/admin-units/vietnamese-key.ts` (new), `scripts/admin-units/read-xlsx.mjs`, `seed/data/administrative-units.json`.
- Downstream (not built yet): rentals/projects relations, the public province/ward filter, and rentals `searchText` (reads `legacyNames`).

## Verify commands + result
All commands come from `.context/project-config.md`:

| Command | Result |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0: **102 files / 1059 tests passed**. The integration suite ran against the DB (schema pull visible) |
| `pnpm build` | exit 0 |

`git status --short` was identical before and after the run, so the verify commands left no side effects. I started no long-running processes.

## Responsive Checklist Gate
N/A: the diff has no UI (no route, component or CSS).

## Skill gates
- aislop: skip, not among the allowed reviewer commands. A manual read found no dead code and no speculative abstraction.
- oxlint (anti-slop): skip, oxlint not configured. `pnpm lint` passed.
- ocr: skip, ocr not installed / not allowed.
- AI-readable: OK, 0 indicators.
  - `build()` is now 9 lines (m7 fixed), and `buildWards` is about 31 lines.
  - Names are clear, comments explain WHY, and indirection is 2 levels or fewer.
  - ERD §4.2 is updated.
- ai-friendly-web: N/A (internal data/schema).
- blitzstrike: N/A. There is no new public input surface. The converter is an offline tool reading a committed file.

## M1 re-verification (round 1 MAJOR)

### Normaliser correctness: `scripts/admin-units/vietnamese-key.ts`
**The key is safe by construction.**
- `normalizeToneOfSyllable` removes only the 5 tone marks (U+0300/0301/0303/0309/0323). Breve, circumflex and horn are kept, and so are the base letters, including `đ`.
- It then puts the single tone back at `toneIndex(bare)`, which depends only on the bare letters.
- So the key of a word is a function of (bare letters, tone) and nothing else:
  - The same word written with the tone in a different place always gives the same key.
  - Two words get the same key only if they have the same letters and the same tone, i.e. they are the same word.
- Even if `toneIndex` picked a non-standard position, it could not merge different words. It could only render the key oddly.
- Outside the syllable step, the only folds are:
  - case;
  - runs of whitespace;
  - curly or backtick apostrophes to a straight one;
  - long dash variants to `-`;
  - a leading `Tp`/`Tp.` to `Thành phố`.
- None of these folds can merge two genuinely different ward names. Spaces and dashes are not removed, which is why `B' Lao` and the `- Lâm Hà` entries are still explicit aliases.

NFD ordering check: `ệ` decomposes to e + U+0323 + U+0302 (dot below has the lower canonical combining class). Removing U+0323 leaves `ê`, and NFC of `ê` + tone gives `ệ` again. `ợ`/`ự` (horn + dot) behave the same way.

Edge cases I traced through `toneIndex` (all correct):

| Case | Examples |
|---|---|
| `qu` onset | quá, quỳ, quý, quảng, quốc, quyền (ê wins) |
| `gi` onset | giá, giữ, giếng, giường (ơ). `gì` and `gìn` treat i as the vowel because the next letter is not a vowel |
| `uy` / `oa` / `oe` open syllable | thủy, hòa, khỏe: first vowel |
| `uy` / `oa` / `oe` with final consonant | huých, hoàn, toán: second vowel |
| 3-vowel clusters | ngoài, khuỷu: middle vowel |
| `ươ` | người, trường, tươi: ơ (search from the right for a modified vowel) |
| `iê` / `yê` | biển, yến, Nguyễn: ê |
| `uô` | muốn, uôi: ô |

`tests/unit/vietnamese-key.test.ts` covers most of these cases, plus NFD/NFC equivalence and the 8 round-1 pairs.

### Converter guards (`scripts/build-admin-units.mjs`)
- `assertDistinctWardKeys` (`:162-170`) fails when two xlsx wards in the same province share a key.
- `readLegacyIndex` (`:129`) fails when the csv spells one key in two different ways.
- Alias table (`:26-40`) has 11 entries (1+1+8+1), and each must be used.
- Missing csv groups, unused csv groups and EXPECTED counts are still enforced.

### Data spot checks (JSON vs CSV)
The 8 round-1 pairs now have distinct, correct `legacyNames`:
- HCM `Xã Thạnh An` (70143168) = ["Xã Thạnh An, Huyện Cần Giờ"], matching CSV 1691. It has no Dầu Tiếng names.
- HCM `Xã Thanh An` (71113062) = An Lập / Thanh An / Thanh Tuyền / Định Hiệp, all Dầu Tiếng, matching CSV 2072/2080/2082/2085.
- Đồng Nai `Xã Lộc Thạnh` (70705064) = Lộc Hòa + Lộc Thạnh, matching CSV 10066/10075. `Lộc Thành` maps to CSV 10073/10076 (Lộc Thành + Lộc Thịnh), which is a separate group.
- Đồng Tháp `Tân Thạnh` (80311075) = Phú Lợi + Tân Thạnh, matching CSV 10541/10550. `Tân Thành` (80305059) = Thông Bình + Tân Thành A, matching CSV 10567/10571.
- Hải Phòng `Cẩm Giang` / `Cẩm Giàng`, Thái Nguyên `Văn Lang` (Na Rì) / `Văn Lăng` (Đồng Hỷ), Quảng Ngãi `Sơn Hạ` / `Sơn Hà` and `Ba Tô` / `Ba Tơ`, Tây Ninh `Tân Thành` / `Tân Thạnh`: all distinct, and the names match their own former district/commune.
- Thanh Hóa alias: `Phường Đào Duy Tư` (40153016) = Nguyên Bình + Xuân Lâm (TX Nghi Sơn), matching CSV 8291/8296. These are the only two "Đào Duy" rows in the CSV, and there is only one "Đào Duy" ward in the JSON, so the alias maps the same ward. The name keeps the xlsx spelling until the user decides; per instructions, not a finding.
- `Phường B' Lao` (Lâm Đồng) matches CSV 5239/5241/5244. `Phường Hoàn Kiếm` (Hà Nội) matches CSV 899-1004 (14 rows, including Điện Biên from Ba Đình).
- New unit tests (`tests/unit/admin-units.test.ts:51-66`) check that no two wards in a province share an identical sorted `legacyNames` set, and that Thạnh An contains no Dầu Tiếng names.

**M1: CLOSED.**

## Round-1 minors
- m1 FIXED: `Provinces.ts:6-11,23`. `beforeDelete` counts wards with `overrideAccess` and the same `req`, then throws `APIError` 409. Integration test at `geo-seed.test.ts:154-159`.
- m2 OPEN (accepted): the generic `province_slug_idx` name stays because Payload's compound index cannot be named. A migration-time collision would be loud.
- m3 FIXED: `engines.node >=22.18`.
- m4 FIXED: asserts the specific `--sample` production message (`geo-seed.test.ts:168`).
- m7 FIXED: `build()` is split.
- m8 FIXED: ERD §4.2 as-built covers codes, sources and regeneration, the match-key rules, the `legacyNames` shape and the flatten note for `searchText`, derived fields, delete behaviour, and the reseed overwrite.

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]
- **n1. The converter does not itself enforce that xlsx-to-csv-group mapping is one-to-one.** `scripts/build-admin-units.mjs:182`: a wrong alias target pointing at another ward's group would still pass every converter invariant. Today only the unit test (`admin-units.test.ts:51`) catches it, after the JSON is written. Suggested fix: in `buildWards`, `fail()` when `entry.used` is already true before setting it.
- **n2. Test calls `payload.delete({ collection: "wards", id: province.id, ...asSale })`** at `tests/integration/geo-seed.test.ts:129`. It uses a province id against `wards`. It still asserts 403, because access is checked first, but the intent is muddled. Use a ward id.
- **n3. Comment wording.** `vietnamese-key.ts:2` calls "hoà" the old style and "hòa" the new style. The usual naming is the reverse. Matching is unaffected because the key only needs to be deterministic. Cosmetic.
- m2 from round 1 remains open (accepted, see above).

## Residual risk
- I did not open the xlsx directly (no allowed reader). xlsx fidelity rests on the converter invariants, the unit tests and the code/name spot checks.
- `aislop` / `ocr` were not run.
- The `Đào Duy Tư` vs `Đào Duy Từ` display name is pending a user decision.
- The reviewer shell cannot execute the normaliser ad hoc. Its correctness was checked by reasoning (the key depends only on bare letters + tone) and by the passing unit tests.

## Verdict
**PASS**: no CRITICAL or MAJOR findings. M1 is closed with a correct normaliser, collision guards, 16 corrected wards and regression tests. Recommend fixing n1 and n2 opportunistically.
