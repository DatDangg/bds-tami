# Run Journal — build/tami-website · layer-9-task-05

```yaml
workItem: build/tami-website
phaseTask: layer-9-task-05
step: closeout
agent: primary
status: done
attempt: 3
interrupted: false
updatedAt: 2026-10-18T22:45:00Z
worktree: D:/prj/bds-wt9-t05 (branch wt/l9-t05 từ d6f08ab; DB tami_wt9_t05; Redis db 2)
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-9-task-05.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-9-task-05-round-3-review.md
  round: 3
  verdict: PASS
next: "L9-T05 done (squash wt/l9-t05)."
loopSignal: none
approvals: [{gate: parallel_layer9, at: 2026-10-18T16:25:00Z, ok: true, note: "User duyệt chạy L9 song song"}]
batchQueue: []
```

## History

- 2026-10-18T19:35:00Z ▶ START builder L9-T05 trong worktree (cancel sẽ redo bước này).
- 2026-10-18T20:20:00Z ✅ DONE builder L9-T05 — GET /api/admin/leads/export (admin only, 401→403→400→rate limit 10/giờ→count ≤ 20.000 (422)→audit lead.export fail-closed→stream xlsx tự viết bằng fflate), escape formula injection, ẩn danh → placeholder, LeadExportButton (fetch, chuyển bộ lọc đơn giản). Dependency mới fflate ^0.8.3. lint/typecheck PASS, test 2.046 PASS (contrast CRLF); build FAIL do không tải được Google font (môi trường). ▶ START reviewer STRICT round 1 (cancel sẽ redo bước này).
- 2026-10-18T20:35:00Z ✅ DONE reviewer STRICT round 1 — FAIL: MAJOR-1 export-filters.ts:86-93 chỉ đọc and, Payload WhereBuilder luôn ghi {or:[{and:[...]}]} → nút xuất bỏ bộ lọc, xuất tất cả (≤20.000) không cảnh báo; test dùng shape sai. MINOR: dấu nháy hiện trong ô (quotePrefix), cắt sau escape có thể vỡ entity, phân trang offset trôi, revokeObjectURL sớm, hàm 56 dòng, API_SPEC dòng L9-T03 đổi khoảng trắng. Build PASS sau xoá .next. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T20:50:00Z ✅ DONE builder fix attempt 2 — leadExportQueryFromWhere đọc {or:[{and}]} 1 nhánh, không ánh xạ được (search, nhiều nhánh, toán tử/field lạ) → khoá nút + thông báo (không xuất dư); quotePrefix style thay dấu nháy; cắt trước escape (surrogate); keyset (createdAt,id) bỏ COUNT/trang; revokeObjectURL trễ; tách hàm; API_SPEC hoàn dòng L9-T03. lint/typecheck/build PASS, test 2.061 PASS (contrast CRLF). ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T21:25:00Z ✅ DONE reviewer STRICT round 2 — FAIL: MAJOR-1 export-filters.ts:80-84,132-134 cắt createdAt về YYYY-MM-DD, server nới cả ngày VN; DatePicker Payload gửi T12:00:00.000Z (19:00 VN) → file nhiều lead hơn list (~24h), test dùng mốc 00:00 sai. MINOR: nút ở trash view xuất lead không xoá; keyset chỉ test mock; comment cũ. ▶ START builder fix attempt 3 (cancel sẽ redo bước này).
- 2026-10-18T21:45:00Z ✅ DONE builder fix attempt 3 — createdFrom/createdTo ISO có múi giờ (validate + chuẩn hoá UTC), dùng đúng >=/<= như list (bỏ nới ngày VN), nút truyền nguyên giá trị picker; ẩn nút ở /collections/leads/trash; integration keyset pageSize=2 + 5 lead cùng createdAt; integration số dòng = payload.find cùng where. lint/typecheck/build PASS, test 2.070 PASS (contrast CRLF). payload-types EOL bị guard chặn checkout -- (primary không stage). ▶ START reviewer round 3 (cancel sẽ redo bước này).
- 2026-10-18T22:00:00Z ✅ DONE reviewer STRICT round 3 — PASS (2 MINOR thông báo + so ngày → follow-up trong task). Commit wip wt/l9-t05.
- 2026-10-18T22:45:00Z Squash wt/l9-t05 sau T06 (ec14db0), không xung đột; pnpm install --frozen-lockfile OK (fflate), importMap/types sinh lại không đổi nội dung; staging: lint, typecheck, test 208 file 2.215, build PASS. Commit.
