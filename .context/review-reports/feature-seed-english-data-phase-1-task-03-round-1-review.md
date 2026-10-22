Agent: reviewer

# Review — feature-seed-english-data · phase-1-task-03 · round 1 (BL-064)

- Scope: `seed/english/data/rentals.json` (32 records), `seed/english/data/property-posts.json` (38 records), uncommitted. The engine was committed in 4f9809f and is out of scope. T02/T04 data files are out of scope.
- **Review level: NORMAL**
- **Reason:** data-only change (JSON seed, EN locale, local dev DB). No `.ts`, schema, API, auth or shared code. Not FAST because the task mainly needs a translation-quality and convention check over 70 records plus DB idempotency evidence.
- **Blast radius:** `/en` pages for rentals (`/en/for-rent/*`) and property posts (`/en/property-news/*`) on dev DBs seeded with `pnpm seed:english`. `rentals_locales` / `property_posts_locales` rows with `_locale='en'`, `has_english`, `translation_*`. EN slugs are generated once from EN titles and then frozen. EN media alts are derived from EN titles by the `media` group. No staging/prod impact, because the engine blocks non-dev DBs.

## Verify commands + result (all against the LOCAL dev DB `127.0.0.1:5433/tami`)

| Command | Result |
|---|---|
| `pnpm seed:english:export rentals <scratch>` / `property-posts <scratch>` | 32 / 38 vi records exported (read-only) |
| Structural diff script (scratch): keys, field sets, richText array lengths, empty strings, Vietnamese diacritics, numbers, identical vi=en strings | Keys 32/32 and 38/38 match vi titles. 0 missing/extra records. 0 missing/extra fields. **0 richText length mismatches.** 0 empty. 0 untranslated (vi==en) strings. 0 Vietnamese diacritic chars. All number diffs checked by hand: they come from `m2`→`m²`, `2PN`→`2 bedrooms`, `1 lần/tuần`→`once a week`, `10/2026`→`October 2026`, `3.4.5.6`→`3, 4, 5, 6`, so no price or area was changed |
| Coverage SQL (`has_english`, `deleted_at is null`) | rentals **32/32**, property_posts **38/38** |
| Locale column counts | en and vi identical: rentals title/description/slug 32. property_posts title/excerpt/content 38, price_note 37 (vi also 37), slug 38. legal_note/SEO are null in both locales, so there is nothing to translate |
| `translation_en_source/status` (rentals) | `manual` / `done` ×32 |
| md5 fingerprint of vi + en locale rows, before vs after a rerun | unchanged (vi_r 2e2abb…, vi_p 729fce…, en_r 11cd86…, en_p 0a62b6…). `max(updated_at)` unchanged |
| `pnpm seed:english rentals property-posts` (rerun) | rentals `ghi 0, không đổi 32, thiếu bản vi 0, lệch/lỗi 0`. property-posts `ghi 0, không đổi 38, thiếu bản vi 0, lệch/lỗi 0`. **Idempotent** |
| Media alt check: vi alts matching `- ảnh` pattern with missing or Vietnamese EN alt | **0**. Sample EN alt: "3rd-floor office space for rent in Tower N01 T2, … - photo 2" |
| `pnpm vitest run tests/unit/seed-english-format.test.ts` | PASS 7/7 |
| typecheck/build | skip: no `.ts` changed |

I did not rerun the `media` group myself. A rerun now would also write alts for T02/T04 records whose EN titles change concurrently, so I avoided cross-task interference.

## Translation quality (sample: all 32 rentals; all 38 property posts, with deduped boilerplate)

Read side by side vi→en: D'Le Roi Soleil ×3, Kosmo, D'Eldorado ×4, CityOn Imperia ×2, Từ Hoa ×2, Xuân Diệu serviced/office ×3, Tô Ngọc Vân ×2, Vinhomes Cổ Loa offices ×2, N01 T2 / N03T7 Ngoại Giao Đoàn, Trấn Vũ basement. Property posts: sample posts + voucher `offer.terms`, Kosmo, D'Eldorado, all Starlake boilerplate, Elegant Park villas/townhouses/shophouse, Vinhomes Olympic Ngọc Hồi villas/townhouses.

- English is natural, complete (nothing summarised or dropped) and accurate. Real-estate terms are correct: "fully furnished", "deposit" ("3 months' rent plus 1 month deposit" for "3 cọc 1"), "lease of 12 months or more", "handover", "shell-only build", "exterior finished", "adjoining townhouse / semi-detached / detached villa", "shophouse", "legal status", "inventory list", "sales policy", "frontage", "rooftop room", "Ring Road 3.5", "National Highway 1A", directions (northeast-facing balcony, due south, etc.).
- Prices and units are preserved and consistent: tỷ → billion VND, triệu → million VND, `USD 2,300/month`, `VND 200,000/m²/month`, `8tr2` → 8.2 million VND, m² kept.
- Inconsistencies inside the vi source (e.g. title "mid-floor" vs "Floor: High floor"; 96 m² post title southeast vs body northwest; "Ha Long port city" in a Cổ Loa listing) are reproduced faithfully. That is correct behaviour for a translation and not a defect of this task.

