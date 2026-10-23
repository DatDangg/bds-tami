Agent: reviewer

# Review — feature-new-content-english · phase-1-task-02 · round 1

- Task: `tasks/feature-new-content-english/phase-1-task-02.md` (BL-072 — EN pack for 3 real projects + developers + categories + image alts)
- Scope reviewed: `seed/english/packs/2026-10-23-real-content/{projects,developers,categories,media}.json` (untracked, new). Out of scope: `news.json` (T03), engine `seed/english/*.ts`, `scripts/*` (T01).

## Review level
**NORMAL**

## Reason
Data-only change (translation pack), no code, schema, auth or API changes. Content is public sales and legal information (prices, legal documents, "expected" sales policy), so it gets a full content/accuracy pass, but there are no red-risk triggers that would require STRICT. The pack applies only to the dev DB in this task.

## Blast radius
- EN locale (`/en/projects`, `/en/projects/{maison-privee,astor-1,the-windsor-collection}`): project `*_en` fields, developers `name_en` (3), categories `name_en` (3), media `alt_en` (82).
- The `vi` data is not written by the engine. Later staging/prod runs of the same pack would publish this EN copy publicly.

## Verify commands + result
| Command | Result |
|---|---|
| JSON parse of 4 in-scope files (node `require`) | OK, all valid |
| `pnpm seed:english:export projects <scratchpad>/vi-projects.json` (read-only, dev) | 64 records exported. Key diff against the pack for 3 projects: **0 missing, 0 extra, 0 richText array length mismatch** (overview 6/4/12 segments, legalInfo, salesPolicy all match) |
| Alt coverage vs `.import-tmp/img/manifest.json` | Manifest has 80 alts, pack has 82. **0 manifest alts missing.** The 2 extras are Maison Privée document alts ("Chuẩn bàn giao…", "Sơ đồ 68…"), which exist in the DB (dry-run shows "thiếu bản vi 0") |
| Diacritic scan of EN values (projects + media) | All hits are proper names or document codes: Privée, Nam Thăng Long, Phú Thượng, Tĩnh Uyển, Phương Đông, Hòa Bình, Hoàn Kiếm, Nội Bài, Bình Minh, Hoàng Hôn, Thái Nam Land, Nhật Tân, QĐ-UBND/QĐ-BCA. No translation was left behind |
| `pnpm exec vitest run tests/unit/english-pack-plan.test.ts tests/unit/seed-english-format.test.ts` | **2 files, 34 tests PASS** |
| `pnpm english:pack 2026-10-23-real-content` (dry-run, dev) | `Tổng: sẽ ghi 0, không đổi 100, bỏ qua 0, thiếu bản vi 0`. The DB matches the pack, so a rerun is a no-op. The duplicate "Căn hộ chung cư" no longer skips after the T01 engine fix |

Apply was **not** run by the reviewer, and staging/prod were not touched.

## Content checks
- **Numbers, prices, dates, areas:** spot-checked every numeric fact in all 3 projects against vi. All match: 8,087 m², 35%, 308/182/490, levels 13/20/35, 200 million VND, 5%/45%/35%/60%/30%, 24 months, 0.36 ha, 37%, 9 m, 350, 330 m², 3,000 m², 100 million VND, 4%/14%/2%/70%, 30/10/2026, 31/03/2029, 25,000–30,000 VND/m²/month, 36 months, 300 ha, 26 ha, 66 ha, ~14%, 144 m², 300 to over 1,000 m², and the DTXD/DTSD pairs in the alts. Quý 4/2029 → Q4 2029 and Quý I/2029 → Q1 2029 are correct.
- **Legal:** all document numbers and dates are kept exactly (1279/QĐ-UBND, 6207552581, 611/QĐ-UBND, 12730/SXD-QLXD, 14648/SXD-CP, AA06660158, 6843/QĐ-BCA-H02, 345/QĐ-UBND, 73/GPXD, 06/GPXD). The pending item is kept as pending ("…eligible for sale: pending update."). The construction-permit exemption is translated correctly. No permits are overstated, and "not sold to foreigners" is kept.
- **Provisional wording:** both "Chính sách dự kiến…" lines → "Expected developer policy, subject to change."; "dự kiến khoảng 200 triệu" → "expected to be about 200 million VND"; the FAQ handover answers → "Expected in Q…"; the summary and overview handover/construction start dates say "expected"; Astor faqs.3 → "expected service fees"; floorPlans.15 → "(expected)". Nothing provisional was turned into a firm claim.
- **Terminology (BL-064):** apartment, townhouse, villa, urban area, developer, handover. "Apartments" and "Townhouses and villas" are identical to `seed/english/data/categories.json`. Developers keep their proper names.

