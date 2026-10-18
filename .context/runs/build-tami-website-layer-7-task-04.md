# Run Journal — build/tami-website · layer-7-task-04

```yaml
workItem: build/tami-website
phaseTask: layer-7-task-04
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T10:50:00Z
worktree: D:/prj/bds-wt-t04 (branch wt/l7-t04 từ f29176c; DB tami_wt_t04; Redis db riêng)
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-7-task-04.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-7-task-04-round-2-review.md
  round: 2
  verdict: PASS
next: "L7-T04 done (squash từ wt/l7-t04). Gap design-spec §3.4 báo user ở checkpoint layer 7."
loopSignal: none
approvals: [{gate: parallel_layer7, at: 2026-10-18T09:10:00Z, ok: true, note: "User: chạy song song T02/T03/T04, worktree + DB riêng, review song song, merge/commit lần lượt"}]
batchQueue: []
```

## History

- 2026-10-18T09:15:00Z ▶ START builder L7-T04 trong worktree (cancel sẽ redo bước này).
- 2026-10-18T09:45:00Z ✅ DONE builder L7-T04 — ApplyForm (CV pdf/doc/docx ≤5MB, lỗi theo field, 429 giữ dữ liệu, hết hạn), use-public-form thêm additionalFields, i18n. lint/typecheck/build PASS; test: 4 file lỗi môi trường worktree → primary thêm extension postgis/unaccent/pg_trgm cho tami_wt_t03/t04 → 3 file PASS; contrast.test lỗi do worktree CRLF (test giòn với CRLF, có sẵn, không do task). ▶ START reviewer round 1 (cancel sẽ redo bước này).
- 2026-10-18T10:00:00Z ✅ DONE reviewer STRICT round 1 — FAIL: MAJOR-1 ApplyForm.tsx:102 coi mọi 400 không details là hết hạn, nhưng job-applications.ts:100 cvInvalid cũng trả 400 không details → CV hỏng báo "hết hạn". MINOR: lệch design-spec §3.4 (không % upload/kéo-thả) chưa ghi gap; payload-types chỉ line-ending; task file blast radius; process.env vs getEnv; huỷ chọn file không xoá lỗi cũ. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T10:25:00Z ✅ DONE builder fix attempt 2 — failCv(): mọi lỗi CV trả details field cv (postingClosed là 400 duy nhất không details), API_SPEC §3.2; test endpoint + RTL; gap design-spec §3.4 (% upload, kéo-thả) ghi "chờ user quyết"; payload-types trùng byte HEAD (không stage); giữ process.env site key có lý do; huỷ chọn file xoá lỗi. lint/typecheck/build PASS; test 1.566 PASS (lần đầu 29 file lỗi chập chờn, chạy lại OK; contrast CRLF). ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T10:50:00Z ✅ DONE reviewer STRICT round 2 — PASS (MINOR-A tín hiệu postingClosed → follow-up task; MINOR-B task file sửa; MINOR-C gap §3.4 báo user ở checkpoint; payload-types không stage). Squash merge wt/l7-t04 vào staging, typecheck + 8 file/106 test liên quan PASS. Commit.
