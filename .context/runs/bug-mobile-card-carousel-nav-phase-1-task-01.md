# Run Journal — bug/mobile-card-carousel-nav · phase-1-task-01

```yaml
workItem: bug/mobile-card-carousel-nav
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-11-18T00:00:00Z
filesTouched: [src/components/layout/use-snap-slider.tsx, src/components/layout/CardSlider.tsx, src/components/layout/CardSlider.test.tsx, src/components/home/RentalsTabs.tsx, src/i18n/messages/vi.json, src/i18n/messages/en.json]
filesNew: [tasks/feature-mobile-card-carousel-nav/phase-1-task-01.md, src/components/home/RentalsTabs.test.tsx, ".context/review-reports/assets/bl122-*.png (12)"]
evidence:
  reportPath: .context/review-reports/feature-mobile-card-carousel-nav-phase-1-task-01-round-1-review.md
  round: 1
  verdict: PASS (STRICT r1, 4 MINOR không chặn)
  rootCause: "use-snap-slider.tsx ARROW_BUTTON 'hidden … md:inline-flex' (mũi tên chỉ ≥ md); slide < sm cố ý 82% (CardSlider SLIDE_WIDTH) / 80% (RentalsTabs) để lộ thẻ kế; RentalsSlider dùng useSnapSlider(…, false) → không có chấm. Đúng design-spec hiện hành (S01 khối 3/8, BL-045/BL-052) → MODIFY design, không phải lỗi code."
  classification: MODIFY (UI/design-spec), risk MEDIUM (shared slider, 4+ consumer)
next: "xong — commit + push staging 2026-11-18 (user test local OK)"
loopSignal: none
approvals:
  - { gate: bug_list_order, at: 2026-11-17, ok: "user: 'Ok, theo thứ tự đó' (40 → 36 → 38+39 → 37)" }
  - { gate: modify_plan, at: 2026-11-18, ok: "user (qua coordinator): giữ thẻ 80–82%, thêm mũi tên mobile + chấm mọi dãy; sửa design-spec/BACKLOG chỉ đoạn BL-122; KHÔNG commit/push" }
batchQueue: [BL-123, BL-124]
```

## Notes / WIP reasoning

- BL-121 đang chờ user chọn nguồn tile (OSM bị DNS VNPT chặn) → làm BL-122 trước.
- Working tree bẩn sẵn (snapshot `.context/runs/.bl122-baseline-status.txt`), gồm BL-119 chưa commit — không commit file ngoài task.

## History

- 2026-11-17 journal created; ▶ START [agent: change-request] BL-122
- 2026-11-17 triage xong (read-only): root cause + classify MODIFY. DỪNG: file bắt buộc phải sửa trùng file bẩn sẵn (`.context/design-spec.md` 2 hunk API_SPEC §6.x, `spec/changes/BACKLOG.md` hunk intake BL-095/106/119/121–124) + checkpoint duyệt plan MODIFY. Chưa sửa code/spec, chưa gọi builder.
- 2026-11-18 user: giữ thẻ lộ ~82% + thêm nút/dot mọi dãy; 'chưa commit' (không commit, để working tree). ▶ START [agent: change-request] fix BL-122
- 2026-11-18 task file `tasks/feature-mobile-card-carousel-nav/phase-1-task-01.md` (MODIFY, STRICT). ▶ START [agent: builder] phase-1-task-01 — cancel sẽ redo bước này.
- 2026-11-18 ✅ DONE [agent: builder] — typecheck PASS, eslint sạch, vitest 67 file / 625 test PASS, 12 ảnh bl122-*; scope sạch so snapshot. ▶ START [agent: reviewer] round 1 — cancel sẽ redo bước này.
- 2026-11-18 ✅ DONE [agent: reviewer] STRICT PASS r1 (MINOR-1 hàng 8 chấm ở 320 lấn lề 4px; MINOR-2 comment SimilarCarousel/ProjectAmenities cũ; MINOR-3 class thừa; MINOR-4 test không restore scrollIntoView). change-request ghi design-spec (S01 khối 3 + 8, chỉ đoạn BL-122) + SPECIFICATIONS delta. ▶ START [agent: spec-publisher] — cancel sẽ redo bước này.
- 2026-11-18 ✅ DONE [agent: spec-publisher] spec 1.64.0 / scope v121 (archive scope v120 BL-121). change-request: progress.json bugs[] thêm mobile-card-carousel-nav awaiting_commit; BACKLOG BL-122 "fixed, CHƯA commit"; task review_passed; change file in_progress (chưa archive vì chưa commit, như BL-121). DỪNG trước commit theo user.
