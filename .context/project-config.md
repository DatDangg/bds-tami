# project-config.md — Cấu hình dự án (canonical)

> **File này do brainstorm quản lý** (`.agent/brainstorm.md` / lệnh `/brainstorm`) — không điền tay,
> không có lệnh setup riêng. Mọi workflow/subagent **đọc giá trị ở đây**, KHÔNG hardcode trong generic docs.
> Nếu field còn placeholder (`<...>`) hoặc `null` → coi như chưa cấu hình, phải **hỏi user**, không bịa.
>
> 💡 Chạy `/brainstorm` để điền/cập nhật. `/brainstorm <nhóm>` chỉ sửa 1 nhóm (vd `git`, `models`).

## Config

```yaml
project: tami-website
output_language: vi            # vi | en — ngôn ngữ cho docs/summary

# ── Git ──
target_branch: staging        # default staging-direct: current branch phải là branch này khi commit/push PASS; chưa điền = hỏi user
forbidden_branch: main         # cấm push trực tiếp (opencode.jsonc hard-deny main/ref main)
branch_pattern: "staging" # default staging-direct; feature/<slug>|bug/<slug> chỉ khi user yêu cầu feature branch
auto_push_after_pass: false    # ⚠️ KHÔNG phải "tự commit": commit sau PASS luôn BẮT BUỘC. Flag này chỉ = AUTO-PUSH: true = tự `git push origin <target_branch>` sau PASS; false = chỉ commit local, chờ user yêu cầu rõ.

# ── Package / source ──
package_manager: pnpm
source_roots: [src]            # app Next.js + Payload một package (ARCHITECTURE §4); scaffold ở layer 0

# ── Verify commands (null/placeholder = skip, no app configured) ──
web_typecheck_command: null   # không tách web/api — dùng alias generic
web_lint_command: null
api_typecheck_command: null
api_lint_command: null
test_command: pnpm test
install_command: pnpm install --frozen-lockfile
lint_command: pnpm lint          # generic alias if web/api split does not apply
typecheck_command: pnpm typecheck     # generic alias if web/api split does not apply
build_command: pnpm build
migration_command: pnpm payload migrate     # only used when db_tool != none and migration_required: true

# ── Database ──
db_tool: other                 # Payload CMS 3 Postgres adapter (Drizzle bên dưới); migration bằng `payload migrate:create` / `payload migrate`
migration_required: true       # true nếu cần migration versioned (chỉ khi db_tool != none)
staging_db: DATABASE_URL_STAGING   # TÊN ENV VAR, không phải connection string/secret
prod_db: DATABASE_URL_PROD       # TÊN ENV VAR; phải khác staging_db
destructive_migration_policy: HIGH_RISK_MIGRATION

# ── Deploy / CI-CD (từ brainstorm; secret nằm ở .env.local) ──
deploy_platform: docker-vps    # Docker Compose + Nginx host + Let's Encrypt, không Cloudflare. STAGING = server mới 179.197.242.57 (SSH alias `server`, https://staging.tamihomes.vn, runbook deploy §11); PRODUCTION = server cũ 187.52.119.50 (tami.genieplatform.cloud, runbook §10). Staging sslip trên server cũ chạy dự phòng. ARCHITECTURE §6
ci_cd: github-actions          # staging → duyệt tay → production (ARCHITECTURE §6.4); runner chốt ở bước DevOps

# ── Monitoring ──
monitor_enabled: true          # Prometheus, Grafana, Loki, GlitchTip, Uptime Kuma
otel_service_name: tami-web
otel_env: staging              # production đặt qua env khi deploy prod

# ── Worktree hooks (optional — dùng cho parallel loop) ──
# Chạy bởi scripts/parallel-dispatch.mjs. Mục đích: mỗi worktree có DB/ENV RIÊNG để
# test song song không nối chung 1 DB (và không đè .env.local của nhau).
# Có sẵn env: $WORKTREE_PATH, $TASK_ID (vd layer-1/task-02), $WORKTREE_SLUG (vd layer-1__task-02). cwd = worktree.
# Rỗng = bỏ qua hook (chưa cấu hình cho project này).
worktree_setup_cmd: ""         # chạy SAU khi tạo worktree (tạo DB riêng + ghi .env.local riêng)
worktree_teardown_cmd: ""      # chạy TRƯỚC khi xoá worktree (drop DB tạm, dọn file runtime)
```

### DB / migration

- **`db_tool: none`** → project không dùng DB/ORM: **bỏ qua toàn bộ migration safety rules**.
- `db_tool != none` **và** `migration_required: true` → áp dụng migration gate:
  migration phải versioned + committed, không sửa migration đã apply.
