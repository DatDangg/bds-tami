# builder summary — bug-button-variants-merge-and-empty-upload / phase-1-task-01 (BL-057)

- Attempt 1, 2026-10-22 — DONE, chưa commit (change-request commit).
- n-2: `src/components/ui/button.tsx` — `cva` thành const nội bộ `buttonClassVariants`; export `buttonVariants(props?) = cn(buttonClassVariants(props))` (cn = twMerge mở rộng, giữ `text-button`). `Button` không đổi.
- n-1: mới `src/lib/content/rich-text-upload.ts` (`renderableUploadImage`); `RichText.renderUpload` + `rich-text-lead.isVisibleBlock` cùng gọi; `NON_TEXT_BLOCKS` bỏ `upload`.
- Test: `button.test.tsx` +6, `rich-text-lead.test.ts` +7 (fixture upload thành media hợp lệ), `DetailOverviewIntro.test.tsx` fixture `{type:"upload", value:null}` → media hợp lệ (fail đúng kỳ vọng sau fix, ngoài 3 file test dự kiến — báo dispatcher).
- Verify: typecheck PASS · lint: 4 error có sẵn ở `.local-seed/seed-sample-project-blocks.ts` (git-ignored, ngoài scope), scope files eslint sạch · test 418/418 file, 4380/4380 PASS · build PASS.
- Doc: `.context/design-spec.md:245` thêm câu BL-057 (as-built). `docs/DESIGN.md` không đụng.
- Side effect: `pnpm build` sinh lại `src/app/(payload)/admin/importMap.js` (không thuộc scope, không revert được vì cấm `git checkout --`).
- Không bỏ các `cn(buttonVariants(...))` thừa ở spotlight/JobDetailHero (tuỳ chọn, giữ diff tối giản).
