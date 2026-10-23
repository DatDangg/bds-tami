# Run Journal — change/backlog-2026-10-20b · BL-040 → BL-039 → BL-041 (tuần tự)

```yaml
workItem: change/backlog-2026-10-20b
phaseTask: BL-040 (done)
step: change-request
agent: change-request
status: awaiting
attempt: 0
interrupted: false
updatedAt: 2026-10-20T00:00:00Z
evidence: {BL-040: {commits: [e85362b, 5378674], review: "T01 PASS r1+r2, T02 FAIL r1 → PASS r2, spec-validation PASS", spec: 1.33.0, scope: 41}}
next: "DỪNG theo user — BL-039, BL-041, BL-043 pending, chờ user gọi"
loopSignal: none
approvals: [{gate: stop_after, at: 2026-10-20, ok: true, note: "user: xong 040 thì dừng nhé — KHÔNG tự chạy BL-039/BL-041"}, {gate: wording_table, at: 2026-10-20, ok: true, note: "user: ok theo đề xuất (Q1–Q10 theo khuyến nghị) + BL-039 dùng Tiếng Việt/Tiếng Anh; ghi BL-043"}, {gate: batch_order, at: 2026-10-20, ok: true, note: "user: 'Chạy change cho BL-039, BL-040, BL-041 theo thứ tự 040 → 039 → 041.'"}]
```

## Notes
- Dirty sẵn của user, KHÔNG đụng/commit: next.config.ts, src/components/projects/{FloorPlans,NearbyTabs,ProjectCard,ProjectFilters,ProjectHero,ProjectListPage}.tsx + 4 test, src/payload-types.ts, .claude/launch.json, template-feedback.md, các .context/runs/* untracked cũ.
- Change doc: spec/changes/2026-10-20-admin-vietnamese-wording.md (BL-040), 2026-10-20-admin-list-columns-filters-locale.md (BL-039), 2026-10-20-admin-nav-clarity.md (BL-041).
- Checkpoint BL-040: bảng chữ cũ→mới user duyệt TRƯỚC khi code (acceptance). BL-039: danh sách trường giữ/ẩn user duyệt. BL-041: ảnh trước/sau.

## History
- 2026-10-20 ▶ START change-request BL-040 (đến checkpoint bảng chữ) — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE change-request BL-040 tới checkpoint: 2 task (T01 Payload 103, T02 dự án 100), Q1–Q10 chờ user.
- 2026-10-20 user duyệt bảng chữ BL-040 (ok theo đề xuất); ghi BL-043 (cột slug thô).
- 2026-10-20 ▶ START change-request BL-040 code T01+T02 — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE change-request BL-040: e85362b + 5378674, spec 1.33.0 / scope 41. Dừng theo yêu cầu user.
