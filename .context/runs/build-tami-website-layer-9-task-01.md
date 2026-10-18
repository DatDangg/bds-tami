# Run Journal — build/tami-website · layer-9-task-01

```yaml
workItem: build/tami-website
phaseTask: layer-9-task-01
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T19:50:00Z
worktree: D:/prj/bds-wt9-t01 (branch wt/l9-t01 từ b527146; DB tami_wt9_t01; Redis db riêng)
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-9-task-01.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-9-task-01-round-2-review.md
  round: 2
  verdict: PASS
next: "L9-T01 done (squash wt/l9-t01)."
loopSignal: none
approvals: [{gate: parallel_layer9, at: 2026-10-18T16:25:00Z, ok: true, note: "User duyệt chạy L9 song song"}]
batchQueue: []
```

## History

- 2026-10-18T16:35:00Z ▶ START builder L9-T01 (đợt A) (cancel sẽ redo bước này).
- 2026-10-18T18:05:00Z ✅ DONE builder L9-T01 — trang chủ S01 (lib/home view/queries/loader, components/home: HeroSlider a11y + video facade ≥1024, ProjectsSlider scroll-snap, About, FeaturedProjects/Offers fallback isFeatured, ServicesBento, CtaBanner), khối hiện khi bật + có title ở locale, JSON-LD Organization + WebSite; follow-up L8-T01 (guard-delete db.findGlobal, test guard), G32 related posts bù 3. Chưa làm: header trong suốt đè hero (ngoài file task). lint/typecheck/build PASS, test 1.954 PASS (contrast CRLF). ▶ START reviewer STRICT round 1 (cancel sẽ redo bước này).
- 2026-10-18T18:20:00Z ✅ DONE reviewer STRICT round 1 — FAIL: MAJOR-1 1 slide có video không có nút Pause (WCAG 2.2.2); MAJOR-2 phím mũi tên khi focus ở CTA → slide cũ inert, mất focus; MAJOR-3 h1 trong slide 1 bị aria-hidden/inert khi slide khác hiện; MAJOR-4 375px nút Pause đè dot (7–8 slide). MINOR: ul tabIndex thiếu tên, vuốt chéo đổi slide, ẩn dự án/ưu đãi không revalidate trang chủ, Pause sau dot trong tab order, payload-types EOL. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T19:10:00Z ✅ DONE builder fix attempt 2 — Pause/Play khi video (cả 1 slide), phím mũi tên chỉ trên control, h1 sr-only tên site ngoài slide (tiêu đề slide là p), Pause cùng hàng/trước dot 44px, vuốt ngang ưu thế, aria-labelledby list, hook revalidate trang chủ khi dự án/đăng tin bị ẩn/xoá. lint/typecheck/build PASS, test 1.967 PASS (contrast CRLF). ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T19:50:00Z ✅ DONE reviewer STRICT round 2 — PASS (MINOR h1 = title slide 1, pb mobile, header trong suốt → L10-T03). Squash wt/l9-t01 sau T08 (d6f08ab), không xung đột; staging: lint, typecheck, test 194 file 2.096, build PASS. Commit.
