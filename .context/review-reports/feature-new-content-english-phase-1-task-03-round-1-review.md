Agent: reviewer

# Review — feature-new-content-english · phase-1-task-03 · round 1

- Task: `tasks/feature-new-content-english/phase-1-task-03.md` (BL-072, EN pack for 8 real legal/planning news articles)
- File in scope: `seed/english/packs/2026-10-23-real-content/news.json` (untracked, new)
- Out of scope: other pack files (T02), `seed/english/*.ts`, `scripts/*` (T01)

## Review level
NORMAL

## Reason
Data-only ADDITIVE change (one JSON pack). It doesn't touch auth, schema, API or shared code, and the engine is unchanged. The content is legal, so the review checked every cell for legal status, document numbers, dates and figures against the vi source. That is a NORMAL-level review with a closer look at the content; nothing here needs STRICT.

## Blast radius
- `/en/news` and 8 `/en/news/<slug>` pages (EN locale only). `vi` is unaffected because the engine writes only the `en` locale.
- DB rows: 8 `news` documents, `en` localized title/excerpt/content.
- No API, schema or shared code change.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm seed:english:export news <scratchpad>/news-vi.json` (read-only, dev DB) | OK, 32 records exported. Used as the vi baseline |
| `pnpm exec vitest run tests/unit/english-pack-plan.test.ts tests/unit/seed-english-format.test.ts` | PASS, 2 files, 34 tests |
| `pnpm english:pack 2026-10-23-real-content` (dry-run, dev DB) | `Tổng: sẽ ghi 0, không đổi 100, bỏ qua 0, thiếu bản vi 0`. The pack parses, so the JSON is valid. All 8 news keys match vi. Nothing to write, so the builder's apply was idempotent |
| `git status --short seed/english/packs` | `?? seed/english/packs/`: untracked, not staged or committed (as the task requires) |
| Scratch comparison script | Blocked (guard: reviewer can't write outside `.context/review-reports/**`). Did a manual line-by-line comparison instead (below) |

## Completeness and alignment (manual, all 8 articles)
I read the EN pack and the vi export side by side. Both files have the same structure (key / title / excerpt / content), so EN cell *i* sits at a fixed line offset (+746) from vi cell *i* for all 8 documents. That confirms the cell counts are equal:

| Article | vi cells | EN cells |
|---|---|---|
| Bảng giá đất… | 137 | 137 |
| Dự thảo Luật Đất đai… | 85 | 85 |
| Luật KDBĐS (sửa đổi)… | 97 | 97 |
| Luật Quy hoạch đô thị và nông thôn… | 104 | 104 |
| Mua căn hộ HTTTL… | 108 | 108 |
| Nghị định 54/2026… | 128 | 128 |
| Nghị quyết 254/2025… | 141 | 141 |
| Quy hoạch tổng thể Thủ đô… | 115 | 115 |

- Each EN cell matches its vi cell in meaning. Bold, link and label runs match. List and table-row cells (the " — Effective date: …; Decided by: …" pattern) correspond 1:1. No paragraph is dropped or summarised.
- Leading and trailing spaces: I spot-checked about 20 run boundaries (e.g. cells ending `"the "`, `"including the "`, `"Housing Law) "`, and cells starting `" On the morning…"`). All match vi.
- URLs and the literal markdown link `[moc.gov.vn](…(1).pdf)` are kept verbatim, as in vi.
- Draft status:
  - Draft Land Law: cell 0 says "This is a draft, not yet law."; "had **not yet voted to adopt it**"; the table says "Not yet in force…"; the disclaimer says "content of the draft may change".
  - Draft Real Estate Business Law: "This is a draft before the National Assembly, not yet law." and "not yet voted". The excerpt says "draft … is before the National Assembly".
  - Off-plan article note: "not yet been voted on and adopted".
- Document numbers, dates and figures checked against vi, all identical:
  - Resolution 254/2025/QH15, 11 Dec 2025, in force 1 Jan 2026
  - Decree 49/2026 (31 Jan 2026), Decree 50/2026
  - Resolution 52/2025/NQ-HĐND (26 Nov 2025)
  - Decision 19/2026/QĐ-UBND (2 Feb 2026), Decision 89/2025
  - Land Law 31/2024 (18 Jan 2024, from 1 Aug 2024), Law 43/2024 (29 Jun 2024)
  - Resolution 278/NQ-CP (18 Sep 2026), examinations on 29 Sep and 22 Oct 2026
  - Law 47/2024 (26 Nov 2024, effective 1 Jul 2025), Law 144/2025 (11 Dec 2025), Law 71/2025 (14 Jun 2025)
  - Decree 178/2025 (1 Jul 2025), Decree 34/2026 (22 Jan 2026), 18/VBHN-BXD (24 Mar 2026)
  - Decree 54/2026 (9 Feb 2026), Official Dispatch 3511/BXD-QLN (5 Mar 2026), Decree 136/2026 (7 Apr 2026), 24/VBHN-BXD (18 May 2026), 20/VBHN-BXD (26 Mar 2026), Decree 100/2015
  - Decision 2512/QĐ-UBND (13 May 2026), Resolution 03/NQ-HĐND (28 Mar 2026)
  - 13 chapters/112 articles (−3/−148); 10 chapters/61 articles (−22 vs 83)
  - Rates and limits: 4/12, 7/12, 9/31; 30/50/100%; 5%/30%/70%/50%/95%; 60/120/10/30 days; 75%/75%; 60 months; 24 months
  - Hanoi plan: 126 units (51/75), 3,359.84 km², 14–15 / 15–16 / 17–19 / ≤ 20 million people, 1,200 km / 979 km
  - Decimal localisation (1,1 → 1.1; 3.359,84 → 3,359.84) is correct.
- Stray Vietnamese: only proper names, place names and document codes (NĐ-CP, QĐ-UBND, NQ-HĐND, VBHN-BXD). "Công bố quy hoạch" (a website section label) has an English gloss, and "Hồ Tây" is glossed on first use.

## Responsive Checklist Gate
N/A. This is a data-only change; no route, component or CSS was touched.

## Skill gates
- aislop: N/A. No code changed, only a JSON data pack.
- oxlint (anti-slop): N/A. No TS/JS changed.
- ocr (open-code-review): skip, ocr not installed / no code diff.
- AI-readable: OK. No code; 0 indicators.
- ai-friendly-web: N/A. Content data only; no change to robots, sitemap or llms files.
- blitzstrike: N/A. Not a STRICT security task.

## Findings
None CRITICAL or MAJOR.

- **[MINOR] Permissive turned into mandatory.**
  - Where: `news.json` → `"Nghị định 54/2026/NĐ-CP: …"` content cell 62 (line 629): "the developer gives priority in sales to the current tenant".
  - Why: vi "chủ đầu tư **được** ưu tiên bán cho người đang thuê" means the developer *may* give priority.
  - Fix: "the developer may give priority in sales to the current tenant".
- **[MINOR] Deadline nuance lost.**
  - Where: `"Nghị quyết 254/2025/QH15: …"` cell 91 (line 792) "until 1 March 2027", and table cell 105 (line 806) "Implemented until 1 March 2027".
  - Why: vi "đến trước ngày 01/03/2027" means *before* 1 March 2027. The Luật Quy hoạch article handles the same kind of deadline correctly ("to the end of 28 February 2027").
  - Fix: "until before 1 March 2027" or "until 28 February 2027".
- **[MINOR] Outdated admin term.**
  - Where: `"Quy hoạch tổng thể Thủ đô…"` cell 59 (line 907) "district level (about 120–150 points)".
  - Why: vi says "cấp khu vực", which means area level. Hanoi no longer has districts under the two-level model, so "district" could mislead.
  - Fix: "area level".
- **[MINOR] Terminology inconsistency within one article.**
  - Where: `"Luật Kinh doanh bất động sản (sửa đổi): …"` table cells (lines 297–309).
  - Why: these use "Real Estate Business Law 29/2023/QH15", while the body uses "Law on Real Estate Business". Both are understandable.
  - Fix: optionally unify on "Law on Real Estate Business".
- **[MINOR] Unglossed colloquial term.**
  - Where: `"Nghị quyết 254/2025/QH15: …"` heading cell (line 767) "4. Red book, parcel splitting and merging".
  - Why: elsewhere the pack uses "Certificate"; "Red book" isn't explained for EN readers.
  - Fix: "4. Certificates (red book), parcel splitting and merging".
- **[MINOR / advisory, intent-level, not blocking] Title doesn't say "draft".**
  - Where: title "Law on Real Estate Business (Amended): Fewer Business Conditions…".
  - Why: it doesn't say "draft", but the vi title doesn't either, so the translation is faithful. The first sentence and the excerpt make the draft status explicit.
  - Fix: changing the title would be an intent/content change that applies to vi as well; raise it as a separate change if wanted.

## Residual risk
- The automated cell-by-cell diff was blocked by the guard. Alignment was verified by structural line-offset equality plus a manual read of every cell, not by a script. The builder's own automated whitespace and URL check (summary item 1) complements this.
- Not run on staging or prod (correct scope). Applying there needs a backup and the runbook, per the builder's residual note.
- Auto-generated EN slugs (e.g. `…what-s-new…`) come from the engine hook and are outside T03's scope.

## Verdict
PASS. No CRITICAL or MAJOR findings. The 5 MINOR translation-precision items are recommended but don't block, and can be fixed in this task before the integration close-out.
