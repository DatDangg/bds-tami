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

### Decision 2: Phiên admin hết hạn sau 8 giờ không hoạt động (layer-2-task-04)
- **Date:** 2026-10-16
- **Context:** PERMISSION §7 yêu cầu "8 giờ không hoạt động", nhưng `tokenExpiration` của Payload là hạn tuyệt đối tính từ lúc cấp token.
- **Decision:** `staff.auth.tokenExpiration = SESSION_TTL_SECONDS` (28800, một nguồn ở `src/lib/session/keepalive.ts`). Provider admin `SessionKeepAlive` (`admin.components.providers`) nghe hoạt động (pointerdown/keydown/wheel/mousemove/đổi route), throttle tối đa 1 lần/15 phút, bỏ qua khi tab ẩn và trên các màn login/logout/inactivity/forgot/reset/createFirstUser/unauthorized, rồi gọi `useAuth().refreshCookieAsync()` của `@payloadcms/ui` (thêm dependency trực tiếp 3.91.0). Cookie `payload-token`: HttpOnly, SameSite=Lax, Secure khi `NODE_ENV=production`.
- **Alternatives Considered:** (1) fetch `/refresh-token` tự viết + `setUser` — review FAIL: không broadcast sang tab khác, tab để yên sẽ logout cả session (`_sid` chung) sau 8 giờ. (2) Rút ngắn tokenExpiration + refresh khi focus — không cần vì cơ chế provider khả dụng ở Payload 3.91.
- **Rationale:** `refreshCookieAsync` dùng đúng đường refresh của Payload: cập nhật timer phiên client, broadcast REFRESHED đa tab, có guard đang-logout; refresh lỗi 401/403 thì Payload tự chuyển màn `/admin/logout-inactivity` rồi về login.
- **Consequences:** Phiên sống tối đa 8 giờ kể từ lần refresh cuối (trễ ≤ 15 phút so với thao tác cuối). 401 đi qua màn inactivity thay vì về thẳng login. Cờ Secure phụ thuộc staging/prod chạy `next start` (`NODE_ENV=production`) — bước DevOps phải đảm bảo. Đa tab kiểm chứng bằng đọc source Payload, chưa có E2E.

### Decision 3: Gộp lượt bấm click-events idempotent (layer-2-task-07)
- **Date:** 2026-10-16
- **Context:** Job `aggregate-click-stats` chạy hằng giờ phải gộp `click-events` vào `click-stats-daily` mà chạy lại không cộng trùng; dữ liệu thô xoá sau 90 ngày. ERD ghi "unique 5 cột" (gồm cả `count`).
- **Decision:** Thêm cột `click-events.aggregatedAt`; job lấy lô ≤1000 bản chưa gộp (`createdAt <= now`), cộng dồn + đánh dấu trong cùng transaction. Unique `click-stats-daily` 4 cột `(date, type, refCollection, refId)`; ở bảng thống kê dùng `""` thay null cho ref để unique không coi null là khác nhau. `date` = ngày giờ VN (UTC+7), lưu 00:00 UTC. Xoá raw > 90 ngày chỉ khi đã có `aggregatedAt`.
- **Alternatives Considered:** Tính lại theo cửa sổ thời gian — mất số liệu khi raw đã xoá. Unique có `count` — vô nghĩa với khoá.
- **Rationale:** Đánh dấu + transaction cho exactly-once khi một runner; hàng đợi Payload không xếp trùng job cùng loại.
- **Consequences:** Cộng dồn đọc-rồi-ghi không nguyên tử — chỉ an toàn với 1 process `jobs`; nhiều worker phải đổi sang `ON CONFLICT DO UPDATE`. Chưa kiểm trên Postgres thật (Docker off lúc build).

### Decision 4: CD = GitHub runner build → GHCR → SSH chạy deploy.sh (layer-4-task-05)
- **Date:** 2026-10-17
- **Context:** ARCHITECTURE §6.4 để mở hai cách: self-hosted runner `/opt/actions-runner-tami` hoặc build trên GitHub rồi SSH. Server dùng chung với dự án khác (đã từng đầy ổ do build cache).
- **Decision:** Runner GitHub-hosted build image (tag = commit SHA, label OCI, cache GHA) → push `ghcr.io/<repo>` → job SSH vào server chạy `scripts/deploy/deploy.sh` (gửi kèm `docker/` + `scripts/deploy/` vào release bất biến `/opt/tami/releases/<env>/<sha>`, script chạy từ chính release đó, symlink `current` đổi nguyên tử trong flock). Staging tự động qua `workflow_run` của CI (chỉ `conclusion=success`, `event=push`, `head_branch=staging`, head là repo này); production là job cùng workflow trên Environment `production` (required reviewers cấu hình trên GitHub) và deploy đúng DIGEST đã chạy ở staging. Deploy theo digest, không `latest`. Server từ chối cặp digest + SHA chưa có trong `staging.history` (dòng `<digest> <ts> <sha>`) và digest cũ hơn `production.current` (trừ `--allow-older` chạy tay); production bị chặn khi có migration `HIGH_RISK_MIGRATION` chưa apply (đánh dấu bằng comment trong `migrations/*.ts`). Login GHCR bằng `GITHUB_TOKEN` truyền qua stdin vào `DOCKER_CONFIG` tạm.
- **Alternatives Considered:** Self-hosted runner trên server dùng chung (runner chạy code PR trên máy chứa dự án khác, tốn RAM/ổ build, cần quản trị riêng). Build trên server (bỏ qua digest bất biến, build cache 140GB từng làm đầy ổ). PAT dài hạn lưu trên server để pull.
- **Rationale:** Không có runner/build cache của TAMI trên server; image bất biến theo digest nên "đúng cái đã test ở staging" kiểm chứng được cả ở GitHub (output) lẫn ở server (history); secret ngắn hạn.
- **Consequences:** Nhánh mặc định repo phải là `staging` (workflow_run chỉ đọc workflow từ nhánh mặc định). Environment/secret/reviewer phải tạo thủ công trên GitHub (docs/runbooks/deploy.md). Migration đã chạy không rollback được: migration phải backward-compatible, health fail chỉ đưa image về bản trước. Không `docker builder prune` (không build trên server); chỉ xoá image tami cũ. Action pin theo commit SHA đầy đủ (tra bằng `git ls-remote`). Release dir theo SHA thay `/opt/tami/repo` dùng chung để tránh staging commit mới ghi đè compose production đang chờ khoá; đường dẫn bind mount đổi một lần khi chuyển bố cục (postgres có thể bị tạo lại một lần). Chưa chạy thật: lần đầu ở layer-6-task-01.
