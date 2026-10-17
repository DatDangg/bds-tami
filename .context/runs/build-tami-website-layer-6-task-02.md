# Run Journal — build/tami-website · layer-6-task-02

```yaml
workItem: build/tami-website
phaseTask: layer-6-task-02
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T03:50:00.000Z
filesTouched: ["context/progress.json","docs/ERD.md","docs/PERMISSION.md","migrations/index.ts","seed/index.ts","src/collections/Provinces.ts","src/collections/Wards.ts","src/lib/content/public-queries.ts","src/payload-types.ts","src/payload.config.ts","tasks/tami-website/layer-15-task-01.md","tasks/tami-website/layer-6-task-02.md","tasks/tami-website/layer-7-task-02.md","tasks/tami-website/layer-7-task-03.md"]
filesNew: [".context/review-reports/build-tami-website-layer-6-task-02-round-1-review.md",".context/review-reports/build-tami-website-layer-6-task-02-round-2-review.md",".context/runs/build-tami-website-layer-6-task-02.md","migrations/20261017_143212_rentals.json","migrations/20261017_143212_rentals.ts","seed/sample/rentals.ts","src/collections/Rentals.ts","src/hooks/rentals/build-search-text.ts","src/hooks/rentals/field-validators.ts","src/hooks/rentals/generate-code.ts","src/hooks/rentals/rentals-hooks.test.ts","src/hooks/rentals/stamp-rented-at.ts","src/hooks/wards/guard-delete.ts","src/lib/payload/relation-id.ts","tests/fixtures/rentals/payload-config.ts","tests/integration/rentals.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-6-task-02-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-6-task-09 (endpoint ứng tuyển)."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T20:40:00.000Z, ok: true, note: "User: ... rồi layer 6"}]
batchQueue: []
```

## History

- 2026-10-18T02:30:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 71f1be6, working tree sạch.
- 2026-10-18T03:00:00.000Z ✅ DONE builder attempt 1 — Rentals (ERD §4.6 + rentalTerms), code CT-+6 số từ sequence (cùng transaction, bất biến), publish ≥3 ảnh, rentedAt, searchText localized (legacyNames), ward∈province + validator mặc định, guard xoá ward 409, migration 20261017_143212_rentals (sequence + 5 index + GIST; DB tạm up/down/up). Trigram để L7-T02 theo Notes task. test 110 file 1.212 PASS, build OK. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-18T03:15:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 khách đọc được address + location chính xác qua /api/rentals khi showExactAddress=false; searchText dò được qua where. MINOR: rented không cần ≥3 ảnh; version_search_text cũ; province 500; searchText cũ → L7-T02. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T03:35:00.000Z ✅ DONE builder fix attempt 2 — address/location read: staff hoặc showExactAddress=true; searchText chỉ staff (where/sort khách 400); ≥3 ảnh cho published+rented; version_search_text bản mới nhất; Provinces 409 khi còn ward/rentals/projects; ERD §4.2/§4.6/§5 + PERMISSION §4. test 110 file 1.218 PASS, build OK. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-18T03:50:00.000Z ✅ DONE reviewer round 2 STRICT — PASS. Follow-up → L7-T03 (address optional), L15-T01 (MINOR B, C). Close-out → commit.
