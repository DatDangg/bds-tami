# Brainstorm log — TAMI (/start bước 2, 16/10/2026)

## Phase 0 — Scan
- `scripts/detect-profile.mjs`: chưa có app (`has_app: false`), không package.json/lockfile, `db_tool: none` (auto-detect, sai so với thiết kế).
- Spec/docs đã trả lời: stack (Next.js + Payload 3), DB (PostgreSQL + PostGIS), auth (Payload session, `staff`), realtime (không), upload (SeaweedFS S3), payment (không), UI (Tailwind + shadcn/ui), Scalability Option on / Standard. → Không hỏi lại.

## Q&A
| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | B2 — Sale được tạo/sửa loại bài nào | Trừ Dịch vụ + trang pháp lý (chỉ admin) |
| 2 | B4 — Nút tìm kiếm header | Dẫn tới `/cho-thue?q=`, không tìm toàn site |
| 3 | Usage gate | Làm tiếp; tắt usage gate (`.context/session-policy.json` `enabled: false`) |
| 4 | Auto push sau PASS | Không, chỉ commit (`auto_push_after_pass: false`) |
| 5 | Models | builder sonnet · builder_strong opus · reviewer opus · spec_validator opus · change_request opus |
| 6 | Phạm vi build đầu | Full Must + Should; Could ở layer cuối |
| 7 | Config suy ra từ docs (pnpm, Payload migrate, docker-vps + GitHub Actions, monitoring, breakpoints DESIGN) | Đúng, ghi luôn |

## Kết quả
- `.context/project-config.md` đã ghi; verify permissions đã sync (`pnpm test`, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; không auto-allow `pnpm payload migrate`).
- `node scripts/sync-claude.mjs` → `.claude/agents/*` nhận model mới.
- Design doc: `docs/specs/2026-10-16-tami-website-design.md` (chờ duyệt).
- `.env.local`: chưa tạo — chưa có secret nào được cung cấp.
