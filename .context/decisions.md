# Architecture Decisions Log

## Format

```markdown
### Decision {N}: {Title}
- **Date:** YYYY-MM-DD
- **Context:** {Why this decision was needed}
- **Decision:** {What was decided}
- **Alternatives Considered:** {Other options}
- **Rationale:** {Why this option was chosen}
- **Consequences:** {Trade-offs, follow-up needed}
```

## Decisions

_No decisions recorded yet. Decisions logged here khi dựng spec và trong implementation._

### Decision 1: Phiên bản Next.js + Payload CMS cho scaffold
- **Date:** 2026-10-16
- **Context:** Task layer-0/task-01 cần chọn Payload 3 ổn định mới nhất hỗ trợ `trash` + Jobs Queue, và phiên bản Next tương thích.
- **Decision:** Payload `3.91.0` (+ `@payloadcms/next`, `db-postgres`, `richtext-lexical`, `translations` cùng `3.91.0`), Next.js `16.4.2`, React `19.3.1`, TypeScript `5.9.3`, Vitest `5.0.5`, ESLint `9.39.5` + `eslint-config-next 16.4.2` (flat config), zod `4.6.7`, `sharp 0.35.5`. Postgres dev: `postgis/postgis:17-3.5`; SeaweedFS ghim `4.48`.
- **Alternatives Considered:** Next `15.4.11` (nằm trong peer range Payload nhưng `pnpm audit` báo critical RCE/high trên toàn bộ nhánh <15.5.24, mà Payload 3.91 không hỗ trợ 15.5.x). TypeScript 7 / vitest 3 (peer typescript-eslint không khớp / `tinypool` critical).
- **Rationale:** Next 16.4.2 nằm trong peer `>=16.3.3 <17` của Payload 3.91.0, sạch advisory critical/high; build + dev + `/admin` đã kiểm chứng.
- **Consequences:** Next 16 dùng Turbopack mặc định; `middleware.ts` (next-intl, ARCHITECTURE §4) bị Next 16 đánh dấu deprecated sang `proxy.ts` — task i18n routing phải kiểm tra. `output: "standalone"` chưa bật vì lỗi EPERM symlink trên Windows với pnpm; task Dockerfile quyết định. Auth collection tạm đặt slug `staff` (khớp ERD) để tránh rename migration sau. `pnpm audit --audit-level high` còn 1 high `braces <=3.0.3` (transitive của `@payloadcms/ui`, chưa có bản vá) — theo dõi ở task CI.
