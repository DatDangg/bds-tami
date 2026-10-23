# Builder journal — BL-045 phase-1-task-01

- Worktree: D:/prj/bds/.claude/worktrees/agent-a9d080d1055325786 (branch worktree-agent-a9d080d1055325786), chua commit.
- Da lam: schema site-settings (pageBanners.contact/legal, pageHeroes, showProjectStrengths, careersPerks) + migration 20261020_183923_site_redesign_page_heroes (additive) + payload-types; resolvePageHero/loadPageHero, resolveCareersPerks/loadCareersPerks; PageHero, Breadcrumb variant overlay/plain + token --blur-breadcrumb / .crumb-glass, CategoryListTemplate (hero + filterCard + resultCount/sort + consultBanner), Pagination tron, SectionHeading, ConsultBanner; i18n; tests + contrast.
- Con do: khong. Viec T03/T06: noi loadPageHero/filterCard/ConsultBanner vao tung trang, bo compactBanner/searchBar; docs ERD/design-spec reconcile o T08.
- Ghi chu: flaky beforeAll timeout cua 3 integration test (access, jobs-email, media-upload) khi chay toan bo song song; pass khi chay rieng.
