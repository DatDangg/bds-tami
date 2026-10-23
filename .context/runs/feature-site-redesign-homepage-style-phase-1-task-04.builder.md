# Builder journal — BL-045 T04 (khung chi tiết mới + Chi tiết Dự án)

Worktree: .claude/worktrees/agent-a9ea061e06407b577 (branch worktree-agent-a9ea061e06407b577), base ffc31b8. KHÔNG commit (theo dispatcher).

Đã làm: DetailGalleryHero, DetailTitleCard (+DetailShareButton), SimilarProjects, use-project-facts; DetailLayout sectionStyle="cards" + DetailSection eyebrow; ProjectDetail viết lại, xoá ProjectHero, bỏ mục gallery; ConsultBanner prop secondary; i18n page.detail.* + page.projectDetail.facts/similar; tests liên quan cập nhật/thêm.
Verify: typecheck OK; lint 0 error; vitest run src 250 file / 2457 test PASS. Ảnh: .context/review-reports/assets/site-redesign-t04-*.
Lưu ý: src/app/(payload)/admin/importMap.js và src/payload-types.ts bị dev server tự sinh lại — KHÔNG thuộc task, đừng stage. DB dev mọi dự án chỉ 1 ảnh nên bộ đếm/ảnh nhỏ xem qua trang preview tạm (đã xoá).
