#!/usr/bin/env node
/**
 * guard.mjs — PreToolUse gate cứng cho Claude Code (bản tương đương `opencode.jsonc` permission + per-agent permission).
 *
 * Vì sao cần ngoài `.claude/settings.json → permissions.deny`:
 *  - deny rule chỉ match text lệnh, và không scope theo subagent;
 *  - hook chạy ở MỌI permission mode (kể cả bypass) và nhận `agent_type` khi đang chạy trong subagent.
 *
 * Luật (AGENTS.md § Non-negotiables, § Commit-First, .opencode/agent/*.md frontmatter):
 *  - Mọi agent: cấm git push trần / force / --all / --mirror / xoá remote branch / push forbidden_branch,
 *    cấm `git reset --hard`, `git checkout --`, lệnh DB destructive (db push, migrate reset, seed/reset).
 *  - builder, builder-strong, reviewer, spec-validator: cấm `git commit` / `git push` (chỉ primary commit).
 *    Ngoại lệ: builder/builder-strong được `git commit` khi thư mục làm việc nằm trong `<project>/.worktrees/`
 *    (chạy song song worktree-per-task, .agent/loop.md § Parallel Execution Model). Push vẫn cấm.
 *  - reviewer, spec-validator: chỉ được Write/Edit trong `.context/review-reports/**`.
 * forbidden_branch đọc từ `.context/project-config.md` (mặc định `main`).
 * Lỗi parse input → cho qua (exit 0, không output) để không làm hỏng session.
 */

import fs from 'node:fs'
import path from 'node:path'

const NO_COMMIT_AGENTS = new Set(['builder', 'builder-strong', 'reviewer', 'spec-validator'])
const WORKTREE_COMMIT_AGENTS = new Set(['builder', 'builder-strong'])
const REPORT_ONLY_AGENTS = new Set(['reviewer', 'spec-validator'])
const REPORT_DIR = '.context/review-reports/'

const DB_DESTRUCTIVE = [
  /prisma\s+db\s+push/i, /drizzle-kit\s+push/i, /prisma\s+migrate\s+reset/i, /prisma\s+db\s+seed/i,
  /supabase\s+db\s+reset/i, /\bdb:(push|reset|seed)\b/i,
]

function readForbiddenBranch(projectDir) {
  try {
    const text = fs.readFileSync(path.join(projectDir, '.context', 'project-config.md'), 'utf8')
    const m = text.match(/^forbidden_branch:\s*([^\s#]+)/m)
    return m && !/^(null|~|<.*>)$/.test(m[1]) ? m[1] : 'main'
  } catch {
    return 'main'
  }
}

// Tách lệnh ghép theo && || ; | và xuống dòng để soi từng lệnh con.
function subcommands(command) {
  return command.split(/&&|\|\||[;|\n]/).map((s) => s.trim()).filter(Boolean)
}

function pushViolation(args, forbidden) {
  const tokens = args.split(/\s+/).filter(Boolean)
  const flags = tokens.filter((t) => t.startsWith('-'))
  const positional = tokens.filter((t) => !t.startsWith('-'))
  if (flags.some((f) => /^(--force.*|-f|--all|--mirror|--delete|-d|--prune)$/.test(f) || /^-[a-z]*f/.test(f))) {
    return 'push với --force/-f/--all/--mirror/--delete'
  }
  if (positional.length < 2) return 'git push trần — phải `git push origin <target_branch>`'
  for (const ref of positional.slice(1)) {
    if (ref.startsWith('+')) return 'force refspec (+ref)'
    if (ref.startsWith(':')) return 'xoá remote branch (:ref)'
    const dst = ref.includes(':') ? ref.split(':').pop() : ref
    if (dst === forbidden || dst === `refs/heads/${forbidden}`) return `push vào forbidden_branch \`${forbidden}\``
  }
  return null
}

// Git Bash path `/d/prj/x` → `d:/prj/x`; bỏ quote; so sánh lowercase dấu `/`.
function normDir(dir) {
  return dir.replace(/^["']|["']$/g, '').replace(/^\/([a-zA-Z])(\/|$)/, '$1:/').replace(/\\/g, '/')
}

function resolveDir(base, dir) {
  return path.resolve(base, normDir(dir)).replace(/\\/g, '/').toLowerCase()
}

function insideWorktree(dir, projectDir) {
  const root = resolveDir(projectDir, '.worktrees') + '/'
  return dir.startsWith(root)
}

function bashViolation(command, agentType, forbidden, cwd, projectDir) {
  let dir = resolveDir(projectDir, cwd)
  for (const sub of subcommands(command)) {
    const cd = sub.match(/^cd\s+(\S+)$/)
    if (cd) { dir = resolveDir(dir, cd[1]); continue }
    if (DB_DESTRUCTIVE.some((re) => re.test(sub))) return `lệnh DB destructive bị cấm: \`${sub}\` (dùng migration versioned)`
    const git = sub.match(/(?:^|\s)git(?:\s+-C\s+\S+|\s+-c\s+\S+)*\s+(\S+)(.*)$/)
    if (!git) continue
    const [, verb, rest] = git
    const gitC = sub.match(/(?:^|\s)git\s+-C\s+(\S+)/)
    const gitDir = gitC ? resolveDir(dir, gitC[1]) : dir
    if (verb === 'reset' && /--hard/.test(rest)) return '`git reset --hard` bị cấm (redo trên đĩa, không revert)'
    if (verb === 'checkout' && /(^|\s)--(\s|$)/.test(rest)) return '`git checkout --` bị cấm'
    const worktreeCommit = verb === 'commit' && WORKTREE_COMMIT_AGENTS.has(agentType) && insideWorktree(gitDir, projectDir)
    if (NO_COMMIT_AGENTS.has(agentType) && (verb === 'commit' || verb === 'push') && !worktreeCommit) {
      return `agent \`${agentType}\` KHÔNG được git ${verb} — chỉ primary commit sau Reviewer PASS`
    }
    if (verb === 'push') {
      const reason = pushViolation(rest, forbidden)
      if (reason) return reason
    }
  }
  return null
}

function writeViolation(filePath, agentType, projectDir) {
  if (!REPORT_ONLY_AGENTS.has(agentType) || !filePath) return null
  const rel = path.relative(projectDir, path.resolve(projectDir, filePath)).replace(/\\/g, '/')
  return rel.startsWith(REPORT_DIR) ? null : `agent \`${agentType}\` chỉ được ghi report trong \`${REPORT_DIR}**\` (không sửa source: ${rel})`
}

function decide(permissionDecision, permissionDecisionReason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason },
  }))
}

function deny(reason) {
  decide('deny', `[guard] ${reason}. Theo AGENTS.md § Tool Loop Guard: DỪNG, không thử biến thể khác; ghi Blocked nếu cần.`)
}

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  const agentType = input.agent_type || ''
  const toolInput = input.tool_input || {}
  let reason = null
  if (input.tool_name === 'Bash') reason = bashViolation(String(toolInput.command || ''), agentType, readForbiddenBranch(projectDir), input.cwd || projectDir, projectDir)
  else reason = writeViolation(toolInput.file_path || toolInput.notebook_path, agentType, projectDir)
  if (reason) deny(reason)
} catch {
  // defensive: never break the session
}
