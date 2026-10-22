Agent: reviewer

# Review: feature-seed-english-data, phase-1-task-03, round 2 (BL-064)

- **Scope:** two uncommitted files, `seed/english/data/rentals.json` (32 records) and `seed/english/data/property-posts.json` (38 records). This round checks the builder's "Fix round 1" (M1 and m1 from round 1). Engine, T02 and T04 are out of scope.
- **Review level: NORMAL**
- **Reason:** the change is JSON seed data only, written to the EN locale of the local dev DB. It touches no `.ts` code, schema, API, auth or shared code. Round 1 already covered the full translation-quality pass; round 2 only checks the fix and runs the regression checks.
- **Blast radius:** `/en` pages for rentals and property posts on dev DBs seeded with `pnpm seed:english`. This covers `rentals_locales` and `property_posts_locales` (`_locale='en'`), and the EN alts in `media_locales` derived from EN titles. The engine blocks non-dev DBs, so staging and prod are not affected.

## Verify commands + result

All commands ran against the LOCAL dev DB `127.0.0.1:5433/tami` (`.env.local`). Staging and prod were not touched.

| Command | Result |
|---|---|
| `pnpm seed:english:export rentals <scratch>/vi-rentals.json` and `property-posts <scratch>/vi-pp.json` | Exported 32 and 38 vi records (read-only) |
| Scratch script: keys, fields, recursive array lengths, empty strings | Records 32/32 and 38/38. 0 missing, 0 extra. **0 structural issues: richText element counts still match.** 0 empty strings |
| Scratch script: every accented token in EN vs the vi word set | Every accented EN token exists in the vi source. **0 accented fragments that are not vi words**, so the replacement damaged no English words |
| Scratch script: every capitalized vi name pair with diacritics, stripped, then searched in EN | **0 diacritic-free name pairs left** (Hà Nội is excluded on purpose because "Hanoi" is used) |
| Proper nouns now in EN | rentals: Kosmo Tây Hồ, Xuân Diệu, Từ Hoa, Yên Hoa, Tô Ngọc Vân, Đặng Thai Mai, Trịnh Công Sơn, Nguyễn Khắc Hiếu, Võ Chí Công, Nguyễn Hoàng Tôn / Ng Hoàng Tôn, Ngoại Giao Đoàn, Bắc Từ Liêm, Ba Đình, Trấn Vũ, Vinhomes Cổ Loa, Hạ Long, AEON Mall Long Biên. property-posts: Elegant Park Thạch Bàn ×54 (plus "Elegant Thạch Bàn" ×3, spelled the same way in vi), Vinhomes Olympic Ngọc Hồi, D'Eldorado Nguyễn Hoàng Tôn, Tứ Trạch. "Hanoi" appears 1 time in rentals and 9 times in property-posts, with 0 "Hà Nội" and 0 "Ha Noi" |
| Consistency with T02 | `projects.json` has Thạch Bàn ×7, Tây Hồ ×14, Ngọc Hồi ×1 and "Hanoi" ×94. These match T03 |
| m1 | `Orientation: well-ventilated (cool)` is in the JSON and in the DB (1 row). The text "Direction: Cool" is gone |
| `pnpm seed:english rentals property-posts` | rentals: `ghi 0, không đổi 32, thiếu bản vi 0, lệch/lỗi 0` ("0 written, 32 unchanged, 0 missing vi, 0 mismatch/error"). property-posts: `ghi 0, không đổi 38, thiếu bản vi 0, lệch/lỗi 0`. **Idempotent** |
| `pnpm seed:english media` | `ghi 0, không đổi 481, chưa có EN 0` ("0 written, 481 unchanged, 0 without EN"). **Idempotent**. EN alts already refreshed, e.g. "Elegant Park Thạch Bàn - additional photo 5". 0 EN alts still use the diacritic-free names |
| md5 of vi and en locale rows and of `media_locales`, before vs after both reruns | Unchanged: vi_r 97c040…, vi_p bc2992…, en_r 1ddc6e…, en_p 02e968…, media fdf783…. `max(updated_at)` unchanged |
| Coverage (`has_english`, `deleted_at is null`, via `docker exec tami-postgres psql -U tami -d tami`) | rentals **32/32**, property_posts **38/38** |
| DB reflects the fix | EN rental titles containing Tây Hồ, Xuân Diệu, Cổ Loa or Ngoại Giao Đoàn: 11. EN property-post titles containing Thạch Bàn or Ngọc Hồi: 24. EN slugs with non-`[a-z0-9-]` characters: 0 |
| vi untouched | Rentals where vi title = en title: 0. The vi export keys still equal the original vi titles (32/32 and 38/38 match the JSON keys). The engine writes only locale en, as reviewed in round 1. The round 1 md5 values came from a different query, so they cannot be compared directly. The before/after md5 in this round shows no vi write |
| `pnpm vitest run tests/unit/seed-english-format.test.ts` | PASS 7/7 |
| typecheck/build | skip: no `.ts` changed |

## Findings

### Round 1 items
- **M1 (MAJOR): RESOLVED.** Proper nouns now keep the vi spelling and diacritics, following `seed/english/README.md:62` and matching `projects.json`. The script found no damaged English words and no diacritic-free names left. The media alts were refreshed and are idempotent.
- **m1 (MINOR): RESOLVED.**

### New
- **[MINOR] m3: "Tây/Đông tứ trạch" is translated as a plain compass direction.** In the vi source this is a feng-shui house group, not a compass direction:
  - Tây tứ trạch = West group (W/NW/SW/NE).
  - Đông tứ trạch = East group.
  - Affected EN text in `property-posts.json`: "west-facing (Tứ Trạch direction)", "Direction: West (Tứ Trạch)", "east-facing door (Tứ Trạch direction)", "Direction: East (Tứ Trạch)".
  - The EN text narrows the meaning. It does not block this round.
  - Suggested fix: "West-group (Tây tứ trạch) orientation in feng shui" / "East-group (Đông tứ trạch)".

### Residual (not counted)
- City-name convention is inconsistent outside this task: `news.json` uses "Hà Nội" ×19, while `projects.json` uses "Hanoi" ×94 and "Hà Nội" ×12. T03 uses "Hanoi", the majority form in T02, which the README allows ("tên tỉnh/thành theo bản hiện có", i.e. province/city names follow the existing data). Unifying this belongs to a T02/T04 follow-up.
- The reviewer did not open `/en` in a browser.

## Gates
- **Responsive Checklist Gate: N/A.** The diff touches no UI; it is JSON data only.
- **aislop: N/A**, no code changed.
- **oxlint: N/A**, no TS/JS changed.
- **ocr: skip**, no code changed.
- **AI-readable: N/A**, data files; 0 indicators.
- **ai-friendly-web: N/A**, dev seed data.
- **blitzstrike: N/A**, not STRICT.

## Verdict: PASS

There are no open CRITICAL or MAJOR findings. M1 and m1 are resolved. RichText counts match, both groups are idempotent (0 writes, including media), coverage is 32/32 and 38/38, and vi is untouched. Only the optional MINOR m3 is open.