## Responsive Checklist Gate
N/A. The diff is data-only (JSON translation pack), with no route, component or CSS changes.

## Skill gates
- aislop: N/A (no code in scope, JSON data only)
- oxlint (anti-slop): N/A (no TS/JS in scope)
- ocr (open-code-review): skip, not applicable to data-only diff / ocr not used
- AI-readable: OK (0 indicators, data only)
- ai-friendly-web: N/A (no change to llms.txt, robots.txt or sitemap; content data only)
- blitzstrike: N/A (NORMAL, no auth or input surface)

## Findings
No CRITICAL or MAJOR findings.

- **[MINOR]** `projects.json` → `Maison Privée.salesPolicy[2]` and `Astor 1.salesPolicy[3]`: "on receipt of the Certificate" is ambiguous for an English reader. vi says "Giấy chứng nhận" (the ownership certificate / pink book). Suggested fix: "on receipt of the ownership certificate (pink book)", which matches BL-064 "pink book (land-use certificate)".
- **[MINOR]** `projects.json` → `Maison Privée.legalInfo[0]`: "approving the adjustment of the investor" reads awkwardly. Suggested fix: "approving the change of investor".
- **[MINOR]** `projects.json` → `Astor 1.salesPolicy[9]`: "0% interest support for 24 months" could be misread. Suggested fix: "0% interest for 24 months (until no later than 31/03/2029)".
- **[MINOR]** `projects.json` → `Astor 1.overview[3]` and `faqs.2.answer`: "fully finished to the walls" is unclear (vi "hoàn thiện liền tường" means finished with built-in fixtures). Suggested fix: "handed over fully finished with built-in fittings". Separately, "shell condition" (Astor) and "rough-built structure" (Windsor) describe the same idea, "bàn giao thô", in different words. Pick one term.
- **[MINOR]** `projects.json` → `The Windsor Collection.amenities.6.name`: "water music" should be "musical fountain" (vi "nhạc nước").
- **[MINOR]** `media.json` → keys "Mặt bằng phân khu BT8-9 / Q2 / CT07 …": "Floor plan of subdivision …" should be "Site plan of subdivision …" for a subdivision layout. `media.json` → "Sảnh thưởng rượu…": vi describes a wine-tasting lounge, but EN says "Whisky lounge", which adds a detail vi does not state. Suggest "Wine lounge". "Sảnh thang máy tầng…": "Floor elevator lobby" should be "Elevator lobby on a residential floor".
- **[MINOR / note]** `projects.json` → `Astor 1.legalInfo[1]` uses "Investor" for "Chủ đầu tư" instead of the BL-064 term "developer". This is a justified deviation, because the same sentence names Pristie as the developer. No change needed; recorded for consistency tracking.

## Residual risk
- The `/en` render was not checked in a browser by the reviewer, because reviewers do not run the app. The builder reports SSR 200 responses and a diacritic scan of the rendered pages.
- The builder's residual about the duplicate "Căn hộ chung cư" key is resolved on dev: the dry-run now reports "bỏ qua 0" through the T01 engine change, which is outside this review's scope. Staging/prod still need their own run.

## Verdict
**PASS.** There are no CRITICAL or MAJOR findings. The MINOR wording items are optional polish and can be fixed in the same pack before commit without another review round.