- Không hardcode Prisma/Drizzle: dùng đúng `db_tool` đã khai.
- Trước commit phải inspect migration artifact theo `db_tool`/`migration_command`. Nếu có `DROP TABLE/COLUMN`,
  đổi type, `SET NOT NULL`, `UNIQUE/FK` trên data cũ, enum phá hoại, bulk transform/backfill
  → gắn `HIGH_RISK_MIGRATION`, không promote production, báo destructive op/table/column ảnh hưởng,
  tương thích data, backfill, rollback, kết quả verify staging.
- Cấm `db push`, `migrate reset`, seed/reset, clone data giữa staging/prod.
- `staging_db` phải khác `prod_db`; data độc lập; không sync data staging→prod.

## Check commands (chạy trước khi báo xong)

### Worktree hooks (parallel loop)

`scripts/parallel-dispatch.mjs setup` và `cleanup` gọi 2 hook optional ở trên. Không khai = bỏ qua.
Hook chạy bằng `sh -c` với `cwd = worktree`, env `WORKTREE_PATH`, `TASK_ID`, `WORKTREE_SLUG`.
Hook fail → **cảnh báo rõ nhưng KHÔNG chặn** luồng build/merge (và KHÔNG xoá nhầm worktree).

> Mọi người (builder/reviewer) PHẢI dùng đúng lệnh đã cấu hình ở đây, filter theo package bị đụng nếu monorepo.
> Nếu command là `null`/placeholder hoặc repo chưa có app code (`source_roots: []`) → ghi `skip, no app configured`.
> KHÔNG tự suy ra `npm test`, `pnpm lint`, Prisma, package name, hay path `apps/` khi chưa cấu hình.

```yaml
check_commands:
  install: pnpm install --frozen-lockfile
  web_typecheck: null       # hoặc = web_typecheck_command
  web_lint: null            # hoặc = web_lint_command
  api_typecheck: null       # hoặc = api_typecheck_command
  api_lint: null            # hoặc = api_lint_command
  lint: pnpm lint           # không tách web/api
  typecheck: pnpm typecheck
  test: pnpm test
  build: pnpm build
  migration: pnpm payload migrate   # KHÔNG auto-allow; chỉ chạy trong deploy staging/prod
  docs_inventory: null
```

## Models per role

> Model KHÔNG đọc từ `.env.local`. Khai ở đây rồi **bỏ comment + copy sang frontmatter** của từng file
> `.opencode/agent/*.md`, rồi **restart opencode** (config không hot-reload).
> Quy tắc: **builder ≠ reviewer** (khác họ provider) để lộ blind spot khác nhau.

```yaml
# --- Claude Code runtime (sync-claude.mjs đọc block này để ghi model vào .claude/agents/*.md) ---
models:
  builder:        sonnet
  builder_strong: opus     # chỉ dùng khi user yêu cầu rõ (§7 gate)
  reviewer:       opus
  spec_validator: opus     # họ thứ 3 nếu có (cũng dùng cho design)
  change_request: opus          # ⭐ agent hậu-build (classify/spec/task) — cửa vào /change (cũng dùng cho graph)
  spec_init:      opus
  spec_publisher: sonnet
```

```yaml
# --- opencode runtime (ghi thẳng `model:` trong frontmatter .opencode/agent/*.md) ---
# Đổi ở đây KHÔNG tự áp dụng: sửa frontmatter tương ứng rồi restart opencode.
# Quy tắc giữ nguyên: builder (DeepSeek) ≠ reviewer/spec (OpenAI) để lộ blind spot khác nhau.
models_opencode:
  builder:        opencode-go/deepseek-v4.1-flash
  builder_strong: opencode-go/deepseek-v4-pro
  reviewer:       openai/gpt-6-luna
  spec_validator: openai/gpt-6-luna
  change_request: opencode-go/deepseek-v4-pro
  design:         openai/gpt-6-luna
  graph:          opencode-go/deepseek-v4.1-flash
  spec_init:      openai/gpt-6-luna
  spec_publisher: opencode-go/deepseek-v4.1-flash
```

## UI rules (nếu project có UI)

```yaml
ui:
  responsive_breakpoints: [375, 640, 768, 1024, 1280, 1536]   # 375 = mobile test; còn lại = Tailwind sm/md/lg/xl/2xl (DESIGN.md)
  max_file_lines: 300
  max_function_lines: 50
```

## Secrets

```yaml
secrets:
  source: env                    # chỉ đọc từ env; KHÔNG hardcode/commit
  required: [DATABASE_URL, PAYLOAD_SECRET, REDIS_URL, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_PUBLIC, S3_BUCKET_PRIVATE, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, SMTP_HOST, SMTP_USER, SMTP_PASS, ANTHROPIC_API_KEY, TRANSLATION_MODEL, TRANSLATION_MONTHLY_BUDGET_USD, NEXT_PUBLIC_SITE_URL]   # deploy: DATABASE_URL lấy từ DATABASE_URL_STAGING / DATABASE_URL_PROD
```
