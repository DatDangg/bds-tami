---
id: ci-audit-undici-happy-dom
type: bug
status: done
created: 2026-10-26
---

# CI "Audit phụ thuộc" fail — undici + happy-dom có advisory high mới

## Yêu cầu
BUG (CI gate): run CI 40298258089 trên `staging` @ 83c8552 FAIL ở bước `pnpm audit --audit-level high` → workflow Deploy staging bị `skipped`, BL-074 + BL-075 chưa lên staging. Hai advisory high mới công bố, không do code đổi:

1. **GHSA-xjj6-f33q-929c** — `undici` 7.29.1 (DoS khi nhiều content-encoding), vá ở **≥ 7.30.1**. Đường dẫn: `payload@3.91.0 > undici` (qua `@payloadcms/db-postgres`, …).
2. **GHSA-834v-8h66-3h79** — `happy-dom` 20.14.6 (import alias không sanitize → chạy code host; bản vá CVE-2026-33943 chưa đủ), vá ở **≥ 21.0.4** (major). Đường dẫn: `@payloadcms/richtext-lexical > @lexical/headless > happy-dom`, `vitest > happy-dom`, `@testing-library/jest-dom > vitest > happy-dom`.

Quyết định user (2026-10-26): **nâng cả hai** bằng `pnpm.overrides` (không allowlist). Nếu happy-dom 21 làm vỡ test/build/runtime (lexical headless) → DỪNG báo user, không tự chuyển sang allowlist.

## Bối cảnh / tái hiện
- `pnpm audit --audit-level high` (local hoặc CI) → exit 1, "Severity: 2 low | 8 moderate | 2 high".
- Expected: exit 0 (chỉ còn moderate/low + allowlist `GHSA-vfj7-8cjw-p6xm` sẵn có).

## Acceptance (bắt buộc)
- [ ] `pnpm audit --audit-level high` exit 0; không thêm GHSA mới vào `auditConfig.ignoreGhsas`.
- [ ] Lockfile resolve `undici` ≥ 7.30.1 và `happy-dom` ≥ 21.0.4 ở mọi đường dẫn (`pnpm why undici`, `pnpm why happy-dom`).
- [ ] `pnpm typecheck` · `pnpm test` · `pnpm build` PASS (lint theo project-config).
- [ ] Lexical headless vẫn chạy: test hiện có quanh chuyển markdown/HTML → Lexical (vd import nội dung, seed english) PASS.
- [ ] Commit chỉ chứa thay đổi của BL-079 trong `package.json` / `pnpm-lock.yaml` — **không** kéo theo phần dirty có sẵn (script `e2e:admin` + devDependency `@playwright/test` của việc khác).
- [ ] Push lại `staging` → CI xanh → Deploy staging chạy.

## Ghi chú
- `package.json` / `pnpm-lock.yaml` đang dirty sẵn (Playwright admin e2e, không thuộc change này) → phải tách khi stage.
