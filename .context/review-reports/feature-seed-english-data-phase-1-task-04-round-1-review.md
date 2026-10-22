Agent: reviewer

# Review — feature-seed-english-data · phase-1-task-04 · round 1 (BL-064, news EN data)

- **Review level:** NORMAL
- **Reason:** Data-only change: one untracked JSON file `seed/english/data/news.json`. No `.ts`, schema, API or UI change. The engine was already reviewed and committed in 4f9809f. The main risks are translation quality and completeness, idempotency, and not touching vi or the draft state. That is more than FAST covers, and none of the STRICT red-flag areas apply.
- **Blast radius:** dev DB `news_locales` (locale `en`), `news.has_english` / `translation_*`, and the media alt `en` for the 22 news cover images. The English content shows on `/en/news/*` in dev. Staging/prod are not affected (`checkSeedEnvironment`; `.env.local` DATABASE_URL = 127.0.0.1:5433/tami).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm seed:english:export news <scratch>/news-vi.json` (read-only) | 24 records exported |
| Node compare script (scratch): vi export vs `news.json` | keys 24/24, 0 missing, 0 extra. Same fields in every record (title/excerpt/content). richText array lengths all equal (1–56). 0 empty strings, 0 leading/trailing whitespace mismatches. EN/vi length ratio 0.85–1.15 |
| Diacritic scan of all EN strings | Only proper nouns left (Đại Hoàng Sơn, Bắc Ninh, Vĩnh Tuy, Tân Tiến, Hà Nội, Hùng Vương, Phạm Ngọc Thiên Ân, ward/street names). 0 leftover Vietnamese sentences |
| Number check per text node | 3 flags, all legitimate wording changes ("Tầng 1" → "ground floor", "2 bé trai" → "the boys"); no number lost or changed. 1.106,2 tỷ → VND 1,106.2 billion; 33,07 ha → 33.07 ha; 8,1x23 m → 8.1 x 23 m |
| SQL `docker exec tami-postgres psql -U tami -d tami`: coverage | news has_english 24/24 (deleted_at null), all `translation_en_source = manual`, EN excerpt non-empty for 24/24 |
| SQL status | published 22, draft 2 ("TAMI ra mắt website mới", "Thị trường căn hộ dịch vụ quý này"): drafts are still drafts |
| SQL cover alt | 22/22 news covers have an EN alt ("<EN title> - cover image"); media alt EN 481/481 |
| `pnpm seed:english news` (LOCAL DEV) | `ghi 0, không đổi 24, thiếu bản vi 0, lệch/lỗi 0` |
| md5 of vi `news_locales` (title+excerpt+content+slug), md5 of en, `max(news.updated_at)`, `count(_news_v)` before vs after that run | identical (vi f1aaaae0…, en 92e0f27d…, updated_at 2026-10-22 19:52:45, versions 72): no writes and no new versions |
| `pnpm vitest run tests/unit/seed-english-format.test.ts` | 7/7 PASS |
| typecheck/lint/build | skip: no `.ts` change (JSON data only) |

## Quality sample (9 articles; long ones read in full)
Read in full: "Tư vấn mua bán UDIC Riverside 2" (56 nodes), "Giá bán UDIC Riverside 2" (36), "Chủ đầu tư The Crown…" (28), "Những Điều Cần Tránh…" (21), "Bí quyết … 3 màu sơn" (10), both drafts.
Read in part: "MÃN NHÃN … nhà ống 2 tầng" (0–17 of 18), "CẤU TRÚC…", "Bố trí căn hộ 121 m2", "Xây nhà 3 tầng".

- The English reads naturally and matches the vi line by line. Nothing is summarised: the ratio 0.85 for "Những Điều Cần Tránh" is just tighter English, and every sentence is still there.
- Terms are correct: pink book, handover, shell-and-core, adjoining plots/townhouses, deposit, mortgage release, notary, transfer tax, registration of changes, net usable area, management fee, feng shui, five elements (Water/Fire/Earth/Metal).
- Proper nouns and company names follow the README ("Đại Hoàng Sơn JSC", "TAMI").
- Template lines ("Email: hotline@TAMI", "Website: TAMI") are kept as they are, which is correct.
- The promotional tone of the Crown articles is kept and the content is not edited, as the builder recorded in the Residual section.

## "Xem thêm" related-link lines
- Every link line whose vi text equals a news title uses exactly that article's EN `title` (checked by script, 0 mismatches). "Xem thêm:" → "See more:" and "Xem thêm chi tiết:" → "See more details:" are consistent.
- The 4 lines "Bán/Cho thuê biệt thự|shophouse The Crown Đại Hoàng Sơn Bắc Ninh" → "Villas/Shophouses for Sale/Rent at The Crown Đại Hoàng Sơn Bắc Ninh". No record in `rentals.json` or `property-posts.json` has a matching title. The only villa/shophouse posts there are Elegant Park Thạch Bàn and Vinhomes Olympic, and there are no Crown rental or sale posts. So these lines are anchor text for category/search links, not titles of existing records, and there is no "actual EN title" to match. The generic phrasing is the right call. **No issue.**
- Cross-task observation (not this task's defect): T02/T03 data strips diacritics from proper nouns ("Thach Ban", "Ngoai Giao Doan", "Hanoi"). T04 keeps them as the README requires ("Vĩnh Tuy", "Hà Nội"). T04 is the compliant one. Raise the inconsistency in the T02/T03 reviews or the phase review.

## Responsive Checklist Gate
N/A: the diff has no route, component or CSS change (seed JSON data only).

## Skill gates
- aislop: N/A (no code in the diff, JSON data only)
- oxlint / anti-slop: N/A (no TS/JS change)
- ocr (open-code-review): skip, ocr not installed / no code in the diff
- AI-readable: OK (data file only, 0 chaos indicators)
- ai-friendly-web: N/A (dev seed data, no public-surface config change)
- blitzstrike: N/A (not STRICT, no security surface)

## Findings
- **[MINOR]** `seed/english/data/news.json`, article "Giá bán UDIC Riverside 2 Vĩnh Tuy - Thông tin chi tiết", content[4]: "diện tích thông thủy hoặc tim tường" → "net usable area or the wall-to-wall (gross) area". "Tim tường" means measured to the wall centreline. "Wall-to-wall" usually describes the net (carpet) area, so the parenthetical contradicts itself. Suggested fix: "the net (carpet) area or the gross area measured to the wall centreline".
- **[MINOR]** `seed/english/data/news.json`, article "Bí quyết làm nên vẻ đẹp … 3 màu sơn thần thánh", content[4] and [5]: "xám ghi" → "gray-beige". "Xám ghi" is a plain mid/cool grey ("ghi" comes from French gris), not beige. Suggested fix: "Gray and blue combination" / "a cool gray".
- **[MINOR]** Floor numbering differs between articles. "CẤU TRÚC…" uses ground floor / second floor / third floor for Tầng 1/2/3, while "Xây nhà 3 tầng…" uses first … fourth floor. Each article is consistent inside itself, so this is optional polish.

There are no CRITICAL or MAJOR findings.

## Residual risk
- I did not render `/en` pages myself: the reviewer does not run the app. The builder's evidence for `/en/news` and two detail pages is accepted, and the DB plus data checks above support it.
- The full-read sample covers 9 of 24 articles. The other 15 were checked only by script (field/array parity, digits, diacritics, empty strings, whitespace, length ratio) and short spot reads.
- The vi data being unchanged is proven for my run (md5 identical). Its state before the builder's first run is inferred from the vi export matching the expected vi keys and text, since there is no earlier snapshot.

## Verdict
✅ **PASS** (3 MINOR, optional polish; no CRITICAL/MAJOR)
