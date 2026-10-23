# Run Journal — bug/listing-detail-design-match · phase-1-task-01 (BL-056)

- workItem: bug/listing-detail-design-match
- task: tasks/bug-listing-detail-design-match/phase-1-task-01.md
- build: attempt 1 DONE (builder) — typecheck/lint/test 387 files 3895/build PASS; trình duyệt VI 7 URL × 3 khổ OK; EN không có dữ liệu local (404/trống) → residual; ảnh .context/review-reports/assets/bl-056/
- review r1 STRICT FAIL (M-1 upload mất khi hasContentBeyond so chữ; M-2 lexicalPlainText nối " " trước dấu câu; M-3 thiếu repro/bằng chứng + test A4) report .context/review-reports/bug-listing-detail-design-match-phase-1-task-01-round-1-review.md
- build attempt 2 DONE (builder): M-1..M-3 + m-1..m-5 fixed; A5 root cause thật: buttonVariants trực tiếp → border-transparent thắng, bọc cn(); test 3905 PASS, build PASS; 12 ảnh mới
- review r2 STRICT PASS (report .context/review-reports/bug-listing-detail-design-match-phase-1-task-01-round-2-review.md; MINOR n-1 upload null → follow-up, n-2 buttonVariants chưa merge → follow-up, n-3 EN rental/post chỉ vitest)
- spec-publish DONE 1.46.2 / scope v60
- commits: f10e017 (task) + close-out (xem git log)
- step: done · status: done
- manifest: file task = src/lib/content/rich-text-lead*, src/components/detail/{DetailOverviewIntro*,DetailSpecBar,DetailInfoGrid,DetailStatCards,DetailFeatureList,DetailBlocks.test}, forms/FormField, leads/LeadForm*, icons.ts, projects/{ProjectOverview,ProjectAmenities,ProjectDetail,ProjectSpotlightContent,project-components.test}, rentals/{RentalDetail,SaleContactBox,RentalSpotlightContent,RentalListPage.test}, posts/{PostDetail*,PostContactBox,PostSpotlightContent,post-components.test}, i18n vi/en, .context/design-spec.md, docs/DESIGN.md
- next: none (BL-056 done)
