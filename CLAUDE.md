# CLAUDE.md — entry point cho Claude Code

@AGENTS.md

> File này chỉ là **adapter runtime**: luật/workflow nằm ở `AGENTS.md` (import ở trên) + `.agent/*.md`.
> Mọi chỗ trong `AGENTS.md` / `.agent/` / `.opencode/` nói tool hoặc config của opencode → dịch theo bảng dưới.
> `AGENTS.md` vẫn **always wins**; file này chỉ đổi *cách gọi*, không đổi luật.

## Runtime mapping (opencode → Claude Code)

| opencode | Claude Code |
|---|---|
| `AGENTS.md` nạp tự động | `CLAUDE.md` (`@AGENTS.md`) nạp tự động — kể cả cho subagent; **không Read lại** |
| Subagent `.opencode/agent/<tên>.md`, gọi qua tool `task` | Subagent `.claude/agents/<tên>.md`, gọi qua tool **`Agent`** với `subagent_type: "<tên>"` |
| Slash command `.opencode/command/<tên>.md` | `.claude/commands/<tên>.md` (cùng tên: `/start`, `/change`, `/bug`, `/feature`, `/resume`…) — `$ARGUMENTS` giữ nguyên |
| Skill `skills/<tên>/SKILL.md` qua `opencode.jsonc → skills.paths` | `.claude/skills/<tên>/SKILL.md` (wrapper) → Read `skills/<tên>/SKILL.md`; workflow ghi path `skills/...` thì cứ Read thẳng |
| tool `question` | tool **`AskUserQuestion`** (checkpoint, usage gate, chọn thứ tự bug…) |
| tool `todowrite` / todo list | `TodoWrite` / task list của client |
| tool `read` / `edit` / `write` / `grep` / `glob` / `bash` | `Read` / `Edit` / `Write` / `Grep` / `Glob` / `Bash` |
| subagent `explore` | `Agent` với `subagent_type: "Explore"` — **cùng luật chi phí** (§ Tool Loop Guard: tối đa 1 lần/điều tra, cấm khi đã có `file:line`) |
| tool `usage()` (plugin `loop-guard`) | Hook `.claude/hooks/session-handoff.mjs usage` tự chèn dòng `usage: …` sau mỗi lần gọi `Agent` **khi ≥ threshold**. Không thấy dòng đó = dưới ngưỡng, khỏi hỏi |
| Compaction reminder (plugin `loop-guard`) | Hook `SessionStart` (matcher `compact`) → nhắc re-read Run Journal |
| `opencode.jsonc → permission.bash` (deny git push main/force/reset, DB destructive) | **Hook `.claude/hooks/guard.mjs`** (PreToolUse, gate cứng — chạy cả ở bypass mode) + `.claude/settings.json → permissions.deny` (lớp phụ) |
| `permission.task."builder-strong": "allow"` | Gọi `Agent` với `subagent_type: "builder-strong"` **không** prompt duyệt (auto allow, user 2026-10-21) |
| Cài skill ngoài: `npx skills use <repo>@<skill> --agent opencode` (vd archify) | Đổi `--agent opencode` → `--agent claude-code`; MCP server (vd `blitzstrike`) khai trong `.mcp.json` / `claude mcp add` thay vì config opencode |
| Per-agent bash/edit permission (reviewer, spec-validator, builder) | Hook `guard.mjs` đọc `agent_type`: builder/builder-strong/reviewer/spec-validator **không** `git commit`/`push`; reviewer/spec-validator chỉ `Write`/`Edit` trong `.context/review-reports/**`. reviewer/spec-validator còn bị giới hạn `tools:` |
| Allow verify command cho reviewer (`# verify-commands` block) | `node scripts/apply-verify-permissions.mjs --write` ghi cả `.claude/settings.json → permissions.allow` (`Bash(<cmd>)` exact) |
| `model:` trong frontmatter `.opencode/agent/*.md` | Khai `models:` trong `.context/project-config.md` bằng giá trị Claude (`sonnet` / `opus` / `haiku` / `claude-*` / `anthropic/claude-*`) → `node scripts/sync-claude.mjs` ghi vào `.claude/agents/*.md`. Giá trị provider khác → `inherit` |
| "builder ≠ reviewer, khác họ provider" | Claude Code chỉ chạy model Anthropic → dùng **khác tier** (vd builder `sonnet`, reviewer `opus`) |
| `steps:` / `temperature:` | Không có tương đương — tuân § Tool Loop Guard (Glob/Grep ≤ 15, không lặp lệnh) |
| "restart opencode" sau khi đổi agent/command/config | Chạy `node scripts/sync-claude.mjs` rồi mở session mới (hoặc `/agents` để reload agent) |
| `~/.config/opencode/config.json` (brainstorm đọc danh sách model) | Không có — hỏi user chọn `sonnet` / `opus` / `haiku` hoặc model id |

## Khác biệt bắt buộc phải nhớ

1. **Subagent lồng được** (mặc định tối đa 3 tầng dưới session chính): `/change` → `change-request` → `builder` / `reviewer` /
   `spec-validator` / `spec-publisher` chạy giống opencode. `change-request` để trống `tools:` nên có tool `Agent`.
   `Explore` / `Plan` built-in **không** nạp `CLAUDE.md` → khi spawn phải truyền đủ rule cần thiết trong prompt.
2. **Run Journal / banner không đổi:** primary ghi `.context/runs/...` write-ahead trước/sau mỗi lần gọi `Agent`,
   in `▶ START [agent: <tên>]` / `✅ DONE [agent: <tên>]`. Subagent trả report mở đầu `Agent: <tên>`.
3. **Human checkpoint** → dừng turn và hỏi (`AskUserQuestion` hoặc in câu "Reply ok…"). Bypass/auto mode **không**
   thay cho checkpoint của workflow.
4. **Git gate:** hook `guard.mjs` đọc `forbidden_branch` từ `.context/project-config.md` (mặc định `main`) — đổi branch cấm
   không cần sửa config. Hook bị chặn → **DỪNG**, không đổi biến thể lệnh (§ Tool Loop Guard).
5. **Usage gate:** hook tính % theo `usageGate.contextLimit` trong `.context/session-policy.json` (mặc định 200000).
   Model context 1M → đặt `contextLimit: 1000000`, không thì gate hỏi End quá sớm.

## Đồng bộ `.claude/` từ nguồn opencode

Nguồn sự thật: `.opencode/agent/`, `.opencode/command/`, `skills/`. `.claude/agents|commands|skills/` là **file sinh**.

```bash
node scripts/sync-claude.mjs            # sinh/cập nhật
node scripts/sync-claude.mjs --check    # CI: fail nếu lệch
```

Sửa tay `.claude/settings.json` và `.claude/hooks/` được (script không đụng). Không sửa tay file có header
`generated by scripts/sync-claude.mjs` — lần sync sau sẽ ghi đè.
