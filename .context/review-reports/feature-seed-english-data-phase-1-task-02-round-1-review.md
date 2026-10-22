Agent: reviewer

# Review — feature-seed-english-data · phase-1-task-02 · round 1 (BL-064)

- **Review level:** NORMAL
- **Reason:** Data-only change: one JSON seed file, `seed/english/data/projects.json`, uncommitted. No `.ts`, schema, API, auth or shared code was touched. The writes go to the local dev DB, locale `en` only. FAST is not enough because the main risk is translation quality and completeness, and that has to be spot-compared against the vi source.
- **Blast radius:** `projects_locales` (`_locale='en'`), `projects.has_english` / `translation_*`, and the EN alt text of project media in the local dev DB. On the site this affects `/en/projects*` content. Staging/prod are blocked by `checkSeedEnvironment` and were not touched. The file is committed into the repo and runs at the end of `pnpm seed --sample` / `seed-scraped`.

## Verify commands + result
All runs used the local dev DB (`DATABASE_URL=…@127.0.0.1:5433/tami`, container `tami-postgres`). Staging/prod were not touched.

| Command | Result |
|---|---|
| SQL `count(*) filter (where has_english), count(*) … from projects` | 61 / 61 live (0 soft-deleted) |
| SQL: live projects whose EN title/summary/overview/slug is empty | 0 |
| SQL: media with vi alt `… - ảnh…` that have EN alt | 461 / 461 |
| `pnpm seed:english:export projects <scratchpad>/projects-vi.json` | exported 61 records (read-only) |
| `pnpm seed:english projects` (idempotency) | `ghi 0, không đổi 58, thiếu bản vi 0, lệch/lỗi 0` |
| md5 of all `projects_locales` vi rows before and after the run | `32258d68…2e` = `32258d68…2e`. vi unchanged. `max(updated_at)` and `_projects_v` count (359) also unchanged, so no new versions |
| `pnpm exec vitest run tests/unit/seed-english-format.test.ts` | PASS 7/7 |
| Scripted structural diff, data vs vi export (scratchpad script) | 58 keys, all match vi titles; 0 unknown keys; 0 missing fields; 0 extra fields; 0 richText length mismatches; 0 empty strings; 0 lowercase Vietnamese words in EN. The only strings left identical to vi are proper-noun titles and image captions such as "Minh Giang Đầm Và 1" |
| Digit-preservation scan | 5 differences, all checked by hand and all legitimate reformatting ("Tháng 10–11/2026" → "October–November 2026", "06 tòa" → "6 buildings", "01/11/2022" → "1 November 2022"). Nothing dropped |
| Overview EN/VI length ratio | 0.89–1.64. The lowest (Thanh Xuân Valley, 0.89) was read in full: complete, nothing summarised |

The 3 vi keys missing from the data file are the sample projects (Sông Sài Gòn / Tây Hồ / Trung Tâm Hà Nội). They already have EN from `seed/sample`, which the README allows, and `has_english` is true for them.

## Quality sample (≥10 records, vi→en compared)
Read every string side by side for these records: Thung Lũng Thanh Xuân Valley (18-node overview, amenities ×6 name+desc, nearbyAmenities ×8), Rose Valley Mê Linh, Park Hill Thành Công (products ×2), Q'Terra Quy Nhơn, Dự án mẫu Biệt thự ven biển Đà Nẵng, Vinhomes Liên Hà, Masterise Homes Thủy Nguyên (17 nodes), The Crown Đại Hoàng Sơn (products ×4), Noble Palace Tây Hồ Ciputra. Also checked price/percentage strings from Starlake, Times Square, Avenue Alluvia, Sunrise Bay, Diamant Bleu, plus the 5 digit-diff strings (MIK Vũ Yên, UDIC, Centerville, Thư Lâm).

- The English reads naturally and matches the vi. Terminology is correct: developer, semi-detached/detached villa, shophouse, shell-and-core, pink book, handover, building density, Investment policy approval, Provincial People's Committee, 1/500 detailed master plan.
- Proper nouns keep their diacritics. Company names follow the README ("Vĩnh Sơn JSC", "Quy Nhơn 68 Investment Co., Ltd.", "Tập đoàn Bim Group" → "Bim Group").
- Units and prices are kept and formatted consistently ("4.988 tỷ đồng" → "VND 4,988 billion", "31,31%" → "31.31%", m² kept).
- No paragraph is summarised or dropped. The amenity glossary is consistent across records.
- `[hotline TAMI]` (Noble Palace Tây Hồ overview[8], Masterise overview[7]): this is an artifact in the vi source. A scraper sanitiser replaced digits in "1xx - 370m²" and "3x m" with the placeholder. The EN cannot invent the missing numbers, so mirroring vi is the correct choice for a translation. Fixing it belongs in the vi data/scraper, outside this task → residual.

## Findings
- **[CRITICAL]** none.
- **[MAJOR]** none.
- **[MINOR]** `seed/english/data/projects.json`, "Thung Lũng Thanh Xuân Valley" `summary`: "…promising to be an ideal resort destination with 1-0-2". "có 1-0-2" is the Vietnamese idiom "one of a kind", and the vi is truncated there. Suggested fix: "…an ideal, one-of-a-kind resort destination". Also the title "Thanh Xuân Valley" drops "Thung Lũng" ("Valley" is a duplicate), which is acceptable.
- **[MINOR]** Some field labels are stiff: "Management and operation unit" (Thanh Xuân overview[7]) → "Operator"; "Development unit" (Q'Terra overview[3]) → "Development partner"/"Developed by"; "Land use form: Separate book for each plot" (Masterise overview[15]) → "Land tenure: separate pink book per plot". Optional polish.
- **[MINOR]** "m2" vs "m²" is mixed inside a record (e.g. Masterise overview[11] "90 m2", Noble Palace overview[9] "42,000 m2"). It mirrors the vi source, but the README says to keep units consistent; normalising to "m²" would be cleaner.
- **[MINOR]** Builder Verification summary (task file l.32) says it translated "floorPlans title" and "legalInfo/salesPolicy của mẫu". The data file has no `floorPlans.*`, `legalInfo` or `salesPolicy` keys, and the vi export has none either (0 missing fields), so the wording overstates coverage. No functional impact. Suggest correcting the summary line.

## Skill gates
- aislop: N/A (no code in diff, JSON data only)
- oxlint (anti-slop): N/A (no TS/JS changed)
- ocr (open-code-review): skip, ocr not installed / data-only
- AI-readable: OK (data file; 0 indicators)
- ai-friendly-web: N/A (seed data, no public route/infra change)
- blitzstrike: N/A (not STRICT, no auth/input surface)
- Responsive Checklist Gate: N/A (no UI code/CSS in diff)

## Residual risk
- `projects.address` and `nearbyAmenities.distance` are not localized, so Vietnamese still shows on `/en` (e.g. "15 phút"). Fixing this needs a schema change; out of scope for seed data. Separate task.
- The `[hotline TAMI]` placeholder in the vi source corrupts 2 numeric values in both locales. Clean the vi data / fix the scraper sanitiser in a separate task.
- The 3 sample projects keep their older EN from `seed/sample` and were not re-reviewed here.
- I did not render `/en` pages (reviewer does not run the app). EN completeness was checked through the DB and the data file.
- Only a sample of about 15 records was read in full. The other ~43 were covered by the automated structural checks and the Vietnamese-word and digit checks only.

## Verdict
**PASS.** No CRITICAL or MAJOR findings. All 4 findings are MINOR and optional to fix.