## Findings

### [MAJOR] M1 — Proper nouns lose their Vietnamese diacritics, which contradicts the README convention the task requires and conflicts with T02 data
- The task says "Tên riêng … theo quy ước ở README T01" (proper names follow the README T01 convention).
- `seed/english/README.md:62` says: keep proper names (projects, places, streets) **"giữ nguyên dấu tiếng Việt trong tên riêng"** (keep their Vietnamese diacritics). Line 65 forbids diacritics only **outside** proper names.
- The builder removed every diacritic ("Đã kiểm: không còn dấu tiếng Việt trong dữ liệu EN" — "checked: no Vietnamese diacritics left in the EN data"). Examples:
  - `rentals.json:51` "Kosmo Tay Ho"; `:99` "Nguyen Hoang Ton"; `:207` "Xuan Dieu"; `:383` "Ngoai Giao Doan"; `:396` "Vinhomes Co Loa"; plus Tu Hoa, Yen Hoa, To Ngoc Van, Dang Thai Mai, Trinh Cong Son, Nguyen Khac Hieu, Vo Chi Cong, Tran Vu, Ba Dinh, Bac Tu Liem, Ha Long.
  - `property-posts.json:34` "Nguyen Hoang Ton"; `:302/:317/:332…` "Elegant Park Thach Ban"; "Vinhomes Olympic Ngoc Hoi"; "Ngoc Hoi station".
- The T02 data in the same feature (`projects.json`) follows the README: "Thạch Bàn" ×7, "Tây Hồ" ×14, "Ngọc Hồi". So `/en` would show the project "Elegant Park Thạch Bàn" while its listings say "Elegant Park Thach Ban".
- The builder's justification in the task file (Verification summary line 35: "địa danh/tên dự án không dấu trong tiêu đề giữ như bản vi", i.e. place/project names without diacritics kept as in the vi title) is factually wrong. The vi titles do have diacritics, e.g. "Bán biệt thự đơn lập Elegant Park Thạch Bàn …".
- **Fix:** restore the diacritics of proper names (project/place/street/ward/district names) in both files, matching the vi spelling. Keep "Hanoi" vs "Hà Nội" consistent with T02. Then:
  1. Run `pnpm seed:english rentals property-posts`. Slugs are frozen and slugify strips diacritics anyway, so URLs are unaffected.
  2. Run `pnpm seed:english media` again to refresh the derived alts.
  3. Rerun to confirm 0 writes, and update the Verification summary.
- If the team prefers diacritic-free English, change the README convention through the CR, align T02/T04, and log the decision. Do not leave the inconsistency silent.

### [MINOR] m1 — "Direction: Cool" is a literal translation
- `rentals.json:493` translates vi "Hướng: mát" as "Direction: Cool". It reads oddly in English.
- **Suggest** "Direction: Cool, airy aspect" or "Orientation: Well-ventilated".

### [MINOR] m2 — Media group run outside the filtered command (accepted)
- The builder ran `pnpm seed:english rentals property-posts media` beyond the instructed filter. This is acceptable:
  - the `media` group writes only EN `alt`, derived from existing EN titles;
  - it is idempotent according to the builder log (`ghi 0, không đổi 264` on the 2nd run);
  - my gap query found 0 template alts missing EN.
- It can also touch alts of other collections that already have EN titles, so in parallel runs record which alts were written.
- After M1, alts need regenerating (see fix above).

### Residual (not counted)
- Non-localized fields (address/ward/province, e.g. "Phường Ba Đình, Hà Nội") stay Vietnamese on `/en`. They are outside the translatable allowlist.
- The "Negotiable" price display on rentals is app display logic, not seed data.
- I did not visually re-check `/en` (no browser/app run by the reviewer). The builder's HTML text check is the evidence.

## Gates
- Responsive Checklist Gate: **N/A**. The diff touches no UI (route/component/CSS); it is JSON data only.
- aislop: **N/A**, no code in the diff (JSON data only).
- oxlint (anti-slop): **N/A**, no TS/JS changed.
- ocr (open-code-review): **skip**, no code changed (and not required).
- AI-readable: **N/A** (data files). 0 indicators.
- ai-friendly-web: **N/A** (dev seed data, not a public-surface config change).
- blitzstrike: **N/A** (not STRICT, no auth/input surface).

## Verdict: FAIL

1 MAJOR (M1: proper-noun convention violated and inconsistent with T02 data; the builder's stated rationale is incorrect). Everything else passes: completeness, richText element counts, translation quality, prices/units, 100% `has_english`, idempotency, vi untouched. After the M1 fix, round 2 needs only:
1. a diacritics check on the proper nouns;
2. a rerun showing 0 writes;
3. confirmation that the media alts were refreshed.
